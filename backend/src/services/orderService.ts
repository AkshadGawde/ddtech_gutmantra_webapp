import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "./firebaseAdmin.js";

export type OrderPaymentMode = "ONLINE" | "COD";
export type OrderPaymentStatus =
  | "payment_pending"
  | "payment_success"
  | "payment_failed"
  | "payment_cancelled";

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  country: string;
  streetAddress: string;
  apartment?: string | null;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface OrderItemRecord {
  id: string;
  variation_id: string;
  name: string;
  price: string;
  quantity: string;
  tax_inclusive: boolean;
  gst_liability: string;
  item_tax: any[];
  item_discount: string;
  final_price: string;
  description: string;
  variation_name: string;
  AddonItem: { details: any[] };
}

export interface OrderCreatePayload {
  orderId: string;
  userId: string;
  paymentMode: OrderPaymentMode;
  shippingAddress: ShippingAddress;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  finalAmount: number;
  deliveryDistanceKm: number;
  couponCode?: string | null;
}

export interface OrderRecord extends OrderCreatePayload {
  orderID: string;
  total: number;
  paymentStatus: OrderPaymentStatus;
  orderStatus: string;
  isDeliverable: boolean;
  source: string;
  createdAt: any;
  updatedAt: any;
  billdeskRequest?: Record<string, unknown>;
  paymentResponse?: unknown;
  billdeskTransactionId?: string;
  paidAt?: any;
  petpoojaID?: string;
  petpoojaResponse?: unknown;
  petpoojaSyncStatus?: string;
  failureReason?: string;
}

export async function createOrderRecord(payload: OrderCreatePayload) {
  const db = getFirestoreDb();
  const orderRef = db.collection("orders").doc(payload.orderId);
  const orderStatus =
    payload.paymentMode === "ONLINE" ? "PAYMENT_PENDING" : "PLACED";
  const paymentStatus =
    payload.paymentMode === "ONLINE" ? "payment_pending" : "payment_success";

  const orderRecord: OrderRecord = {
    orderId: payload.orderId,
    orderID: payload.orderId,
    userId: payload.userId,
    paymentMode: payload.paymentMode,
    shippingAddress: payload.shippingAddress,
    items: payload.items,
    subtotal: payload.subtotal,
    discount: payload.discount,
    couponCode: payload.couponCode ?? null,
    deliveryCharge: payload.deliveryCharge,
    finalAmount: payload.finalAmount,
    total: payload.finalAmount,
    deliveryDistanceKm: payload.deliveryDistanceKm,
    isDeliverable: true,
    paymentStatus,
    orderStatus,
    source: "app",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await orderRef.set(orderRecord, { merge: true });
  return orderRecord;
}

export async function getOrderById(orderId: string) {
  const db = getFirestoreDb();
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  return orderSnap.exists ? orderSnap.data() : null;
}

export async function updateOrderRecord(orderId: string, updates: Record<string, unknown>) {
  const db = getFirestoreDb();
  const orderRef = db.collection("orders").doc(orderId);
  await orderRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
