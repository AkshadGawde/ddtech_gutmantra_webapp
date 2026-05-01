import { getFirestoreDb } from "./firebaseAdmin.js";

export interface MigrationStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  errors: string[];
}

/* ---------------- USERS ---------------- */

export async function batchCreateUsers(users: any[]) {
  const db = getFirestoreDb();

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const existingUsers = await db.collection("users").get();
  const existingEmails = new Set(existingUsers.docs.map((d) => d.data().email));

  for (let i = 0; i < users.length; i += 500) {
    const batch = db.batch();
    const chunk = users.slice(i, i + 500);

    for (const user of chunk) {
      if (existingEmails.has(user.email)) {
        skipped++;
        continue;
      }

      try {
        const ref = db.collection("users").doc();
        batch.set(ref, {
          ...user,
          migrationStatus: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        created++;
      } catch (e) {
        errors.push(`${user.email}: ${String(e)}`);
      }
    }

    await batch.commit();
  }

  return { created, skipped, errors };
}

/* ---------------- PRODUCTS ---------------- */

export async function batchCreateProducts(products: any[]) {
  const db = getFirestoreDb();

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const existing = await db.collection("products").get();
  const ids = new Set(existing.docs.map((d) => d.data().wordpressProductId));

  for (let i = 0; i < products.length; i += 500) {
    const batch = db.batch();
    const chunk = products.slice(i, i + 500);

    for (const p of chunk) {
      if (ids.has(p.wordpressProductId)) {
        skipped++;
        continue;
      }

      try {
        const ref = db.collection("products").doc();
        batch.set(ref, {
          ...p,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        created++;
      } catch (e) {
        errors.push(`${p.name}: ${String(e)}`);
      }
    }

    await batch.commit();
  }

  return { created, skipped, errors };
}

/* ---------------- ORDERS ---------------- */

export async function batchCreateOrders(orders: any[]) {
  const db = getFirestoreDb();

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const existing = await db.collection("orders").get();
  const ids = new Set(existing.docs.map((d) => d.data().wordpressOrderId));

  for (let i = 0; i < orders.length; i += 500) {
    const batch = db.batch();
    const chunk = orders.slice(i, i + 500);

    for (const o of chunk) {
      if (ids.has(o.wordpressOrderId)) {
        skipped++;
        continue;
      }

      try {
        const ref = db.collection("orders").doc();
        batch.set(ref, {
          ...o,
          createdAt: o.createdAt || new Date(),
          updatedAt: new Date(),
        });
        created++;
      } catch (e) {
        errors.push(`${o.wordpressOrderId}: ${String(e)}`);
      }
    }

    await batch.commit();
  }

  return { created, skipped, errors };
}

/* ---------------- VALIDATION ---------------- */

export async function validateOrderReferences(orders: any[]) {
  const db = getFirestoreDb();

  const users = await db.collection("users").get();
  const userIds = new Set(users.docs.map((d) => d.data().wordpressUserId));

  let orphanCount = 0;
  const errors: string[] = [];

  for (const o of orders) {
    if (!userIds.has(o.wordpressUserId)) {
      orphanCount++;
      errors.push(`Order ${o.wordpressOrderId} → missing user ${o.wordpressUserId}`);
    }
  }

  return {
    valid: orphanCount === 0,
    orphanCount,
    errors: errors.slice(0, 50),
  };
}

/* ---------------- STATS ---------------- */

export async function getMigrationStats(): Promise<MigrationStats> {
  const db = getDb();

  const [u, p, o] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("products").count().get(),
    db.collection("orders").count().get(),
  ]);

  return {
    totalUsers: u.data().count,
    totalProducts: p.data().count,
    totalOrders: o.data().count,
    totalProcessed: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    errors: [],
  };
}

/* ---------------- LOGGING ---------------- */

export async function logMigrationEvent(type: string, status: string, data: any) {
  const db = getDb();

  await db.collection("migrationLogs").add({
    type,
    status,
    ...data,
    timestamp: new Date(),
  });
}