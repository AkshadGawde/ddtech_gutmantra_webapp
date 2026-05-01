import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, loginWithEmail, signupWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await login();
      onClose();
    } catch (error: any) {
      setError(error.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signupWithEmail(email, password, name);
      onClose();
    } catch (error: any) {
      setError(error.message || "Signup failed");
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Header Section */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 sm:px-8 pt-8 sm:pt-12 pb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white mb-4">
                  <Mail size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Join Our Community
                </h2>
                <p className="text-gray-600 text-sm">
                  Experience pure nutrition with GutMantra's stone-ground goodness
                </p>
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="px-6 sm:px-8 py-8 sm:py-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {!isSignup ? (
                  <>
                    {/* LOGIN FORM */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl hover:bg-primary/90 transition-all duration-200 font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading && <Loader size={18} className="animate-spin" />}
                        {isLoading ? "Signing in..." : "Sign In"}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500 font-medium">OR</span>
                      </div>
                    </div>

                    {/* Google Login Button */}
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary/20 text-gray-900 py-3.5 rounded-xl hover:bg-primary/5 transition-all duration-200 font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotate: isLoading ? 360 : 0 }}
                        transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                      >
                        {isLoading ? (
                          <Loader size={18} />
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                      </motion.div>
                      <span>Sign in with Google</span>
                    </button>

                    {/* Signup Link */}
                    <p className="text-center text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(true);
                          setEmail("");
                          setPassword("");
                          setName("");
                          setError("");
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    {/* SIGNUP FORM */}
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl hover:bg-primary/90 transition-all duration-200 font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading && <Loader size={18} className="animate-spin" />}
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(false);
                          setEmail("");
                          setPassword("");
                          setName("");
                          setError("");
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </>
                )}

                {/* Info Text */}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By signing in, you agree to our terms of service and privacy policy. Your data is secured with enterprise-grade encryption.
                </p>
              </motion.div>

              {/* Footer Branding */}
              <div className="px-0 py-4 border-t border-gray-100">
                <p className="text-xs text-center text-gray-400 font-medium">
                  🌾 GutMantra • Pure nutrition, Traditional taste
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
