import { motion, AnimatePresence } from "motion/react";
import { X, ArrowLeft, Mail, Lock, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.gutmantra.in";

function formatPhone(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  const stripped = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  const withCountry = stripped.startsWith("91") ? stripped : "91" + stripped;
  return "+" + withCountry.slice(0, 12);
}

function isValidPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithEmail, signupWithEmail, loginWithPhone } = useAuth();

  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [emailStep, setEmailStep] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setMode("phone");
      setEmailStep("signin");
      setEmail(""); setPassword(""); setName("");
      setStep("phone");
      setPhone("");
      setOtp("");
      setError("");
      setSuccess("");
      setOtpTimer(300);
      setResendTimer(0);
      setAttemptsLeft(5);
    }
  }, [isOpen]);

  // OTP expiry countdown
  useEffect(() => {
    if (step !== "otp") return;
    const id = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setError("OTP expired. Please request a new one.");
          setStep("phone");
          setOtp("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Resend cooldown
  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? (clearInterval(id), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const displayPhone = phone.replace("+91", "");
  const timerPct = (otpTimer / 300) * 100;
  const fmtTimer = `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}`;

  /* ── Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6–9.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const wait = data.retryAfter;
        if (res.status === 429) {
          setError(data.error || `Too many requests. Please wait ${wait ?? 60}s.`);
          if (wait) setResendTimer(wait);
          return;
        }
        setError(data.error || "Failed to send OTP. Please try again.");
        return;
      }
      setSuccess("OTP sent via SMS!");
      setStep("otp");
      setOtpTimer(300);
      setAttemptsLeft(3);
      setResendTimer(60);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (otp.length !== 6) { setError("OTP must be 6 digits."); return; }
    setIsLoading(true);
    try {
      const { isNewUser } = await loginWithPhone(phone, otp);
      setSuccess(isNewUser ? "Account created! Welcome to GutMantra!" : "Logged in successfully!");
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      const status = err?.status;
      if (status === 429) {
        setError("Too many incorrect attempts. Please request a new OTP.");
        setStep("phone");
      } else if (status === 410) {
        setError("OTP has expired. Please request a new one.");
        setStep("phone");
      } else if (status === 401) {
        const msg: string = err?.message || "";
        const match = msg.match(/(\d+) attempt/);
        const remaining = match ? parseInt(match[1]) : undefined;
        if (remaining !== undefined) setAttemptsLeft(remaining);
        if (remaining === 0) { setStep("phone"); return; }
        setError(msg || "Incorrect OTP. Please try again.");
      } else {
        setError(err?.message || "Failed to verify OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResendOtp = async () => {
    setError(""); setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const wait = data.retryAfter ?? 60;
        setResendTimer(wait);
        setError(data.error || `Please wait ${wait}s before requesting another OTP.`);
        return;
      }
      setSuccess("New OTP sent via SMS!");
      setOtpTimer(300);
      setAttemptsLeft(3);
      setOtp("");
      setResendTimer(60);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Email Auth ── */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setIsLoading(true);
    try {
      if (emailStep === "signin") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError("Name is required."); setIsLoading(false); return; }
        await signupWithEmail(email, password, name.trim());
      }
      setSuccess(emailStep === "signin" ? "Signed in!" : "Account created!");
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Sign in instead.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-black/5 transition"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {/* HEADER */}
            <div className={`px-8 pt-10 pb-6 text-center ${mode === "phone" ? "bg-primary" : "bg-primary"}`}>
              {step === "otp" && mode === "phone" && (
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); setSuccess(""); }}
                  className="absolute top-4 left-4 z-20 flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold transition"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow bg-white/20">
                {mode === "phone" ? (
                  <Phone size={28} className="text-white" />
                ) : (
                  <Mail size={28} className="text-white" />
                )}
              </div>
              <h1 className="text-xl font-bold text-white">GutMantra</h1>
              <p className="text-white/80 text-sm mt-0.5">
                {mode === "phone"
                  ? (step === "phone" ? "Sign in with SMS OTP" : `OTP sent to ${displayPhone}`)
                  : (emailStep === "signin" ? "Sign in with email" : "Create an account")}
              </p>

              {/* Mode tabs */}
              <div className="flex mt-5 rounded-xl overflow-hidden bg-white/20 p-0.5">
                <button
                  type="button"
                  onClick={() => { setMode("phone"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === "phone" ? "bg-white text-primary" : "text-white/80 hover:text-white"}`}
                >
                  Phone OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === "email" ? "bg-white text-primary" : "text-white/80 hover:text-white"}`}
                >
                  Email
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="px-8 py-7 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span className="shrink-0 mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 bg-green-50 text-[#128C7E] text-sm rounded-xl px-4 py-3">
                  <span className="shrink-0 mt-0.5">✓</span> {success}
                </div>
              )}

              {/* ── EMAIL MODE ── */}
              {mode === "email" && (
                <form onSubmit={handleEmailAuth} noValidate className="space-y-4">
                  {emailStep === "signup" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm transition-colors disabled:opacity-50"
                        autoFocus
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <Mail size={16} className="text-gray-400" />
                      </span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                        autoFocus={emailStep === "signin"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <Lock size={16} className="text-gray-400" />
                      </span>
                      <input
                        type="password"
                        placeholder={emailStep === "signup" ? "Min. 6 characters" : "Your password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {emailStep === "signin" ? "Signing in…" : "Creating account…"}</>
                    ) : (emailStep === "signin" ? "Sign In" : "Create Account")}
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    {emailStep === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => { setEmailStep(emailStep === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
                      className="font-bold text-primary hover:underline"
                    >
                      {emailStep === "signin" ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </form>
              )}

              {/* ── PHONE STEP ── */}
              {mode === "phone" && step === "phone" && (
                <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Mobile Number
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-4 bg-gray-50 text-gray-600 font-semibold text-sm border-r-2 border-gray-200 shrink-0">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        placeholder="9028107111"
                        value={displayPhone}
                        onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(""); }}
                        disabled={isLoading}
                        maxLength={10}
                        className="flex-1 px-4 py-3.5 text-base outline-none bg-white disabled:opacity-50"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      You'll receive a 6-digit OTP via SMS
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isValidPhone(phone)}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                    ) : (
                      <><Phone size={16} /> Send OTP</>
                    )}
                  </button>
                </form>
              )}

              {/* ── OTP STEP ── */}
              {mode === "phone" && step === "otp" && (
                <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      disabled={isLoading}
                      maxLength={6}
                      className="w-full px-5 py-4 text-2xl font-bold text-center tracking-[0.5em] rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors disabled:opacity-50"
                      autoFocus
                    />

                    {/* Timer bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${otpTimer < 60 ? "bg-red-500" : "bg-primary"}`}
                          style={{ width: `${timerPct}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 font-semibold ${otpTimer < 60 ? "text-red-500" : "text-gray-400"}`}>
                        Expires in {fmtTimer}
                      </p>
                    </div>
                  </div>

                  {attemptsLeft < 3 && attemptsLeft > 0 && (
                    <p className="text-xs text-orange-500 font-semibold text-center">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    ) : "Verify & Sign In"}
                  </button>

                  <div className="text-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Resend in <span className="font-bold text-gray-600">{resendTimer}s</span>
                      </p>
                    )}
                  </div>
                </form>
              )}

              <p className="text-[11px] text-center text-gray-400 border-t pt-4">
                🌾 GutMantra · Phone OTP or Email login
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
