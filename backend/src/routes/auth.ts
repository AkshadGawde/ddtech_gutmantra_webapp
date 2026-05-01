import { Router, Request, Response } from "express";
import { getAuth, getFirestoreDb } from "../services/firebaseAdmin.js";
import { verifyPassword, hashPassword } from "../services/passwordVerification.js";
import { updateUserWithFirebaseUid, linkOrdersToFirebaseUid } from "../utils/migrationUtils.js";

const router = Router();

/**
 * Legacy Login - For migrating users from WordPress
 * POST /auth/legacy-login
 */
router.post("/legacy-login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const db = getFirestoreDb();
    const auth = getAuth();

    // 1. Find user in Firestore
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // 2. Check if already migrated
    if (userData.firebaseUid) {
      return res.status(400).json({
        success: false,
        error: "User already migrated. Please use normal login.",
        code: "ALREADY_MIGRATED",
      });
    }

    // 3. Verify legacy password hash
    const isPasswordValid = await verifyPassword(
      password,
      userData.legacyPasswordHash
    );

    if (!isPasswordValid) {
      console.warn(`❌ Invalid password attempt for: ${email}`);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // 4. Create Firebase Auth user
    let firebaseUid: string;
    try {
      const userRecord = await auth.createUser({
        email: userData.email,
        password: password, // Firebase will hash this
        phoneNumber: userData.phone || undefined,
      });
      firebaseUid = userRecord.uid;
      console.log(`✅ Created Firebase Auth user: ${firebaseUid}`);
    } catch (error: any) {
      // If user already exists in Firebase Auth, try to get their uid
      if (error.code === "auth/email-already-exists") {
        const existingUser = await auth.getUserByEmail(email);
        firebaseUid = existingUser.uid;
        console.log(`⏭️  Firebase Auth user already exists: ${firebaseUid}`);
      } else {
        throw error;
      }
    }

    // 5. Update user in Firestore
    await updateUserWithFirebaseUid(userId, firebaseUid);
    console.log(`✅ Updated user in Firestore: ${email}`);

    // 6. Link all orders to Firebase UID
    const ordersLinked = await linkOrdersToFirebaseUid(userData.wordpressUserId, firebaseUid);
    console.log(`✅ Linked ${ordersLinked} orders to Firebase UID`);

    // 7. Create custom token for immediate login
    const customToken = await auth.createCustomToken(firebaseUid);

    // 8. Get user claims/data for response
    const migratedUserDoc = await db.collection("users").doc(userId).get();
    const migratedUserData = migratedUserDoc.data();

    return res.json({
      success: true,
      message: "Legacy user successfully migrated and logged in",
      customToken,
      user: {
        uid: firebaseUid,
        email: migratedUserData?.email,
        phone: migratedUserData?.phone,
        petpoojaCustomerId: migratedUserData?.petpoojaCustomerId,
        migrationStatus: "completed",
      },
    });
  } catch (error) {
    console.error("❌ Legacy login error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * Firebase Login
 * POST /auth/login
 */
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "ID token is required",
      });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get user data from Firestore
    const db = getFirestoreDb();
    const userQuery = await db
      .collection("users")
      .where("firebaseUid", "==", decodedToken.uid)
      .limit(1)
      .get();

    let userData: any = { uid: decodedToken.uid, email: decodedToken.email };

    if (!userQuery.empty) {
      userData = {
        ...userData,
        ...userQuery.docs[0].data(),
        firestoreId: userQuery.docs[0].id,
      };
    }

    return res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Firebase login error:", error);
    return res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : "Invalid token",
    });
  }
});

/**
 * Register New User
 * POST /auth/register
 */
router.post("/register", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const auth = getAuth();
    const db = getFirestoreDb();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      phoneNumber: phone || undefined,
    });

    // Create Firestore user document
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      phone: phone || null,
      source: "firebase",
      migrationStatus: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create custom token for immediate login
    const customToken = await auth.createCustomToken(userRecord.uid);

    console.log(`✅ New user registered: ${email}`);

    return res.json({
      success: true,
      message: "User registered successfully",
      customToken,
      user: {
        uid: userRecord.uid,
        email,
        phone: phone || null,
        source: "firebase",
      },
    });
  } catch (error: any) {
    console.error("❌ Registration error:", error);

    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        success: false,
        error: "Email already in use",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Registration failed",
    });
  }
});

/**
 * Logout
 * POST /auth/logout
 */
router.post("/logout", (req: Request, res: Response) => {
  // Since Firebase Auth is stateless, logout is typically handled client-side
  // This endpoint can be used for cleanup or session management
  console.log("✅ User logout request");
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * Get User Profile
 * GET /auth/profile
 */
router.get("/profile", async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    const db = getFirestoreDb();
    const userQuery = await db
      .collection("users")
      .where("firebaseUid", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = userQuery.docs[0].data();

    return res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }
});

export default router;
