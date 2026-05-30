import { motion, AnimatePresence } from "motion/react";
import { X, ArrowLeft, Phone, Lock, User, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import EC2LoadingScreen from "./EC2LoadingScreen";

// Lambda API Gateway for auth (always available, even when EC2 is sleeping)
// EC2 API for everything else (orders, payments, etc.)
const LAMBDA_BASE = import.meta.env.VITE_LAMBDA_API_URL || "https://api.gutmantra.in";
const API_BASE = import.meta.env.VITE_API_URL || "https://api.gutmantra.in";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  const stripped = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  const withCountry = stripped.startsWith("91") ? stripped : "91" + stripped;
  return "+" + withCountry.slice(0, 12);
}

function isValidPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "At least 8 characters required.";
  if (!/[A-Z]/.test(pw)) return "Must include an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Must include a lowercase letter.";
  if (!/\d/.test(pw)) return "Must include a number.";
  if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw))
    return "Must include a special character.";
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalMode =
  | "login"            // Phone + Password
  | "signup-info"      // Name + Phone
  | "signup-otp"       // OTP verification (signup)
  | "signup-password"  // Set password (signup)
  | "forgot-phone"     // Phone (forgot password)
  | "forgot-otp"       // OTP verification (forgot password)
  | "forgot-reset";    // New password

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionExpired?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginModal({
  isOpen,
  onClose,
  sessionExpired = false,
}: LoginModalProps) {
  const { loginWithPhonePassword } = useAuth();

  const [mode, setMode] = useState<ModalMode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [resendTimer, setResendTimer] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  // EC2 boot screen: set to wait_seconds when Lambda triggers EC2 start
  const [ec2BootSeconds, setEc2BootSeconds] = useState<number | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode("login");
      setPhone("");
      setName("");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setError("");
      setSuccess("");
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  // OTP expiry countdown
  useEffect(() => {
    const isOtpMode = mode === "signup-otp" || mode === "forgot-otp";
    if (!isOtpMode) return;
    setOtpTimer(300);
    const id = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setError("OTP expired. Please request a new one.");
          setMode(mode === "signup-otp" ? "signup-info" : "forgot-phone");
          setOtp("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  // Resend cooldown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? (clearInterval(id), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const displayPhone = phone.replace("+91", "");
  const timerPct = (otpTimer / 300) * 100;
  const fmtTimer = `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}`;

  // ── Shared: send OTP ────────────────────────────────────────────────────────

  const sendOtp = async (): Promise<boolean> => {
    setError("");
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6–9.");
      return false;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${LAMBDA_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setError(data.error || `Too many requests. Wait ${data.retryAfter ?? 60}s.`);
          if (data.retryAfter) setResendTimer(data.retryAfter);
        } else {
          setError(data.error || "Failed to send OTP.");
        }
        return false;
      }
      setResendTimer(60);
      setAttemptsLeft(3);
      setOtp("");
      return true;
    } catch {
      setError("Network error. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared: verify OTP and sign in with custom token ──────────────────────

  const verifyOtp = async (): Promise<boolean> => {
    setError("");
    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return false;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${LAMBDA_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const status = res.status;
        if (status === 429) {
          setError("Too many incorrect attempts. Request a new OTP.");
          setMode(mode === "signup-otp" ? "signup-info" : "forgot-phone");
        } else if (status === 410) {
          setError("OTP has expired. Request a new one.");
          setMode(mode === "signup-otp" ? "signup-info" : "forgot-phone");
        } else if (status === 401) {
          const match = (data.error || "").match(/(\d+) attempt/);
          const remaining = match ? parseInt(match[1]) : attemptsLeft - 1;
          setAttemptsLeft(remaining);
          if (remaining <= 0) {
            setMode(mode === "signup-otp" ? "signup-info" : "forgot-phone");
          }
          setError(data.error || "Incorrect OTP.");
        } else {
          setError(data.error || "Verification failed.");
        }
        return false;
      }
      // Sign in with the custom token so we can get an ID token for set-password
      await signInWithCustomToken(auth, data.customToken);
      return true;
    } catch {
      setError("Network error. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared: save password after verification ───────────────────────────────

  // Returns wait_seconds (> 0 means EC2 is booting), or -1 on failure
  const savePassword = async (pw: string, confirm: string, userName?: string): Promise<number> => {
    const pwError = validatePassword(pw);
    if (pwError) { setError(pwError); return -1; }
    if (pw !== confirm) { setError("Passwords do not match."); return -1; }

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) { setError("Authentication error. Please try again."); return -1; }

    setIsLoading(true);
    try {
      // ⚡️ Lambda set-password: sets password + triggers EC2 start on signup
      const res = await fetch(`${LAMBDA_BASE}/api/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ password: pw, confirmPassword: confirm, name: userName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save password.");
        return -1;
      }
      return data.wait_seconds ?? 0;
    } catch {
      setError("Network error. Please check your connection.");
      return -1;
    } finally {
      setIsLoading(false);
    }
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!password) { setError("Password is required."); return; }
    setIsLoading(true);
    try {
      // ⚡️ Lambda phone-login: only wakes EC2 on correct password
      const res = await fetch(`${LAMBDA_BASE}/api/auth/phone-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const code = data.code;
        if (code === "PHONE_NOT_FOUND") setError("This phone number is not registered. Please sign up.");
        else if (code === "PHONE_NOT_VERIFIED") setError("Phone not verified. Please sign up again.");
        else if (code === "NO_PASSWORD") setError("No password set. Use 'Forgot Password' to set one.");
        else if (code === "WRONG_PASSWORD") setError("Incorrect password. Please try again.");
        else setError(data.error || "Login failed. Please try again.");
        return;
      }
      // Sign into Firebase with the custom token
      await signInWithCustomToken(auth, data.customToken);
      if (data.wait_seconds > 0) {
        // EC2 is booting — show countdown before closing modal
        setEc2BootSeconds(data.wait_seconds);
      } else {
        setSuccess("Logged in successfully!");
        setTimeout(onClose, 700);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── SIGNUP ─────────────────────────────────────────────────────────────────

  const handleSignupSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim()) { setError("Full name is required."); return; }
    const ok = await sendOtp();
    if (ok) {
      setSuccess("OTP sent via SMS!");
      setMode("signup-otp");
    }
  };

  const handleSignupVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const ok = await verifyOtp();
    if (ok) {
      setSuccess("Phone verified! Now set your password.");
      setMode("signup-password");
    }
  };

  const handleSignupSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const waitSeconds = await savePassword(password, confirmPassword, name.trim());
    if (waitSeconds >= 0) {
      if (waitSeconds > 0) {
        // EC2 is booting — show countdown screen
        setEc2BootSeconds(waitSeconds);
      } else {
        setSuccess("Account created! Welcome to GutMantra!");
        setTimeout(onClose, 900);
      }
    }
  };

  // ── FORGOT PASSWORD ────────────────────────────────────────────────────────

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const ok = await sendOtp();
    if (ok) {
      setSuccess("OTP sent via SMS!");
      setMode("forgot-otp");
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const ok = await verifyOtp();
    if (ok) {
      setSuccess("Phone verified! Set your new password.");
      setMode("forgot-reset");
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const waitSeconds = await savePassword(password, confirmPassword);
    if (waitSeconds >= 0) {
      if (waitSeconds > 0) {
        setEc2BootSeconds(waitSeconds);
      } else {
        setSuccess("Password reset successfully!");
        setTimeout(onClose, 900);
      }
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResendOtp = async () => {
    setError(""); setSuccess("");
    const ok = await sendOtp();
    if (ok) setSuccess("New OTP sent!");
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────

  const headerTitle = {
    "login": "Welcome Back",
    "signup-info": "Create Account",
    "signup-otp": "Verify Phone",
    "signup-password": "Set Password",
    "forgot-phone": "Forgot Password",
    "forgot-otp": "Verify Phone",
    "forgot-reset": "Reset Password",
  }[mode];

  const headerSub = {
    "login": "Sign in with your phone number",
    "signup-info": "Enter your details to get started",
    "signup-otp": `OTP sent to +91 ${displayPhone}`,
    "signup-password": "Create a secure password",
    "forgot-phone": "Enter your registered phone number",
    "forgot-otp": `OTP sent to +91 ${displayPhone}`,
    "forgot-reset": "Enter your new password",
  }[mode];

  const canGoBack =
    mode === "signup-otp" ||
    mode === "signup-password" ||
    mode === "forgot-phone" ||
    mode === "forgot-otp" ||
    mode === "forgot-reset";

  const goBack = () => {
    setError(""); setSuccess("");
    if (mode === "signup-otp" || mode === "signup-password") setMode("signup-info");
    else if (mode === "forgot-phone") setMode("login");
    else if (mode === "forgot-otp" || mode === "forgot-reset") setMode("forgot-phone");
  };

  const isOtpMode = mode === "signup-otp" || mode === "forgot-otp";

  // EC2 boot screen — shown after successful auth when EC2 is starting
  if (ec2BootSeconds !== null) {
    return (
      <EC2LoadingScreen
        seconds={ec2BootSeconds}
        onComplete={() => {
          setEc2BootSeconds(null);
          onClose();
        }}
      />
    );
  }

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

            {/* BACK */}
            {canGoBack && (
              <button
                onClick={goBack}
                className="absolute top-4 left-4 z-20 flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            {/* HEADER */}
            <div className="px-8 pt-10 pb-6 text-center bg-primary">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow bg-white/20">
                <Phone size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">{headerTitle}</h1>
              <p className="text-white/80 text-sm mt-0.5">{headerSub}</p>

              {/* Session expired banner */}
              {sessionExpired && mode === "login" && (
                <div className="mt-4 bg-white/20 text-white text-xs font-semibold rounded-xl px-4 py-2">
                  Session expired due to inactivity. Please login again.
                </div>
              )}

              {/* Login / Sign Up tabs — only on top-level modes */}
              {(mode === "login" || mode === "signup-info") && (
                <div className="flex mt-5 rounded-xl overflow-hidden bg-white/20 p-0.5">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === "login" ? "bg-white text-primary" : "text-white/80 hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("signup-info"); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      mode === "signup-info" ? "bg-white text-primary" : "text-white/80 hover:text-white"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* BODY */}
            <div className="px-8 py-7 space-y-4">

              {/* Alerts */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span className="shrink-0 mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3">
                  <span className="shrink-0 mt-0.5">✓</span> {success}
                </div>
              )}

              {/* ── LOGIN ── */}
              {mode === "login" && (
                <form onSubmit={handleLogin} noValidate className="space-y-4">
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Password
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <Lock size={16} className="text-gray-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 bg-gray-50 border-l-2 border-gray-200 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isValidPhone(phone) || !password}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                    ) : "Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode("forgot-phone"); setError(""); setSuccess(""); }}
                    className="w-full text-center text-xs text-primary font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </form>
              )}

              {/* ── SIGNUP STEP 1: Name + Phone ── */}
              {mode === "signup-info" && (
                <form onSubmit={handleSignupSendOtp} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Full Name
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <User size={16} className="text-gray-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                        autoFocus
                      />
                    </div>
                  </div>

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
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      You'll receive a 6-digit OTP to verify your number
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !isValidPhone(phone)}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP…</>
                    ) : (
                      <><Phone size={16} /> Send OTP</>
                    )}
                  </button>
                </form>
              )}

              {/* ── OTP ENTRY (signup or forgot) ── */}
              {isOtpMode && (
                <form
                  onSubmit={mode === "signup-otp" ? handleSignupVerifyOtp : handleForgotVerifyOtp}
                  noValidate
                  className="space-y-5"
                >
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
                    ) : "Verify OTP"}
                  </button>

                  <div className="text-center">
                    {resendTimer <= 0 ? (
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

              {/* ── SET PASSWORD (signup or forgot-reset) ── */}
              {(mode === "signup-password" || mode === "forgot-reset") && (
                <form
                  onSubmit={mode === "signup-password" ? handleSignupSetPassword : handleForgotResetPassword}
                  noValidate
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      {mode === "forgot-reset" ? "New Password" : "Password"}
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <Lock size={16} className="text-gray-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 chars, upper, lower, number, symbol"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 bg-gray-50 border-l-2 border-gray-200 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Confirm Password
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                      <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                        <Lock size={16} className="text-gray-400" />
                      </span>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3.5 text-sm outline-none bg-white disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="px-3 bg-gray-50 border-l-2 border-gray-200 text-gray-400"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <ul className="text-[11px] text-gray-400 space-y-0.5 pl-1">
                    {[
                      [/.{8,}/, "At least 8 characters"],
                      [/[A-Z]/, "One uppercase letter"],
                      [/[a-z]/, "One lowercase letter"],
                      [/\d/, "One number"],
                      [/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/, "One special character"],
                    ].map(([re, label]) => (
                      <li
                        key={label as string}
                        className={`flex items-center gap-1.5 ${(re as RegExp).test(password) ? "text-green-600" : ""}`}
                      >
                        <span>{(re as RegExp).test(password) ? "✓" : "·"}</span> {label as string}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !password ||
                      !confirmPassword ||
                      !!validatePassword(password) ||
                      password !== confirmPassword
                    }
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : mode === "forgot-reset" ? "Reset Password" : "Create Account"}
                  </button>
                </form>
              )}

              {/* ── FORGOT: Enter Phone ── */}
              {mode === "forgot-phone" && (
                <form onSubmit={handleForgotSendOtp} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Registered Mobile Number
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
                      We'll send an OTP to verify your identity
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isValidPhone(phone)}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP…</>
                    ) : (
                      <><Phone size={16} /> Send OTP</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    className="w-full text-center text-xs text-gray-500 font-semibold hover:underline"
                  >
                    Back to Login
                  </button>
                </form>
              )}

              <p className="text-[11px] text-center text-gray-400 border-t pt-4">
                🌾 GutMantra · Secure Phone Login
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
