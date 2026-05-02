import admin from "firebase-admin";

export async function syncOrdersToFirestore(db, payload) {
  const orders = payload.orders || [];

  const batchSize = 400;

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = db.batch();
    const chunk = orders.slice(i, i + batchSize);

    chunk.forEach((order) => {
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

          items: (order.items || []).map((item) => ({
            name: item.itemname,
            quantity: item.quantity,
            price: parseFloat(item.price || "0"),
          })),

          totalAmount: parseFloat(order.total_amount || "0"),
          paymentMethod: order.payment_mode,
          paymentStatus: order.payment_status,

          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  return { totalOrders: orders.length };
}