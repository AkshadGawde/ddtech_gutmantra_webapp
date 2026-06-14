import { motion } from "motion/react";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";

const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    as string;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email.trim().toLowerCase() === ADMIN_EMAIL?.toLowerCase() && password === ADMIN_PASSWORD) {
        sessionStorage.setItem("gm_admin_auth", "true");
        onLoginSuccess();
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-bg-warm to-secondary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-black/5 text-center">
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1 font-medium">GutMantra · Restricted Access</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-7 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={ADMIN_EMAIL || "admin@example.com"}
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F0] rounded-xl border border-black/5 focus:outline-none focus:border-primary text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#F5F5F0] rounded-xl border border-black/5 focus:outline-none focus:border-primary text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</>
                : <><Lock size={15} /> Sign In</>}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium uppercase tracking-widest">
          Secure · Admin Only
        </p>
      </motion.div>
    </div>
  );
}
