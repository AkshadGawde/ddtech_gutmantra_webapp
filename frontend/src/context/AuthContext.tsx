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

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userData?.role === "admin" || user?.email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create user document in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          const newUserData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            profileImage: firebaseUser.photoURL,
            role: firebaseUser.email === import.meta.env.VITE_ADMIN_EMAIL ? "admin" : "user",
            phone: "",
            street: "",
            city: "",
            state: "",
            zipCode: "",
            addresses: [],
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
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, login, loginWithEmail, signupWithEmail, logout }}>
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
