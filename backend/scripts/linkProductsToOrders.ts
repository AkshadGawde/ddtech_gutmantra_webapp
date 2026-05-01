import { initializeFirebaseAdmin, getFirestoreDb } from "../src/services/firebaseAdmin.js";

initializeFirebaseAdmin();

async function linkProductsToOrders() {
  const db = getFirestoreDb();

  console.log("🔗 Linking products to orders...\n");

  const productsSnap = await db.collection("products").get();
  const ordersSnap = await db.collection("orders").get();

  // Map: wordpressProductId → product doc
  const productMap = new Map();

  productsSnap.docs.forEach((doc) => {
    const data = doc.data();
    productMap.set(String(data.wordpressProductId), {
      id: doc.id,
      ...data,
    });
  });

  let updated = 0;
  let skipped = 0;

  for (const orderDoc of ordersSnap.docs) {
    const order = orderDoc.data();

    if (!order.items || !Array.isArray(order.items)) {
      skipped++;
      continue;
    }

    const updatedItems = order.items.map((item: any) => {
      const wpId = String(item.productId);

      const product = productMap.get(wpId);

      if (!product) {
        console.warn("⚠️ Product not found for:", wpId);
        return item;
      }

      return {
        ...item,

        // 🔥 NEW FIELDS
        firebaseProductId: product.id,
        productName: product.name,
        category: product.category,

        // optional: enrich variant
        variantDetails: {
          grind: item.grind || null,
          quantity: item.variant || null,
        },
      };
    });

    await db.collection("orders").doc(orderDoc.id).update({
      items: updatedItems,
      updatedAt: new Date(),
    });

    updated++;
  }

  console.log("\n✅ Linking complete");
  console.log(`Updated orders: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

linkProductsToOrders();