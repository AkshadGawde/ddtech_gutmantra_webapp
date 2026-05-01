import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const filePath = path.join(__dirname, "../../firebase-applet-config.json");

  console.log("🔍 Looking for Firebase key at:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      "❌ Firebase service account file not found at: " + filePath
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log("✅ Firebase Admin initialized");
}

/* ---------------- SAFE ACCESS ---------------- */

export function getFirestoreDb() {
  if (!admin.apps.length) {
    throw new Error("❌ Firebase not initialized. Call initializeFirebaseAdmin()");
  }
  return admin.firestore();
}

export function getAuth() {
  if (!admin.apps.length) {
    throw new Error("❌ Firebase not initialized.");
  }
  return admin.auth();
}