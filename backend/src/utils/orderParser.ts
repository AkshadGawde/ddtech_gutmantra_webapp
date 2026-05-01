import fs from "fs";
import { parse } from "csv-parse/sync";
import { getFirestoreDb } from "../services/firebaseAdmin.js";

/* ---------------- TYPES ---------------- */

interface OrderItem {
  productId: string;
  name: string;
  grind?: string | null;
  variant?: string | null;
  quantity: number;
  price: number;
}

interface ParsedOrder {
  wordpressOrderId: string;
  wordpressUserId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

interface OrderStats {
  processed: number;
  successful: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/* ---------------- HELPERS ---------------- */

// 🔥 KEY NORMALIZER (THIS IS THE HERO)
function get(row: any, key: string) {
  const keys = Object.keys(row);
  const foundKey = keys.find(
    (k) => k.trim().toLowerCase() === key.toLowerCase()
  );
  return foundKey ? row[foundKey] : undefined;
}

// Fix weird date format
function parseWPDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  try {
    const [date, time] = dateStr.split(" ");
    const [day, month, year] = date.split("/");

    return new Date(
      Number("20" + year),
      Number(month) - 1,
      Number(day),
      ...(time ? time.split(":").map(Number) : [0, 0])
    );
  } catch {
    return new Date();
  }
}

/* ---------------- EXTRACT ITEMS ---------------- */

function extractItems(row: any): OrderItem[] {
  const items: OrderItem[] = [];

  for (let i = 1; i <= 7; i++) {
    const rawName = get(row, `Product Item ${i} Name`);
    const id = get(row, `Product Item ${i} id`);
    const qty = get(row, `Product Item ${i} Quantity`);
    const total = get(row, `Product Item ${i} Total`);

    if (!rawName) continue;

    // 🔥 SPLIT NAME
    // "Sehore Super - Normal, 5 KG"
    let productName = rawName;
    let grind = null;
    let variant = null;

    try {
      const [namePart, rest] = rawName.split(" - ");

      productName = namePart;

      if (rest) {
        const [grindPart, variantPart] = rest.split(",");

        grind = grindPart?.trim().toLowerCase() || null;
        variant = variantPart?.trim().toLowerCase().replace(" ", "") || null;
      }
    } catch {}

    items.push({
      productId: String(id).trim(),
      name: productName,
      grind,
      variant,
      quantity: parseInt(qty || "1") || 1,
      price: parseFloat(total || "0") || 0,
    });
  }

  return items;
}

/* ---------------- PARSE CSV ---------------- */

export function parseOrdersCSV(filePath: string) {
  const stats: OrderStats = {
    processed: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const orders: ParsedOrder[] = [];

  const fileContent = fs.readFileSync(filePath, "utf-8");

  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ",",
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log("📄 Found", rows.length, "orders");

  for (const row of rows) {
    stats.processed++;

    // 🔥 DEBUG FIRST ROW
    if (stats.processed === 1) {
      console.log("🧪 RAW KEYS:", Object.keys(row));
    }

    try {
      const orderId =
        get(row, "order_id") ||
        get(row, "order_number");

      const userId =
        get(row, "customer_user") ||
        get(row, "customer_id");

      const total = parseFloat(get(row, "order_total") || "0");

      if (!orderId || !userId) {
        stats.skipped++;
        continue;
      }

      const items = extractItems(row);

      if (!items.length) {
        stats.skipped++;
        continue;
      }

      const parsedOrder: ParsedOrder = {
        wordpressOrderId: String(orderId),
        wordpressUserId: String(userId),
        items,
        totalAmount: isNaN(total) ? 0 : total,
        status: get(row, "status") || "pending",
        createdAt: parseWPDate(get(row, "order_date")),
      };

      orders.push(parsedOrder);
      stats.successful++;

      if (stats.successful === 1) {
        console.log("🧪 Sample order:", parsedOrder);
      }
    } catch (err) {
      stats.failed++;
      stats.errors.push(`Error: ${String(err)}`);
    }
  }

  console.log(
    `✅ Parsed: ${stats.successful}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`
  );

  return { orders, stats };
}

/* ---------------- INSERT ---------------- */

export async function batchInsertOrders(orders: ParsedOrder[]) {
  const db = getFirestoreDb();

  let created = 0;
  let skipped = 0;

  if (!orders.length) {
    console.log("⚠️ No orders to insert");
    return { created: 0, skipped: 0 };
  }

  console.log(`💾 Inserting ${orders.length} orders...`);

  const existing = await db.collection("orders").get();
  const existingIds = new Set(
    existing.docs.map((d) => d.data().wordpressOrderId)
  );

  for (let i = 0; i < orders.length; i += 500) {
    const batch = db.batch();
    const chunk = orders.slice(i, i + 500);

    for (const order of chunk) {
      if (existingIds.has(order.wordpressOrderId)) {
        skipped++;
        continue;
      }

      const ref = db.collection("orders").doc();

      batch.set(ref, {
        ...order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      created++;
    }

    await batch.commit();
    console.log(`✅ Batch ${Math.floor(i / 500) + 1} committed`);
  }

  console.log(`📊 Insert complete: ${created} created, ${skipped} skipped`);

  return { created, skipped };
}

/* ---------------- MAIN ---------------- */

export async function migrateOrders(filePath: string) {
  console.log("🚀 Starting order migration...\n");

  const { orders, stats } = parseOrdersCSV(filePath);

  if (!orders.length) {
    console.log("❌ No valid orders to migrate\n");
    return { created: 0, skipped: stats.skipped };
  }

  const result = await batchInsertOrders(orders);

  console.log("\n✅ Order migration complete!");
  console.log(`Created: ${result.created}, Skipped: ${result.skipped}\n`);

  return result;
}