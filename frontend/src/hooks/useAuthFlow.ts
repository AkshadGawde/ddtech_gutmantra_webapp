import { useState, useCallback } from "react";
import { useAuth, useUser } from "reactfire";
import { signInWithEmailAndPassword, signInWithCustomToken, signOut } from "firebase/auth";

interface LoginResponse {
  success: boolean;
  error?: string;
  code?: string;
  data?: {
    uid: string;
    email: string;
    phone?: string;
    petpoojaCustomerId?: string;
    customToken?: string;
  };
}

export function useAuthFlow() {
  const { auth } = useAuth();
  const { data: user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * Complete login flow: Try Firebase first, fallback to legacy
   */
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      setLoading(true);
      setError("");

      try {
        // Step 1: Try Firebase login
        try {
          await signInWithEmailAndPassword(auth, email, password);
          console.log("✅ Firebase login successful");
          return { success: true };
        } catch (firebaseError: any) {
          // If user doesn't exist in Firebase or password wrong, try legacy
          const firebaseCode = firebaseError?.code;

          if (firebaseCode === "auth/user-not-found" || firebaseCode === "auth/wrong-password") {
            console.log("📝 Firebase login failed, trying legacy login...");

            // Step 2: Fallback to legacy login
            const legacyResponse = await fetch("/api/auth/legacy-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            const legacyData = await legacyResponse.json();

            if (!legacyResponse.ok) {
              const errorMessage =
                legacyData.code === "ALREADY_MIGRATED"
                  ? "User already migrated. Please use standard login."
                  : legacyData.error || "Login failed";

              setError(errorMessage);
              return {
                success: false,
                error: errorMessage,
                code: legacyData.code,
              };
            }

            // Step 3: Sign in with custom token from legacy login
            if (legacyData.data?.customToken) {
              await signInWithCustomToken(auth, legacyData.data.customToken);
              console.log("✅ Legacy user migrated and logged in");

              return {
                success: true,
                data: legacyData.data,
              };
            }

            return {
              success: false,
              error: "Failed to complete legacy login",
            };
          }

          // Other Firebase errors
          throw firebaseError;
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Login failed";
        setError(errorMessage);
        console.error("Login error:", err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [auth]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, phone?: string): Promise<LoginResponse> => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, phone }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || "Registration failed";
          setError(errorMessage);
          return {
            success: false,
            error: errorMessage,
            code: data.code,
          };
        }

        // Sign in with custom token
        if (data.data?.customToken) {
          await signInWithCustomToken(auth, data.data.customToken);
          console.log("✅ User registered and logged in");

          return {
            success: true,
            data: data.data,
          };
        }

        return {
          success: false,
          error: "Registration completed but login failed",
        };
      } catch (err: any) {
        const errorMessage = err?.message || "Registration failed";
        setError(errorMessage);
        console.error("Registration error:", err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [auth]
  );

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError("");

    try {
      await signOut(auth);
      console.log("✅ Logged out");

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || "Logout failed";
      setError(errorMessage);
      console.error("Logout error:", err);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [auth]);

  /**
   * Get user profile
   */
  const getProfile = useCallback(
    async (token: string) => {
      try {
        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        console.error("Profile fetch error:", err);
        return null;
      }
    },
    []
  );

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getProfile,
    isAuthenticated: !!user,
  };
}
