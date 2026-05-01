import fs from "fs";
import path from "path";
import { initializeFirebaseAdmin } from "../src/services/firebaseAdmin.js";
import { migrateProducts } from "../src/utils/productParser.js";
import { migrateOrders } from "../src/utils/orderParser.js";

initializeFirebaseAdmin();

/* -------- MAIN -------- */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("   🚀 FULL MIGRATION (Products + Orders)");
  console.log("=".repeat(60) + "\n");

  const basePath = path.join(process.cwd(), "data");

  const productsCSV = path.join(basePath, "products.csv");
  const ordersCSV = path.join(basePath, "orders.csv");

  try {
    // ---------------- PRODUCTS ----------------
    let productResult = { created: 0, skipped: 0, errors: [] };

    if (fs.existsSync(productsCSV)) {
      console.log("🟢 Migrating Products...\n");
      const result = await migrateProducts(productsCSV);

      productResult = {
        created: result?.created || 0,
        skipped: result?.skipped || 0,
        errors: result?.errors || [],
      };
    } else {
      console.warn("⚠️ Products CSV not found, skipping");
    }

    // ---------------- ORDERS ----------------
    let orderResult = { created: 0, skipped: 0, errors: [] };

    if (fs.existsSync(ordersCSV)) {
      console.log("\n🟣 Migrating Orders...\n");
      const result = await migrateOrders(ordersCSV);

      orderResult = {
        created: result?.created || 0,
        skipped: result?.skipped || 0,
        errors: result?.errors || [],
      };
    } else {
      console.warn("⚠️ Orders CSV not found, skipping");
    }

    // ---------------- SUMMARY ----------------
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));

    console.log(`🟢 Products: ${productResult.created} created`);
    console.log(`⏭️  Skipped: ${productResult.skipped}`);

    console.log(`\n🟣 Orders:   ${orderResult.created} created`);
    console.log(`⏭️  Skipped: ${orderResult.skipped}`);

    console.log(`\n❌ Errors: ${productResult.errors.length + orderResult.errors.length}`);
    console.log("=".repeat(60) + "\n");

    console.log("✅ Full migration completed!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();