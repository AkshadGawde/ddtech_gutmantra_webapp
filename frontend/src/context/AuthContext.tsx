import React, { createContext, useContext, useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db, googleProvider } from "../lib/firebase";

import {
  FirestoreUserDocument,
  normalizeFirestoreUserDoc,
} from "../utils/userHelpers";

import { WhatsAppUser } from "../types/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: FirestoreUserDocument | null;
  whatsappUser: WhatsAppUser | null;
  loading: boolean;
  isAdmin: boolean;

  login: () => Promise<void>;

  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<void>;

  signupWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<FirestoreUserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWhatsappUser = (): WhatsAppUser | null => {
    try {
      const raw = localStorage.getItem("userData");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [whatsappUser, setWhatsappUser] = useState<WhatsAppUser | null>(loadWhatsappUser);

  const isAdmin =
    userData?.role === "admin" ||
    user?.email?.toLowerCase() ===
      import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  /* =========================================================
      REFRESH USER
  ========================================================= */

  const refreshUserData = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);

      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(
          normalizeFirestoreUserDoc(
            userSnap.data(),
            user
          )
        );
      }
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  /* =========================================================
      AUTH STATE
  ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          try {
            const userRef = doc(
              db,
              "users",
              firebaseUser.uid
            );

            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUserData(
                normalizeFirestoreUserDoc(
                  userSnap.data(),
                  firebaseUser
                )
              );
            } else {
              const providerId =
                firebaseUser.providerData?.[0]?.providerId;

              const authMode =
                firebaseUser.phoneNumber
                  ? "phone"
                  : providerId === "google.com"
                  ? "google"
                  : "email";

              const newUserData: FirestoreUserDocument = {
                email: firebaseUser.email ?? "",
                phone: firebaseUser.phoneNumber ?? "",
                wordpressUserId: "",

                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "User",

                profileImage:
                  firebaseUser.photoURL ?? "",

                role:
                  firebaseUser.email?.toLowerCase() ===
                  import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()
                    ? "admin"
                    : "user",

                phoneVerified: true,

                authMode,

                address: {
                  firstName:
                    firebaseUser.displayName
                      ?.split(" ")[0] || "",

                  lastName:
                    firebaseUser.displayName
                      ?.split(" ")
                      .slice(1)
                      .join(" ") || "",

                  streetAddress: "",
                  apartment: "",
                  city: "",
                  state: "",
                  pinCode: "",
                  country: "India",
                  fullAddress: "",
                },

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              await setDoc(userRef, newUserData);

              setUserData(newUserData);
            }
          } catch (error) {
            console.error(
              "User initialization failed:",
              error
            );
          }
        } else {
          setUserData(null);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
      GOOGLE LOGIN
  ========================================================= */

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google login failed:", error);

      if (
        error.code === "auth/unauthorized-domain"
      ) {
        throw new Error(
          "Add your domain inside Firebase authorized domains."
        );
      }

      throw error;
    }
  };

  /* =========================================================
      EMAIL LOGIN
  ========================================================= */

  const loginWithEmail = async (
    email: string,
    password: string
  ) => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  /* =========================================================
      EMAIL SIGNUP
  ========================================================= */

  const signupWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const userRef = doc(
        db,
        "users",
        userCredential.user.uid
      );

      const newUserData: FirestoreUserDocument = {
        email,
        phone: "",

        name: name || "User",

        profileImage: "",

        role:
          email?.toLowerCase() ===
          import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()
            ? "admin"
            : "user",

        phoneVerified: true,

        authMode: "email",

        address: {
          firstName: name.split(" ")[0] || "",
          lastName:
            name.split(" ").slice(1).join(" ") || "",
          streetAddress: "",
          apartment: "",
          city: "",
          state: "",
          pinCode: "",
          country: "India",
          fullAddress: "",
        },

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserData);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  /* =========================================================
      WHATSAPP LOGIN EVENT
  ========================================================= */

  useEffect(() => {
    const handleWhatsappLogin = () => {
      setWhatsappUser(loadWhatsappUser());
    };
    window.addEventListener("whatsapp-login", handleWhatsappLogin);
    return () => window.removeEventListener("whatsapp-login", handleWhatsappLogin);
  }, []);

  /* =========================================================
      LOGOUT
  ========================================================= */

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      setWhatsappUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        whatsappUser,
        loading,
        isAdmin,

        login,

        loginWithEmail,

        signupWithEmail,

        logout,

        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};