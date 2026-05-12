import admin from "firebase-admin";
import { getFirestoreDb } from "./firebaseAdmin";

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

        petpoojaID:

          order.petpoojaResponse?.clientOrderID ||

          order.orderID,

        status: "pending",

        statusLabel: "Order Placed",

        customer: {

          name: order.customer.name,

          phone: order.customer.phone,

          email: order.customer.email,

          address: order.customer.address,

        },

        items: order.items,

        total: order.total,

        paymentMode: order.paymentMode,

        source: "petpooja",

        createdAt:

          admin.firestore.FieldValue.serverTimestamp(),

        updatedAt:

          admin.firestore.FieldValue.serverTimestamp(),

      },

      { merge: true }

    );

}