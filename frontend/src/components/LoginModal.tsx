import { motion, AnimatePresence } from "motion/react";
import { X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { WhatsAppUser } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatPhone(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  const stripped = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  const withCountry = stripped.startsWith("91") ? stripped : "91" + stripped;
  return "+" + withCountry.slice(0, 12);
}

function isValidPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366] shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setError("");
      setSuccess("");
      setOtpTimer(120);
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
  const timerPct = (otpTimer / 120) * 100;
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
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to send OTP. Please try again.");
        return;
      }
      setSuccess("OTP sent to your WhatsApp!");
      setStep("otp");
      setOtpTimer(120);
      setAttemptsLeft(5);
      setResendTimer(30);
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
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 429) { setError("Too many attempts. Please request a new OTP."); return; }
        const remaining = data.attemptsRemaining;
        if (remaining !== undefined) setAttemptsLeft(remaining);
        if (remaining === 0) { setError("Too many incorrect attempts. Please request a new OTP."); setStep("phone"); return; }
        setError(
          data.message ||
          (remaining !== undefined
            ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
            : "Failed to verify OTP.")
        );
        return;
      }
      const { token, user }: { token: string; user: WhatsAppUser } = data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(user));
      window.dispatchEvent(new Event("whatsapp-login"));
      setSuccess("Logged in successfully!");
      setTimeout(() => onClose(), 700);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResendOtp = async () => {
    setError(""); setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const wait = data.retryAfter ?? 30;
        setResendTimer(wait);
        setError(data.message || `Please wait ${wait}s before requesting another OTP.`);
        return;
      }
      setSuccess("New OTP sent to your WhatsApp!");
      setOtpTimer(120);
      setAttemptsLeft(5);
      setOtp("");
      setResendTimer(30);
    } catch {
      setError("Network error. Please check your connection.");
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
            <div className="bg-[#25D366] px-8 pt-10 pb-8 text-center">
              {step === "otp" && (
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); setSuccess(""); }}
                  className="absolute top-4 left-4 z-20 flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold transition"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">GutMantra</h1>
              <p className="text-white/80 text-sm mt-0.5">
                {step === "phone" ? "Sign in with WhatsApp OTP" : `Code sent to ${phone}`}
              </p>
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

              {/* ── PHONE STEP ── */}
              {step === "phone" && (
                <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      WhatsApp Number
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-[#25D366] overflow-hidden transition-colors">
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
                      You'll receive a 6-digit code on WhatsApp
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isValidPhone(phone)}
                    className="w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                    ) : (
                      <>{WA_ICON} Send OTP</>
                    )}
                  </button>
                </form>
              )}

              {/* ── OTP STEP ── */}
              {step === "otp" && (
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
                      className="w-full px-5 py-4 text-2xl font-bold text-center tracking-[0.5em] rounded-xl border-2 border-gray-200 focus:border-[#25D366] outline-none transition-colors disabled:opacity-50"
                      autoFocus
                    />

                    {/* Timer bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${otpTimer < 30 ? "bg-red-500" : "bg-[#25D366]"}`}
                          style={{ width: `${timerPct}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 font-semibold ${otpTimer < 30 ? "text-red-500" : "text-gray-400"}`}>
                        Expires in {fmtTimer}
                      </p>
                    </div>
                  </div>

                  {attemptsLeft < 5 && attemptsLeft > 0 && (
                    <p className="text-xs text-orange-500 font-semibold text-center">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
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
                        className="text-sm font-bold text-[#25D366] hover:underline disabled:opacity-50"
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
                🌾 GutMantra · No password needed
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
