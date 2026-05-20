import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { getCloudinaryImage } from "../utils/cloudinary";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

/* ================= TYPES ================= */

export interface Product {
  id: string;
  name: string;
  category: "atta" | "oils" | "spices" | "other";
  rawCategory?: string;

  description?: string;
  price: number;

  image?: string;
  images?: string[];

  variants?: any[];

  createdAt?: any;
}

/* ================= COLLECTION ================= */

const PRODUCTS_COLLECTION = "products";

/* ================= GET ALL PRODUCTS ================= */
/**
 * IMPORTANT:
 * - No Firestore filtering
 * - We normalize + filter on frontend
 */
export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));

  return snapshot.docs.map((docSnap) =>
    normalizeProduct({
      id: docSnap.id,
      ...docSnap.data(),
    })
  );
};

/* ================= GET SINGLE PRODUCT ================= */

export const getProduct = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  return normalizeProduct({
    id: snap.id,
    ...snap.data(),
  });
};

/* ================= ADD PRODUCT ================= */

export const addProduct = async (product: Omit<Product, "id">) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);

  return await addDoc(productsRef, {
    ...product,
    createdAt: serverTimestamp(),
  });
};

/* ================= IMAGE UPLOAD ================= */

export const uploadProductImage = async (file: File) => {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/* ================= NORMALIZATION ================= */

/**
 * Converts Firestore category → frontend category
 */
function normalizeCategory(raw: string): "atta" | "oils" | "spices" | "other" {
  const val = raw?.toLowerCase() || "";

  if (val.includes("aata") || val.includes("atta")) return "atta";
  if (val.includes("oil")) return "oils";
  if (val.includes("masala") || val.includes("spice")) return "spices";

  return "other";
}

/**
 * Returns the lowest non-zero price across all variants, or 0 if none found.
 */
function lowestVariantPrice(variants: any[]): number {
  let min = 0;
  for (const v of variants) {
    const p = Number(v?.price ?? v?.sellingPrice ?? v?.mrp ?? 0);
    if (p > 0 && (min === 0 || p < min)) min = p;
  }
  return min;
}

/**
 * Converts raw Firestore product → clean frontend product
 */
export function normalizeProduct(p: any): Product {
  const rawVariants: any[] = p.variants || p.variation || [];

  const enrichedVariants = rawVariants.map((v: any) => {
    const enriched = { ...v };

    // SKU fallback chain
    if (!enriched.sku) {
      enriched.sku =
        enriched.variationId ||
        enriched.variation_id ||
        enriched.itemVariationId ||
        enriched.item_variation_id ||
        enriched.eid ||
        enriched.EID ||
        (enriched.petpoojaId ? String(enriched.petpoojaId).replace(/^V/, "") : null) ||
        p.sku ||
        p.itemid ||
        p.id;
    }

    // petpoojaId fallback chain
    if (!enriched.petpoojaId) {
      if (enriched.variationId) {
        enriched.petpoojaId = `V${enriched.variationId}`;
      } else if (enriched.sku) {
        enriched.petpoojaId = `V${enriched.sku}`;
      } else if (p.sku || p.itemid) {
        enriched.petpoojaId = `V${p.sku || p.itemid}`;
      } else {
        enriched.petpoojaId = `V${p.id}`;
      }
    }

    // Price fallback: only fill in when the variant truly has no price.
    // Do NOT replace a valid variant price with the product base price —
    // spice products intentionally have base_price=0 with variant-level prices.
    if (Number(enriched.price) <= 0) {
      // Try the product base price only if it's a real non-zero value
      const basePrice = Number(p.price) || Number(p.sellingPrice) || Number(p.mrp) || 0;
      if (basePrice > 0) {
        enriched.price = basePrice;
      }
      // Leave at 0 if even the product price is 0 — don't manufacture a wrong value
    }

    return enriched;
  });

  // Product-level price: use base price, then fall back to lowest non-zero variant price
  const basePrice =
    Number(p.price) ||
    Number(p.sellingPrice) ||
    Number(p.mrp) ||
    0;
  const productPrice = basePrice > 0 ? basePrice : lowestVariantPrice(enrichedVariants);

  return {
    id: p.id,
    name: p.name || p.itemname || "",
    price: productPrice,
    image:
      p.image ||
      p.images?.[0] ||
      getCloudinaryImage(p.id),
    images: p.images || [],
    category: normalizeCategory(p.category || p.categoryname),
    rawCategory: p.category || p.categoryname || "",
    description: p.description || p.itemdescription || "",
    variants: enrichedVariants,
    createdAt: p.createdAt || null,
  };
}

/* ================= FETCH WITH VARIANTS (DETAILED) ================= */

/**
 * Fetches a single product and logs full variant details for debugging.
 * Use this in ProductPage instead of getProduct() for better diagnostics.
 */
export const fetchProductWithVariants = async (id: string): Promise<Product | null> => {
  console.log(`🔍 [fetchProductWithVariants] Loading product: ${id}`);

  const product = await getProduct(id);

  if (!product) {
    console.error(`❌ [fetchProductWithVariants] Product not found: ${id}`);
    return null;
  }

  const variants = product.variants ?? [];
  const pricedVariants = variants.filter((v) => Number(v.price) > 0);

  console.log(`✅ [fetchProductWithVariants] Loaded: "${product.name}" (${product.id})`);
  console.log(`   base price:      ₹${product.price}`);
  console.log(`   total variants:  ${variants.length}`);
  console.log(`   priced variants: ${pricedVariants.length}`);

  variants.forEach((v, i) => {
    const qty = v.quantity ?? v.name ?? "—";
    const grind = v.grind ? ` | grind: ${v.grind}` : "";
    console.log(
      `   [${i}] qty="${qty}"${grind} | price=₹${v.price} | sku="${v.sku}" | petpoojaId="${v.petpoojaId}"`
    );
  });

  if (product.price === 0 && pricedVariants.length === 0) {
    console.warn(
      `⚠️ [fetchProductWithVariants] "${product.name}" has NO pricing data. ` +
      `Both base price and all variant prices are 0. Check Petpooja sync.`
    );
  } else if (product.price === 0 && pricedVariants.length > 0) {
    const summary = pricedVariants.map((v) => `${v.quantity ?? v.name}=₹${v.price}`).join(", ");
    console.log(`ℹ️ [fetchProductWithVariants] "${product.name}" uses variant-level pricing: ${summary}`);
  }

  return product;
};