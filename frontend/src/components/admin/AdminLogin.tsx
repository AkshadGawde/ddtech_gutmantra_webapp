import { motion } from "motion/react";
import { Lock, Mail, Loader, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

      if (userCredential.user.email === adminEmail) {
        onLoginSuccess();
      } else {
        setError("You do not have admin access.");
        await auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md px-4"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-primary/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
                <Lock size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-white/80 text-sm">Secure Access Only</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"
              >
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="font-medium text-sm">{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-medium"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-medium"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-primary border-2 border-gray-300 rounded focus:ring-primary"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
              <Lock size={14} />
              Secure connection. Your credentials are encrypted.
            </p>
          </div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-xl p-6 border border-primary/20 shadow-lg"
        >
          <h3 className="font-bold text-primary mb-3">Admin Access Only</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            This is a restricted area for administrators only. If you believe you should have access to this page, please contact the website administrator.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
