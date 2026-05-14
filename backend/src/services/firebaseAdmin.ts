import admin from "firebase-admin";
import serviceAccount from "../../serviceAccountKey.json" assert { type: "json" };

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) return;

  admin.initializeApp({
    credential: admin.credential.cert(
      serviceAccount as admin.ServiceAccount
    ),
  });

  initialized = true;

  console.log("✅ Firebase Admin initialized");
}

export function getFirestoreDb() {
  if (!admin.apps.length) {
    throw new Error("Firebase not initialized");
  }

  return admin.firestore();
}

export function getAuth() {
  if (!admin.apps.length) {
    throw new Error("Firebase not initialized");
  }

  return admin.auth();
}