import admin from "firebase-admin";

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) return;

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error(
      "❌ FIREBASE_SERVICE_ACCOUNT env missing"
    );
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(
      serviceAccountJson
    );
  } catch (err) {
    throw new Error(
      "❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON"
    );
  }

  admin.initializeApp({
    credential:
      admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  initialized = true;
  console.log(
    "✅ Firebase Admin initialized"
  );
}

export function getFirestoreDb() {
  if (!admin.apps.length) {
    throw new Error(
      "❌ Firebase not initialized"
    );
  }

  return admin.firestore();
}

export function getAuth() {
  if (!admin.apps.length) {
    throw new Error(
      "❌ Firebase not initialized"
    );
  }

  return admin.auth();
}