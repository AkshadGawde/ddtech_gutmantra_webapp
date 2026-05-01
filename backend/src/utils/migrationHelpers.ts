/**
 * Helper utilities for managing and testing the migration
 */

import { getFirestoreDb, getAuth } from "../src/services/firebaseAdmin.js";

/**
 * Get all users with migration status
 */
export async function getUnmigratedUsers(): Promise<Array<any>> {
  const db = getFirestoreDb();
  const users = await db
    .collection("users")
    .where("migrationStatus", "==", "pending")
    .get();

  return users.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get all migrated users
 */
export async function getMigratedUsers(): Promise<Array<any>> {
  const db = getFirestoreDb();
  const users = await db
    .collection("users")
    .where("migrationStatus", "==", "completed")
    .get();

  return users.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  const db = getFirestoreDb();
  const query = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(uid: string): Promise<any> {
  const db = getFirestoreDb();
  const query = await db
    .collection("users")
    .where("firebaseUid", "==", uid)
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

/**
 * Get user by WordPress ID
 */
export async function getUserByWordPressId(wordpressUserId: string): Promise<any> {
  const db = getFirestoreDb();
  const query = await db
    .collection("users")
    .where("wordpressUserId", "==", wordpressUserId)
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

/**
 * Verify user data consistency
 */
export async function verifyUserConsistency(userId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const db = getFirestoreDb();
  const errors: string[] = [];

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { valid: false, errors: ["User not found"] };
    }

    const user = userDoc.data();

    // Check required fields
    if (!user.email) {
      errors.push("Missing email");
    }

    if (!user.wordpressUserId) {
      errors.push("Missing wordpressUserId");
    }

    if (user.migrationStatus === "completed" && !user.firebaseUid) {
      errors.push("Marked completed but no firebaseUid");
    }

    if (user.migrationStatus === "completed" && user.legacyPasswordHash) {
      errors.push("Marked completed but legacyPasswordHash still exists");
    }

    if (user.firebaseUid) {
      const auth = getAuth();
      try {
        await auth.getUser(user.firebaseUid);
      } catch (error) {
        errors.push(`Firebase user ${user.firebaseUid} not found`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Cleanup user (remove legacy password hash after migration)
 */
export async function cleanupUserData(userId: string): Promise<void> {
  const db = getFirestoreDb();

  await db.collection("users").doc(userId).update({
    legacyPasswordHash: null,
    lastCleanupAt: new Date(),
  });

  console.log(`✅ Cleaned up user: ${userId}`);
}

/**
 * Get migration statistics
 */
export async function getMigrationReport(): Promise<{
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  totalProducts: number;
  totalOrders: number;
  ordersWithFirebaseUid: number;
  ordersWithoutFirebaseUid: number;
}> {
  const db = getFirestoreDb();

  const [
    totalUsersSnap,
    migratedUsersSnap,
    pendingUsersSnap,
    productsSnap,
    ordersSnap,
    ordersWithUidSnap,
    ordersWithoutUidSnap,
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("users").where("migrationStatus", "==", "completed").count().get(),
    db.collection("users").where("migrationStatus", "==", "pending").count().get(),
    db.collection("products").count().get(),
    db.collection("orders").count().get(),
    db.collection("orders").where("firebaseUid", "!=", null).count().get(),
    db.collection("orders").where("firebaseUid", "==", null).count().get(),
  ]);

  return {
    totalUsers: totalUsersSnap.data().count,
    migratedUsers: migratedUsersSnap.data().count,
    pendingUsers: pendingUsersSnap.data().count,
    totalProducts: productsSnap.data().count,
    totalOrders: ordersSnap.data().count,
    ordersWithFirebaseUid: ordersWithUidSnap.data().count,
    ordersWithoutFirebaseUid: ordersWithoutUidSnap.data().count,
  };
}

/**
 * Find data inconsistencies
 */
export async function findInconsistencies(): Promise<{
  usersWithoutWordpressId: number;
  usersWithoutEmail: number;
  ordersWithoutItems: number;
  ordersWithInvalidTotal: number;
}> {
  const db = getFirestoreDb();

  const results = {
    usersWithoutWordpressId: 0,
    usersWithoutEmail: 0,
    ordersWithoutItems: 0,
    ordersWithInvalidTotal: 0,
  };

  // Check users
  const users = await db.collection("users").get();
  for (const doc of users.docs) {
    const data = doc.data();
    if (!data.wordpressUserId) results.usersWithoutWordpressId++;
    if (!data.email) results.usersWithoutEmail++;
  }

  // Check orders
  const orders = await db.collection("orders").get();
  for (const doc of orders.docs) {
    const data = doc.data();
    if (!data.items || data.items.length === 0) results.ordersWithoutItems++;
    if (!data.totalAmount || data.totalAmount <= 0) results.ordersWithInvalidTotal++;
  }

  return results;
}

export default {
  getUnmigratedUsers,
  getMigratedUsers,
  getUserByEmail,
  getUserByFirebaseUid,
  getUserByWordPressId,
  verifyUserConsistency,
  cleanupUserData,
  getMigrationReport,
  findInconsistencies,
};
