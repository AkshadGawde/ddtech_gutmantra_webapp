import admin from "firebase-admin";

let initialized = false;

function getServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("❌ FIREBASE_SERVICE_ACCOUNT env missing");
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT");
    console.error(raw);

    throw error;
  }

  if (!parsed.project_id) {
    throw new Error("❌ Firebase service account missing project_id");
  }

  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed as admin.ServiceAccount;
}

export function initializeFirebaseAdmin() {
  if (initialized) return;

  const serviceAccount = getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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