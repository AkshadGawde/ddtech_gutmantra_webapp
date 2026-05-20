import { motion, AnimatePresence } from "motion/react";

import {
  X,
  Loader,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import { useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
}: LoginModalProps) {
  const {
    login,
    loginWithEmail,
    signupWithEmail,
  } = useAuth();

  const [isLoading, setIsLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [step, setStep] = useState<
    "phone" | "otp" | "link-account"
  >("link-account");

  // Preserved OTP state for future re-enable.
  // const [phone, setPhone] = useState("+91");
  // const [otp, setOtp] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] = useState("");

  const [isSignup, setIsSignup] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================================================
      GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await login();

      onClose();
    } catch (error: any) {
      setError(
        error.message || "Google login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
      OTP AUTH (temporarily disabled)

      Phone OTP flow is preserved here for future re-enable,
      but it is not exposed in the current UI or auth context.
  ========================================================= */

  /*
  const handleSendOTP = async () => {
    try {
      setError("");
      setIsLoading(true);

      if (!phone.startsWith("+91")) {
        throw new Error(
          "Phone number must start with +91"
        );
      }

      await sendPhoneOTP(
        phone,
        "recaptcha-container"
      );

      setStep("otp");
    } catch (error: any) {
      setError(
        error.message || "Failed to send OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setError("");
      setIsLoading(true);

      const result =
        await verifyPhoneOTP(otp);

      if (result.isExistingUser) {
        onClose();
      } else {
        setStep("link-account");
      }
    } catch (error: any) {
      setError(
        error.message || "OTP verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);

      await linkPhoneToExistingAccount(
        email,
        password
      );

      onClose();
    } catch (error: any) {
      setError(
        error.message ||
          "Failed to link existing account"
      );
    } finally {
      setIsLoading(false);
    }
  };
  */

  /* =========================================================
      EMAIL LOGIN
  ========================================================= */

  const handleEmailLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);

      await loginWithEmail(email, password);

      onClose();
    } catch (error: any) {
      setError(
        error.message || "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
      EMAIL SIGNUP
  ========================================================= */

  const handleEmailSignup = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);

      await signupWithEmail(
        email,
        password,
        name
      );

      onClose();
    } catch (error: any) {
      setError(
        error.message || "Signup failed"
      );
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
            initial={{
              scale: 0.95,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.95,
              opacity: 0,
              y: 20,
            }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* CLOSE BUTTON */}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-black/5 transition"
            >
              <X
                size={22}
                className="text-gray-500"
              />
            </button>

            {/* HEADER */}

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 pt-10 pb-7">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
                <ShieldCheck size={30} />
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to GutMantra
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                Fast login with Email or Google.
              </p>
            </div>

            {/* CONTENT */}

            <div className="p-6 space-y-5">
              {/* ERROR */}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Phone / OTP login option is temporarily disabled. Use Email or Google login instead. */}

              {/* OTP login flow is hidden while temporary phone OTP bypass is active. */}

              {/* EMAIL LINK / LOGIN */}

              {step === "link-account" && (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full border-2 border-primary/20 py-3 rounded-xl font-bold text-sm hover:bg-primary/5 transition"
                  >
                    Continue with Google
                  </button>

                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs text-gray-400 font-bold uppercase">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={
                      isSignup
                        ? handleEmailSignup
                        : handleEmailLogin
                    }
                    className="space-y-4"
                  >
                    {isSignup && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setName(
                              e.target.value
                            )
                          }
                          placeholder="John Doe"
                          className="w-full px-4 py-4 border border-gray-300 rounded-xl"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="absolute left-4 top-4 text-gray-400"
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            setEmail(
                              e.target.value
                            )
                          }
                          placeholder="your@email.com"
                          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                        Password
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="••••••••"
                          className="w-full px-4 py-4 border border-gray-300 rounded-xl"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="absolute right-4 top-4 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest"
                    >
                      {isLoading ? (
                        <Loader
                          size={18}
                          className="animate-spin mx-auto"
                        />
                      ) : isSignup ? (
                        "Create Account"
                      ) : (
                        "Login"
                      )}
                    </button>
                  </form>

                  <button
                    onClick={() =>
                      setIsSignup(
                        !isSignup
                      )
                    }
                    className="w-full text-center text-sm text-primary font-bold hover:underline"
                  >
                    {isSignup
                      ? "Already have account?"
                      : "Create new account instead"}
                  </button>

                </>
              )}

              {/* FOOTER */}

              <p className="text-xs text-center text-gray-400 leading-relaxed pt-3 border-t">
                🌾 GutMantra • Secure authentication with Email and Google
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}