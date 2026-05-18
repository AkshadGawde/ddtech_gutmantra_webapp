import admin from "firebase-admin";
const serviceAccount = JSON.parse(

  process.env.FIREBASE_SERVICE_ACCOUNT || "{}"

);

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