import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

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
 * Converts raw Firestore product → clean frontend product
 */
export function normalizeProduct(p: any): Product {
  return {
    id: p.id,

    name: p.name || p.itemname || "",

    price:
      Number(p.price) ||
      Number(p.sellingPrice) ||
      Number(p.mrp) ||
      Number(p.variants?.[0]?.price) ||
      Number(p.variation?.[0]?.price) ||
      0,

    image:
      p.image ||
      p.images?.[0] ||
      p.item_image_url ||
      "",

    images: p.images || [],

    category: normalizeCategory(p.category || p.categoryname),

    rawCategory: p.category || p.categoryname || "",

    description:
      p.description ||
      p.itemdescription ||
      "",

    variants:
      p.variants ||
      p.variation ||
      [],

    createdAt: p.createdAt || null,
    
  };
  
}