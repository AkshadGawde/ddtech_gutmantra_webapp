import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<FirestoreUserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userData?.role === "admin" || user?.email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  const refreshUserData = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserData(normalizeFirestoreUserDoc(userSnap.data(), user));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch or create user document in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(normalizeFirestoreUserDoc(userSnap.data(), firebaseUser));
        } else {
          const newUserData: FirestoreUserDocument = {
            email: firebaseUser.email ?? "",
            phone: firebaseUser.phoneNumber ?? "",
            wordpressUserId: "",
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            profileImage: firebaseUser.photoURL ?? "",
            role: firebaseUser.email === import.meta.env.VITE_ADMIN_EMAIL ? "admin" : "user",
            address: {
              firstName: firebaseUser.displayName?.split(" ")[0] || "",
              lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
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
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      
      // Handle unauthorized domain error with helpful message
      if (error.code === "auth/unauthorized-domain") {
        throw new Error(
          "Add localhost:3000 to Firebase Console:\n1. Go to Authentication > Settings > Authorized domains\n2. Click 'Add domain'\n3. Enter: localhost:3000\n4. Click 'Add'"
        );
      }
      
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore with provided name
      const userRef = doc(db, "users", userCredential.user.uid);
      const newUserData = {
        uid: userCredential.user.uid,
        name: name || "User",
        email: email,
        profileImage: "",
        role: email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() ? "admin" : "user",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        address: {},
        addresses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newUserData);
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    }
  };

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
