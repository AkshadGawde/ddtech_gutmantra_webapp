import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { WhatsAppUser } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Phone helpers ─────────────────────────────────────────────────────────────

function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  // Strip leading 0
  const stripped = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  // Ensure 91 prefix
  const withCountry = stripped.startsWith("91") ? stripped : "91" + stripped;
  return "+" + withCountry.slice(0, 12); // +91XXXXXXXXXX = 13 chars
}

function isValidPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

// ── Component ─────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.from || "/profile";

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("authToken")) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo]);

  // ── State ───────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");          // stored as +91XXXXXXXXXX
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(120);  // 2-min validity
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // ── OTP validity countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "otp") return;
    const id = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setError("OTP expired. Please request a new one.");
          setStage("phone");
          setOtp("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  // ── Resend cooldown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
    setError("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const displayPhone = phone.replace("+91", "") || "";

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6–9).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message || "Failed to send OTP. Please try again.";
        if (res.status === 401) setError("WhatsApp API error. Please contact support.");
        else if (res.status === 400) setError("Invalid phone number format.");
        else setError(msg);
        return;
      }

      setSuccess("✓ OTP sent to your WhatsApp!");
      setStage("otp");
      setOtpTimer(120);
      setAttemptsLeft(5);
      setResendTimer(30);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setError("Too many attempts. Please request a new OTP.");
          return;
        }
        const remaining = data.attemptsRemaining;
        if (remaining !== undefined) setAttemptsLeft(remaining);
        if (remaining === 0) {
          setError("Too many incorrect attempts. Please request a new OTP.");
          setStage("phone");
          return;
        }
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

      // Dispatch event so AuthContext picks up the change
      window.dispatchEvent(new Event("whatsapp-login"));

      setSuccess("✓ OTP verified. Logging in…");
      setTimeout(() => navigate(returnTo, { replace: true }), 800);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          const wait = data.retryAfter ?? 30;
          setResendTimer(wait);
          setError(`Please wait ${wait}s before requesting another OTP.`);
          return;
        }
        setError(data.message || "Failed to resend OTP.");
        return;
      }

      setSuccess("✓ New OTP sent to your WhatsApp!");
      setOtpTimer(120);
      setAttemptsLeft(5);
      setOtp("");
      setResendTimer(30);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStage("phone");
    setOtp("");
    setOtpTimer(120);
    setError("");
    setSuccess("");
  };

  const timerPct = (otpTimer / 120) * 100;
  const fmtTimer = `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Green header bar */}
          <div className="bg-[#25D366] px-8 pt-10 pb-8 text-center">
            {/* WhatsApp icon */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg viewBox="0 0 24 24" className="w-9 h-9 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">GutMantra</h1>
            <p className="text-white/80 text-sm mt-1">Login with WhatsApp OTP</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">

            {/* ── Stage 1: Phone ── */}
            {stage === "phone" && (
              <form onSubmit={handleSendOtp} noValidate>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Enter your number</h2>
                <p className="text-sm text-gray-500 mb-6">
                  We'll send a 6-digit code to your WhatsApp
                </p>

                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Phone Number
                </label>
                <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-[#25D366] overflow-hidden transition-colors">
                  <span className="flex items-center px-4 bg-gray-50 text-gray-600 font-semibold text-sm border-r-2 border-gray-200 shrink-0">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9028107111"
                    value={displayPhone}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    maxLength={10}
                    className="flex-1 px-4 py-3.5 text-base outline-none bg-white disabled:opacity-50"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">10-digit number starting with 6, 7, 8 or 9</p>

                {error && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-0.5">⚠</span> {error}
                  </div>
                )}
                {success && (
                  <div className="mt-4 flex items-start gap-2 bg-green-50 text-[#25D366] text-sm rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-0.5">✓</span> {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isValidPhone(phone)}
                  className="mt-6 w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send OTP via WhatsApp
                    </>
                  )}
                </button>

                <p className="mt-5 text-center text-[11px] text-gray-400">
                  A 6-digit code will be sent to your WhatsApp
                </p>
              </form>
            )}

            {/* ── Stage 2: OTP ── */}
            {stage === "otp" && (
              <form onSubmit={handleVerifyOtp} noValidate>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Enter OTP</h2>
                <p className="text-sm text-gray-500 mb-1">
                  Check your WhatsApp for a 6-digit code
                </p>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-gray-700">{phone}</span>
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className="text-xs font-bold text-[#25D366] hover:underline"
                  >
                    Change number
                  </button>
                </div>

                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={loading}
                  maxLength={6}
                  className="w-full px-5 py-4 text-2xl font-bold text-center tracking-[0.5em] rounded-xl border-2 border-gray-200 focus:border-[#25D366] outline-none transition-colors disabled:opacity-50"
                  autoFocus
                />

                {/* Timer bar */}
                <div className="mt-4">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${otpTimer < 30 ? "bg-red-500" : "bg-[#25D366]"}`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1.5 font-semibold ${otpTimer < 30 ? "text-red-500" : "text-gray-500"}`}>
                    OTP expires in {fmtTimer}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-0.5">⚠</span> {error}
                  </div>
                )}
                {success && (
                  <div className="mt-4 flex items-start gap-2 bg-green-50 text-[#25D366] text-sm rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-0.5">✓</span> {success}
                  </div>
                )}

                {attemptsLeft < 5 && attemptsLeft > 0 && (
                  <p className="mt-2 text-xs text-orange-500 font-semibold text-center">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="mt-5 w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                  ) : "Verify OTP"}
                </button>

                {/* Resend */}
                <div className="mt-4 text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm font-bold text-[#25D366] hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Resend OTP in <span className="font-bold text-gray-600">{resendTimer}s</span>
                    </p>
                  )}
                </div>

                <p className="mt-4 text-center text-[11px] text-gray-400">
                  Didn't receive the code? Check your WhatsApp spam folder.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
