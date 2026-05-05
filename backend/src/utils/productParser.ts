import fs from "fs";
import { parse } from "csv-parse/sync";
import { getFirestoreDb } from "../services/firebaseAdmin.js";

/* -------- TYPES -------- */

interface ProductVariant {

  grind?: string | null;

  quantity?: string | null;

  price: number;

  sku?: string | null;

  petpoojaId?: string | null;

}

interface Product {
  wordpressProductId: string;
  sku?: string | null;
  name: string;
  description: string;
  category: string;
  images: string[];
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

interface InsertResult {
  created: number;
  skipped: number;
  errors: string[];
}

/* -------- PARSER -------- */

export function parseProductsCSV(filePath: string): Product[] {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const rows = parse(fileContent, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });

  console.log("📄 Found", rows.length, "rows\n");

  const productsById = new Map<string, Product>();
  const productsBySku = new Map<string, Product>();

  for (const row of rows) {
    const type = row["Type"]?.toLowerCase().trim();
    const id = row["ID"]?.toString().trim();
    const sku = row["SKU"]?.toString().trim();

    /* ---------- PARENT PRODUCTS ---------- */
    if (type === "variable" || type === "simple") {
      if (!id) continue;

      const product: Product = {
        wordpressProductId: id,
        sku: sku || null,
        name: row["Name"] || "",
        description: row["Description"] || "",
        category: row["Categories"] || "",
        images: row["Images"]
          ? row["Images"].split(",").map((i: string) => i.trim())
          : [],
        variants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsById.set(id, product);

      if (sku) {
        productsBySku.set(sku, product); // 🔥 key fix
      }
    }

    /* ---------- VARIATIONS ---------- */
    if (type === "variation") {
      const parentSku = row["Parent"]?.toString().trim();
      if (!parentSku) continue;

      const parent = productsBySku.get(parentSku);

      if (!parent) {
        console.warn("⚠️ Parent not found for SKU:", parentSku);
        continue;
      }

      const price =
        parseFloat(row["Regular price"] || "0") ||
        parseFloat(row["Sale price"] || "0");

      const variant: ProductVariant = {

  grind: row["Attribute 2 value(s)"]?.trim() || null,

  quantity: row["Attribute 1 value(s)"]?.trim() || null,

  price,

  sku: row["SKU"] || null,

};

      parent.variants.push(variant);
    }
  }

  const products = Array.from(productsById.values()).filter(
    (p) => p.variants.length > 0
  );

  console.log("✅ Parsed products:", products.length);

  return products;
}

/* -------- INSERT -------- */

export async function batchInsertProducts(
  products: Product[]
): Promise<InsertResult> {
  const db = getFirestoreDb();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const existing = await db.collection("products").get();
  const existingIds = new Set(
    existing.docs.map((d) => d.data().wordpressProductId)
  );

  for (let i = 0; i < products.length; i += 500) {
    const batch = db.batch();
    const chunk = products.slice(i, i + 500);

    for (const product of chunk) {
      if (existingIds.has(product.wordpressProductId)) {
        skipped++;
        continue;
      }

      try {
        const ref = db.collection("products").doc();

        batch.set(ref, product);
        created++;
      } catch (err) {
        errors.push(
          `${product.wordpressProductId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    await batch.commit();
    console.log(`✅ Batch ${i / 500 + 1} committed`);
  }

  return { created, skipped, errors };
}

/* -------- MAIN -------- */

export async function migrateProducts(filePath: string) {
  console.log("🚀 Starting products migration...\n");

  const products = parseProductsCSV(filePath);

  if (!products.length) {
    console.log("❌ No products found");
    return {
      created: 0,
      skipped: 0,
      errors: [],
    };
  }

  const result = await batchInsertProducts(products);

  console.log("\n📊 DONE");
  console.log("Created:", result.created);
  console.log("Skipped:", result.skipped);

  return result; // 🔥 clean return
}