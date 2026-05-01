import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

export interface Product {
  id: string;
  name: string;
  category: "atta" | "oils" | "spices";
  subcategory?: string;
  description: string;
  price: number;
  unit: string;
  images: string[];
  variants?: { weight: string; price: number; stock: number }[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  createdAt?: any;
}

const PRODUCTS_COLLECTION = "products";

export const getProducts = async (category?: string) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  let q = query(productsRef, orderBy("createdAt", "desc"));
  
  if (category) {
    q = query(productsRef, where("category", "==", category), orderBy("createdAt", "desc"));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getProduct = async (id: string) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Product;
  }
  return null;
};

export const addProduct = async (product: Omit<Product, "id">) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  return await addDoc(productsRef, {
    ...product,
    createdAt: serverTimestamp()
  });
};

export const uploadProductImage = async (file: File) => {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export function normalizeProduct(p: any) {
  return {
    id: p.id,
    name: p.name || "",
    price:
      Number(p.price) ||
      Number(p.sellingPrice) ||
      Number(p.mrp) ||
      Number(p.variants?.[0]?.price) ||
      0,
    image: p.image || p.images?.[0] || "",
    category: p.category || "",
  };
}