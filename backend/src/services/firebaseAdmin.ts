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
  return admin.firestore();
}

export function getAuth() {
  return admin.auth();
}