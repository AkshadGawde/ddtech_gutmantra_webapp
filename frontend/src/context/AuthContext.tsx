import React, { createContext, useContext, useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db, googleProvider } from "../lib/firebase";

import {
  FirestoreUserDocument,
  normalizeFirestoreUserDoc,
} from "../utils/userHelpers";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: FirestoreUserDocument | null;
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

  const [userData, setUserData] =
    useState<FirestoreUserDocument | null>(null);

  const [loading, setLoading] = useState(true);

  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const [phoneAuthUser, setPhoneAuthUser] =
    useState<FirebaseUser | null>(null);

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
      SEND OTP
  ========================================================= */

  const sendPhoneOTP = async (
    phone: string,
    recaptchaContainerId: string
  ) => {
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier =
          new RecaptchaVerifier(
            auth,
            recaptchaContainerId,
            {
              size: "normal",
              callback: () => {
                console.log(
                  "reCAPTCHA solved"
                );
              },
            }
          );

        await (window as any).recaptchaVerifier.render();
      }

      const verifier =
        (window as any).recaptchaVerifier;

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        verifier
      );

      setConfirmationResult(result);

      console.log("✅ OTP sent");
    } catch (error) {
      console.error("OTP send failed:", error);
      throw error;
    }
  };

  /* =========================================================
      VERIFY OTP
  ========================================================= */

  const verifyPhoneOTP = async (
    otp: string
  ) => {
    try {
      if (!confirmationResult) {
        throw new Error(
          "OTP session expired"
        );
      }

      const result =
        await confirmationResult.confirm(otp);

      const firebaseUser = result.user;

      setPhoneAuthUser(firebaseUser);

      const phone =
        firebaseUser.phoneNumber || "";

      /* SEARCH EXISTING USER */

      const usersRef = collection(db, "users");

      const q = query(
        usersRef,
        where("phone", "==", phone)
      );

      const querySnapshot = await getDocs(q);

      /* EXISTING USER */

      if (!querySnapshot.empty) {
        const existingUserDoc =
          querySnapshot.docs[0];

        await updateDoc(
          doc(db, "users", existingUserDoc.id),
          {
            phoneVerified: true,
            updatedAt: serverTimestamp(),
          }
        );

        return {
          isExistingUser: true,
          uid: existingUserDoc.id,
        };
      }

      /* NEW USER */

      const userRef = doc(
        db,
        "users",
        firebaseUser.uid
      );

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: firebaseUser.email || "",
          phone,
          phoneVerified: true,
          authMode: "phone",
          role: "user",

          name: "User",

          profileImage: "",

          address: {
            firstName: "",
            lastName: "",
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
        });
      }

      return {
        isExistingUser: false,
        uid: firebaseUser.uid,
      };
    } catch (error) {
      console.error("OTP verification failed:", error);
      throw error;
    }
  };

  /* =========================================================
      LINK PHONE TO EXISTING EMAIL ACCOUNT
  ========================================================= */

  const linkPhoneToExistingAccount = async (
    email: string,
    password: string
  ) => {
    try {
      if (!phoneAuthUser?.phoneNumber) {
        throw new Error(
          "Phone authentication missing"
        );
      }

      /* LOGIN EXISTING EMAIL ACCOUNT */

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const existingUser =
        userCredential.user;

      /* CREATE PHONE CREDENTIAL */

      const credential =
        PhoneAuthProvider.credential(
          confirmationResult!.verificationId,
          "123456"
        );

      try {
        await linkWithCredential(
          existingUser,
          credential
        );
      } catch (error: any) {
        console.log(
          "Phone already linked or skipped:",
          error?.message
        );
      }

      /* UPDATE FIRESTORE */

      const userRef = doc(
        db,
        "users",
        existingUser.uid
      );

      await updateDoc(userRef, {
        phone: phoneAuthUser.phoneNumber,
        phoneVerified: true,
        authMode: "phone",
        updatedAt: serverTimestamp(),
      });

      console.log(
        "✅ Existing account linked successfully"
      );
    } catch (error) {
      console.error(
        "Account linking failed:",
        error
      );
      throw error;
    }
  };

  /* =========================================================
      LOGOUT
  ========================================================= */

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
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