import { getAuth, getFirestoreDb } from "./firebaseAdmin.js";
import bcrypt from "bcrypt";
import wpHash from "wordpress-hash-node";

/* ---------------- PHONE FORMATTER ---------------- */

function formatPhone(phone?: string) {
  if (!phone) return undefined;

  let cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned.startsWith("+")) {
    cleaned = "+91" + cleaned;
  }

  return cleaned;
}

/* ---------------- WP HASH ---------------- */

function verifyWPPassword(password: string, hash: string): boolean {
  try {
    return wpHash.CheckPassword(password, hash);
  } catch {
    return false;
  }
}

/* ---------------- TYPES ---------------- */

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthResponse {
  uid: string;
  email: string;
  phone?: string;
  petpoojaCustomerId?: string;
  migrationStatus: string;
  customToken: string;
}

/* ---------------- HELPERS ---------------- */

export async function getUserByEmail(email: string) {
  const db = getFirestoreDb();

  const query = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (query.empty) return null;

  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

export async function getUserByFirebaseUid(uid: string) {
  const db = getFirestoreDb();

  const query = await db
    .collection("users")
    .where("firebaseUid", "==", uid)
    .limit(1)
    .get();

  if (query.empty) return null;

  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

/* ---------------- LEGACY LOGIN ---------------- */

export async function legacyLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!email || !password) {
    throw new AuthError("INVALID_INPUT", "Email and password are required");
  }

  const db = getFirestoreDb();
  const auth = getAuth();

  const user: any = await getUserByEmail(email);

  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "Invalid credentials");
  }

  if (user.migrationStatus === "completed") {
    throw new AuthError(
      "ALREADY_MIGRATED",
      "User already migrated. Use normal login."
    );
  }

  const hash = user.legacyPasswordHash;

  if (!hash) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid credentials");
  }

  /* -------- PASSWORD CHECK -------- */

  let isValid = false;

  if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
    isValid = verifyWPPassword(password, hash);
  }

  if (!isValid) {
    console.warn(`❌ Invalid password for: ${email}`);
    throw new AuthError("INVALID_CREDENTIALS", "Invalid credentials");
  }

  /* -------- CREATE FIREBASE USER -------- */

  let firebaseUid: string;

  const cleanPhone = formatPhone(user.phone);

  try {
    const userRecord = await auth.createUser({
      email: user.email,
      password,
      phoneNumber: cleanPhone,
    });

    firebaseUid = userRecord.uid;
    console.log(`✅ Created Firebase user: ${firebaseUid}`);
  } catch (error: any) {
    console.error("🔥 Firebase ERROR:", error.code, error.message);

    if (error.code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      firebaseUid = existing.uid;
      console.log(`⏭️ Existing Firebase user: ${firebaseUid}`);
    } else {
      throw new AuthError("INTERNAL_ERROR", error.message);
    }
  }

  /* -------- UPDATE FIRESTORE -------- */

  const bcryptHash = await bcrypt.hash(password, 10);

  await db.collection("users").doc(user.id).update({
    firebaseUid,
    password: bcryptHash,
    migrationStatus: "completed",
    legacyPasswordHash: null,
    updatedAt: new Date(),
  });

  /* -------- LINK ORDERS -------- */

  if (user.wordpressUserId) {
    try {
      await linkOrdersToUser(user.wordpressUserId, firebaseUid);
    } catch {
      console.warn("⚠️ Order linking failed");
    }
  }

  const customToken = await auth.createCustomToken(firebaseUid);

  return {
    uid: firebaseUid,
    email: user.email,
    phone: cleanPhone,
    petpoojaCustomerId: user.petpoojaCustomerId,
    migrationStatus: "completed",
    customToken,
  };
}

/* ---------------- FIREBASE LOGIN ---------------- */

export async function firebaseLogin(idToken: string) {
  const auth = getAuth();

  const decoded = await auth.verifyIdToken(idToken);

  const user = await getUserByFirebaseUid(decoded.uid);

  return {
    uid: decoded.uid,
    email: decoded.email || "",
    phone: user?.phone,
    migrationStatus: "completed",
    customToken: "",
  };
}

/* ---------------- REGISTER ---------------- */

export async function registerUser(
  email: string,
  password: string,
  phone?: string
) {
  if (!email || !password) {
    throw new AuthError("INVALID_INPUT", "Email & password required");
  }

  const auth = getAuth();
  const db = getFirestoreDb();

  const cleanPhone = formatPhone(phone);

  let userRecord;

  try {
    userRecord = await auth.createUser({
      email,
      password,
      phoneNumber: cleanPhone,
    });
  } catch (error: any) {
    console.error("🔥 Firebase ERROR:", error.code, error.message);

    if (error.code === "auth/email-already-exists") {
      throw new AuthError("EMAIL_EXISTS", "Email already in use");
    }

    if (error.code === "auth/invalid-phone-number") {
      throw new AuthError("INVALID_INPUT", "Invalid phone number format");
    }

    throw new AuthError("INTERNAL_ERROR", error.message);
  }

  await db.collection("users").doc(userRecord.uid).set({
    firebaseUid: userRecord.uid,
    email,
    phone: cleanPhone || null,
    migrationStatus: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const token = await auth.createCustomToken(userRecord.uid);

  return {
    uid: userRecord.uid,
    email,
    phone: cleanPhone,
    migrationStatus: "completed",
    customToken: token,
  };
}

/* ---------------- ORDER LINK ---------------- */

async function linkOrdersToUser(
  wordpressUserId: string,
  firebaseUid: string
) {
  const db = getFirestoreDb();

  const orders = await db
    .collection("orders")
    .where("wordpressUserId", "==", wordpressUserId)
    .get();

  if (orders.empty) return;

  const batch = db.batch();

  orders.docs.forEach((doc) => {
    batch.update(doc.ref, { firebaseUid });
  });

  await batch.commit();

  console.log(`✅ Orders linked`);
}