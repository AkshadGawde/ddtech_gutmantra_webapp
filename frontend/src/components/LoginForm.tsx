import React, { useState } from "react";
import { useAuthFlow } from "@/hooks/useAuthFlow";

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [phone, setPhone] = useState("");

  const { login, register, loading, error } = useAuthFlow();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      onSuccess?.();
      window.location.href = redirectTo;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await register(email, password, phone);

    if (result.success) {
      onSuccess?.();
      window.location.href = redirectTo;
    }
  };

  const handleSubmit = isLoginMode ? handleLogin : handleRegister;
  const buttonText = loading ? (isLoginMode ? "Logging in..." : "Registering...") : isLoginMode ? "Login" : "Register";

  return (
    <div className="auth-form">
      <h2>{isLoginMode ? "Login" : "Register"}</h2>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            required
          />
        </div>

        {!isLoginMode && (
          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              disabled={loading}
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary">
          {buttonText}
        </button>
      </form>

      <div className="auth-toggle">
        <p>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setEmail("");
              setPassword("");
              setPhone("");
            }}
            className="link-button"
          >
            {isLoginMode ? "Register" : "Login"}
          </button>
        </p>
      </div>

      <style jsx>{`
        .auth-form {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        h2 {
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 10px;
          margin-bottom: 16px;
          background-color: #fee;
          color: #c33;
          border-radius: 4px;
          font-size: 14px;
        }

        .btn-primary {
          width: 100%;
          padding: 12px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-toggle {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
        }

        .link-button {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          text-decoration: underline;
        }

        .link-button:hover {
          color: #0052a3;
        }
      `}</style>
    </div>
  );
}
