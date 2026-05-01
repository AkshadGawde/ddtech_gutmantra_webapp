import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { initializeFirebaseAdmin, getFirestoreDb } from "../src/services/firebaseAdmin.js";
import {
  logMigration,
  userExists,
  productExists,
  orderExists,
  createUser,
  createProduct,
  createOrder,
  getMigrationStats,
} from "../src/utils/migrationUtils.js";

// Initialize Firebase
initializeFirebaseAdmin();

interface UserCSV {
  email: string;
  phone: string;
  wordpress_user_id: string;
  hashed_password: string;
  petpooja_customer_id?: string;
}

interface ProductCSV {
  wordpress_product_id: string;
  name: string;
  category: string;
  description?: string;
  price: string;
  unit: string;
  image_url?: string;
}

interface OrderCSV {
  wordpress_order_id: string;
  wordpress_user_id: string;
  petpooja_order_id?: string;
  items_json: string; // JSON array
  total_amount: string;
  status?: string;
}

async function migrateUsers(filePath: string): Promise<void> {
  console.log("🚀 Starting user migration...");
  const startTime = Date.now();

  let recordsProcessed = 0;
  let recordsSuccessful = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`User CSV file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const users: UserCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📄 Found ${users.length} users to migrate`);

    for (const user of users) {
      recordsProcessed++;

      try {
        // Check if already exists
        if (await userExists(user.email)) {
          console.log(`⏭️  User already exists: ${user.email}`);
          continue;
        }

        // Create user in Firestore
        const userId = await createUser({
          email: user.email,
          phone: user.phone,
          wordpressUserId: user.wordpress_user_id,
          petpoojaCustomerId: user.petpooja_customer_id,
          legacyPasswordHash: user.hashed_password,
          migrationStatus: "pending",
        } as any);

        recordsSuccessful++;
        console.log(`✅ Migrated user: ${user.email} (${userId})`);
      } catch (error) {
        recordsFailed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${user.email}: ${errorMsg}`);
        console.error(`❌ Failed to migrate user ${user.email}:`, error);
      }
    }

    await logMigration({
      type: "users",
      status: "completed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: errors.slice(0, 10), // Log first 10 errors
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✨ User migration completed in ${duration}s: ${recordsSuccessful} successful, ${recordsFailed} failed\n`
    );
  } catch (error) {
    console.error("❌ User migration failed:", error);
    await logMigration({
      type: "users",
      status: "failed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
}

async function migrateProducts(filePath: string): Promise<void> {
  console.log("🚀 Starting product migration...");
  const startTime = Date.now();

  let recordsProcessed = 0;
  let recordsSuccessful = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Product CSV file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const products: ProductCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📄 Found ${products.length} products to migrate`);

    for (const product of products) {
      recordsProcessed++;

      try {
        // Check if already exists
        if (await productExists(product.wordpress_product_id)) {
          console.log(`⏭️  Product already exists: ${product.name}`);
          continue;
        }

        const productId = await createProduct({
          wordpressProductId: product.wordpress_product_id,
          name: product.name,
          category: product.category,
          description: product.description,
          price: parseFloat(product.price),
          unit: product.unit,
          imageUrl: product.image_url,
        } as any);

        recordsSuccessful++;
        console.log(`✅ Migrated product: ${product.name} (${productId})`);
      } catch (error) {
        recordsFailed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${product.name}: ${errorMsg}`);
        console.error(`❌ Failed to migrate product ${product.name}:`, error);
      }
    }

    await logMigration({
      type: "products",
      status: "completed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: errors.slice(0, 10),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✨ Product migration completed in ${duration}s: ${recordsSuccessful} successful, ${recordsFailed} failed\n`
    );
  } catch (error) {
    console.error("❌ Product migration failed:", error);
    await logMigration({
      type: "products",
      status: "failed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
}

async function migrateOrders(filePath: string): Promise<void> {
  console.log("🚀 Starting order migration...");
  const startTime = Date.now();

  let recordsProcessed = 0;
  let recordsSuccessful = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Order CSV file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const orders: OrderCSV[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📄 Found ${orders.length} orders to migrate`);

    for (const order of orders) {
      recordsProcessed++;

      try {
        // Check if already exists
        if (await orderExists(order.wordpress_order_id)) {
          console.log(`⏭️  Order already exists: ${order.wordpress_order_id}`);
          continue;
        }

        // Parse items JSON
        let items = [];
        try {
          items = JSON.parse(order.items_json);
        } catch {
          items = [];
          console.warn(`⚠️  Could not parse items for order ${order.wordpress_order_id}`);
        }

        const orderId = await createOrder({
          wordpressOrderId: order.wordpress_order_id,
          wordpressUserId: order.wordpress_user_id,
          petpoojaOrderId: order.petpooja_order_id,
          items,
          totalAmount: parseFloat(order.total_amount),
          status: (order.status || "pending") as "pending" | "completed" | "cancelled",
        } as any);

        recordsSuccessful++;
        console.log(`✅ Migrated order: ${order.wordpress_order_id} (${orderId})`);
      } catch (error) {
        recordsFailed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${order.wordpress_order_id}: ${errorMsg}`);
        console.error(`❌ Failed to migrate order ${order.wordpress_order_id}:`, error);
      }
    }

    await logMigration({
      type: "orders",
      status: "completed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: errors.slice(0, 10),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✨ Order migration completed in ${duration}s: ${recordsSuccessful} successful, ${recordsFailed} failed\n`
    );
  } catch (error) {
    console.error("❌ Order migration failed:", error);
    await logMigration({
      type: "orders",
      status: "failed",
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
}

async function main() {
  console.log("=======================================");
  console.log("   🌍 WordPress to Firebase Migration");
  console.log("=======================================\n");

  // Get CSV file paths from command line or use defaults
  const args = process.argv.slice(2);
  const usersCSV = args[0] || "data/users.csv";
  const productsCSV = args[1] || "data/products.csv";
  const ordersCSV = args[2] || "data/orders.csv";

  console.log(`📂 Using CSV files:`);
  console.log(`   Users: ${usersCSV}`);
  console.log(`   Products: ${productsCSV}`);
  console.log(`   Orders: ${ordersCSV}\n`);

  // Run migrations
  await migrateUsers(usersCSV);
  await migrateProducts(productsCSV);
  await migrateOrders(ordersCSV);

  // Show final stats
  const stats = await getMigrationStats();
  console.log("📊 Migration Statistics:");
  console.log(`   Total Users: ${stats.usersTotal}`);
  console.log(`   Migrated Users: ${stats.usersMigrated}`);
  console.log(`   Pending Users: ${stats.usersPending}`);
  console.log(`   Total Products: ${stats.productCount}`);
  console.log(`   Total Orders: ${stats.orderCount}\n`);

  console.log("✅ Migration complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
