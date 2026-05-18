import admin from "firebase-admin";
import { getFirestoreDb } from "./firebaseAdmin.js";

/* -------------------------------------------------------------------------- */
/*                            BULK ORDER SYNC                                 */
/* -------------------------------------------------------------------------- */

export async function syncOrdersToFirestore(db: any, payload: any) {
  const orders = payload.orders || [];

  const batchSize = 400;

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = db.batch();
    const chunk = orders.slice(i, i + batchSize);

    chunk.forEach((order: any) => {
      const ref = db.collection("orders").doc(order.orderid);

      batch.set(
        ref,
        {
          orderId: order.orderid,
          status: order.order_status,
          type: order.ordertype,

          customer: {
            name: order.customer_name,
            phone: order.customer_phone,
            address: order.delivery_address || "",
          },

          items: (order.items || []).map((item: any) => ({
            name: item.itemname,
            quantity: item.quantity,
            price: parseFloat(item.price || "0"),
          })),

          totalAmount: parseFloat(order.total_amount || "0"),

          paymentMethod: order.payment_mode,
          paymentStatus: order.payment_status,

          source: "petpooja_sync",

          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  console.log(`✅ Synced ${orders.length} orders to Firestore`);

  return {
    totalOrders: orders.length,
  };
}

/* -------------------------------------------------------------------------- */
/*                          SINGLE ORDER SAVE                                 */
/* -------------------------------------------------------------------------- */

export async function saveSingleOrderToFirestore(order: any) {

  const db = getFirestoreDb();

  await db
    .collection("orders")
    .doc(order.orderID)
    .set(
      {
        orderID: order.orderID,
        userId: order.userId || String(order.orderID.split("_")[0] || ""),
        petpoojaID: order.petpoojaResponse?.clientOrderID || order.orderID,
        status: "pending",
        statusLabel: "Order Placed",
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount ?? 0,
        couponCode: order.couponCode || null,
        finalAmount: order.finalAmount,
        total: order.finalAmount,
        deliveryDistanceKm: order.deliveryDistanceKm ?? 0,
        deliveryCharge: order.deliveryCharge ?? 0,
        isDeliverable: order.isDeliverable ?? true,
        paymentMode: order.paymentMode,
        paymentStatus: "PENDING",
        source: "petpooja",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

}