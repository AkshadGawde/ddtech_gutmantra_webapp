import { getFirestoreDb } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export interface CartItemData {
  id: string;
  productId?: string;
  base_id?: string;
  variation_id?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  petpoojaId?: string;
  category?: string;
  grind?: string;
  selectedQuantity?: string;
  sku?: string;
}

export interface StoredCartItem extends CartItemData {
  _docId: string;
}

// Generates a stable Firestore doc ID for a cart item based on product id + variant
function cartDocId(id: string, variant?: string): string {
  const raw = `${id}_${variant || 'default'}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function getCart(userId: string): Promise<StoredCartItem[]> {
  const db = getFirestoreDb();
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection('cart')
    .get();

  return snap.docs.map((doc) => ({
    ...(doc.data() as CartItemData),
    _docId: doc.id,
  }));
}

export async function addOrUpdateCartItem(
  userId: string,
  item: CartItemData
): Promise<StoredCartItem[]> {
  const db = getFirestoreDb();
  const docId = cartDocId(item.id, item.variant);
  const ref = db
    .collection('users')
    .doc(userId)
    .collection('cart')
    .doc(docId);

  const existing = await ref.get();

  if (existing.exists) {
    await ref.update({
      quantity: FieldValue.increment(item.quantity),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set({
      ...item,
      addedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return getCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  docId: string,
  quantity: number
): Promise<StoredCartItem[]> {
  const db = getFirestoreDb();

  if (quantity < 1) {
    await db
      .collection('users')
      .doc(userId)
      .collection('cart')
      .doc(docId)
      .delete();
  } else {
    await db
      .collection('users')
      .doc(userId)
      .collection('cart')
      .doc(docId)
      .update({
        quantity,
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  return getCart(userId);
}

export async function removeCartItem(
  userId: string,
  docId: string
): Promise<StoredCartItem[]> {
  const db = getFirestoreDb();
  await db
    .collection('users')
    .doc(userId)
    .collection('cart')
    .doc(docId)
    .delete();

  return getCart(userId);
}

export async function clearCart(userId: string): Promise<void> {
  const db = getFirestoreDb();
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection('cart')
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
