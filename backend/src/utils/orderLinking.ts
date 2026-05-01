import { getFirestoreDb } from "../services/firebaseAdmin.js";

/**
 * Link orders from WordPress to Firebase UID
 * Maintains the relationship while adding Firebase reference
 */
export async function linkOrdersToUser(
  wordpressUserId: string,
  firebaseUid: string
): Promise<{ linked: number; failed: number }> {
  const db = getFirestoreDb();

  try {
    const orders = await db
      .collection("orders")
      .where("wordpressUserId", "==", wordpressUserId)
      .get();

    let linked = 0;
    let failed = 0;

    for (const doc of orders.docs) {
      try {
        await doc.ref.update({
          firebaseUid,
          updatedAt: new Date(),
        });
        linked++;
      } catch (error) {
        console.error(`Failed to link order ${doc.id}:`, error);
        failed++;
      }
    }

    return { linked, failed };
  } catch (error) {
    console.error("Error linking orders:", error);
    throw error;
  }
}

/**
 * Get all orders for a user (by Firebase UID)
 */
export async function getUserOrders(
  firebaseUid: string
): Promise<Array<any>> {
  const db = getFirestoreDb();

  try {
    const orders = await db
      .collection("orders")
      .where("firebaseUid", "==", firebaseUid)
      .orderBy("createdAt", "desc")
      .get();

    return orders.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

/**
 * Get orders by Petpooja order ID
 * For POS system integration
 */
export async function getOrderByPetpoojaId(
  petpoojaOrderId: string
): Promise<any> {
  const db = getFirestoreDb();

  try {
    const orders = await db
      .collection("orders")
      .where("petpoojaOrderId", "==", petpoojaOrderId)
      .limit(1)
      .get();

    if (orders.empty) {
      return null;
    }

    const doc = orders.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error fetching order by Petpooja ID:", error);
    return null;
  }
}

/**
 * Get orders by customer phone (for POS matching)
 */
export async function getOrdersByPhone(
  phone: string
): Promise<Array<any>> {
  const db = getFirestoreDb();

  try {
    const orders = await db
      .collection("orders")
      .where("customerPhone", "==", phone)
      .orderBy("createdAt", "desc")
      .get();

    return orders.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching orders by phone:", error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "completed" | "cancelled"
): Promise<void> {
  const db = getFirestoreDb();

  try {
    await db.collection("orders").doc(orderId).update({
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Verify order integrity and consistency
 */
export async function verifyOrderConsistency(
  orderId: string
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const db = getFirestoreDb();
  const errors: string[] = [];

  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return { valid: false, errors: ["Order not found"] };
    }

    const order = orderDoc.data();

    // Check required fields
    if (!order.wordpressOrderId) {
      errors.push("Missing wordpressOrderId");
    }

    if (!order.wordpressUserId && !order.firebaseUid) {
      errors.push("Missing both wordpressUserId and firebaseUid");
    }

    if (!order.items || order.items.length === 0) {
      errors.push("Order has no items");
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
      errors.push("Invalid total amount");
    }

    // If has firebaseUid, verify user exists
    if (order.firebaseUid) {
      const userDoc = await db
        .collection("users")
        .where("firebaseUid", "==", order.firebaseUid)
        .limit(1)
        .get();

      if (userDoc.empty) {
        errors.push(`Firebase user ${order.firebaseUid} not found`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        error instanceof Error ? error.message : "Unknown verification error",
      ],
    };
  }
}
