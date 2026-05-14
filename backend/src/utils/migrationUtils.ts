import { getFirestoreDb } from "../services/firebaseAdmin.js";
import type { FieldValue } from "firebase-admin/firestore";

export interface MigrationLog {
  timestamp: Date;
  type: "users" | "products" | "orders";
  status: "started" | "completed" | "failed";
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: string[];
}

const logsCollection = "migrationLogs";

export async function logMigration(
  migrationLog: Omit<MigrationLog, "timestamp">
): Promise<void> {
  const db = getFirestoreDb();
  const log = {
    ...migrationLog,
    timestamp: new Date(),
  };

  await db.collection(logsCollection).add(log);
  console.log(`📝 Migration logged: ${migrationLog.type} - ${migrationLog.status}`);
}

export async function userExists(email: string): Promise<boolean> {
  const db = getFirestoreDb();
  const query = await db.collection("users").where("email", "==", email).get();
  return !query.empty;
}

export async function productExists(wordpressProductId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const query = await db
    .collection("products")
    .where("wordpressProductId", "==", wordpressProductId)
    .get();
  return !query.empty;
}

export async function orderExists(wordpressOrderId?: string): Promise<boolean> {
  if (!wordpressOrderId) {
    return false;
  }

  const db = getFirestoreDb();
  const query = await db
    .collection("orders")
    .where("wordpressOrderId", "==", wordpressOrderId)
    .get();
  return !query.empty;
}

export interface FirestoreUser {
  email: string;
  phone: string;
  wordpressUserId: string;
  petpoojaCustomerId?: string;
  legacyPasswordHash: string;
  migrationStatus: "pending" | "completed" | "failed";
  address?: {
    firstName?: string;
    lastName?: string;
    streetAddress?: string;
    apartment?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    fullAddress?: string;
  };
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export async function createUser(user: FirestoreUser): Promise<string> {
  const db = getFirestoreDb();
  const docRef = await db.collection("users").add({
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export interface FirestoreProduct {
  wordpressProductId: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  unit: string;
  imageUrl?: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export async function createProduct(product: FirestoreProduct): Promise<string> {
  const db = getFirestoreDb();
  const docRef = await db.collection("products").add({
    ...product,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export interface FirestoreOrder {
  wordpressOrderId: string;
  wordpressUserId: string;
  petpoojaOrderId?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export async function createOrder(order: FirestoreOrder): Promise<string> {
  const db = getFirestoreDb();
  const docRef = await db.collection("orders").add({
    ...order,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateUserWithFirebaseUid(
  userId: string,
  firebaseUid: string
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection("users").doc(userId).update({
    firebaseUid,
    migrationStatus: "completed",
    legacyPasswordHash: null, // Remove legacy hash after successful migration
    updatedAt: new Date(),
  });
}

export async function linkOrdersToFirebaseUid(
  wordpressUserId: string,
  firebaseUid: string
): Promise<number> {
  const db = getFirestoreDb();
  const orders = await db
    .collection("orders")
    .where("wordpressUserId", "==", wordpressUserId)
    .get();

  let updated = 0;
  for (const doc of orders.docs) {
    await doc.ref.update({
      firebaseUid,
      updatedAt: new Date(),
    });
    updated++;
  }

  return updated;
}

export async function getMigrationStats(): Promise<{
  usersTotal: number;
  usersMigrated: number;
  usersPending: number;
  productCount: number;
  orderCount: number;
}> {
  const db = getFirestoreDb();

  const usersTotal = await db.collection("users").get();
  const usersMigrated = await db
    .collection("users")
    .where("migrationStatus", "==", "completed")
    .get();
  const usersPending = await db
    .collection("users")
    .where("migrationStatus", "==", "pending")
    .get();
  const products = await db.collection("products").get();
  const orders = await db.collection("orders").get();

  return {
    usersTotal: usersTotal.size,
    usersMigrated: usersMigrated.size,
    usersPending: usersPending.size,
    productCount: products.size,
    orderCount: orders.size,
  };
}
