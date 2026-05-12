import type { CouponConfig } from "../config/coupons.js";
import { COUPONS } from "../config/coupons.js";
import { getFirestoreDb } from "./firebaseAdmin.js";
import {
  calculateCouponDiscount,
  sanitizeCouponCode,
  sanitizeSubtotal,
} from "../utils/pricingUtils.js";

export interface CouponValidationResult {
  success: boolean;
  couponCode: string;
  discount: number;
  subtotal: number;
  finalAmount: number;
  message?: string;
}

export function findCouponConfig(couponCode: string): CouponConfig | undefined {
  const normalized = sanitizeCouponCode(couponCode);
  return Object.entries(COUPONS).find(([key]) =>
    key.toUpperCase().replace(/[^A-Z0-9]/g, "") === normalized
  )?.[1];
}

export async function userHasSuccessfulOrder(userId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection("orders")
    .where("userId", "==", userId)
    .where("paymentStatus", "==", "SUCCESS")
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function validateCoupon(
  couponCode: unknown,
  subtotalValue: unknown,
  userId: unknown
): Promise<CouponValidationResult> {
  const sanitizedCode = sanitizeCouponCode(couponCode);
  const subtotal = sanitizeSubtotal(subtotalValue);
  const normalizedUserId = String(userId ?? "").trim();

  if (!sanitizedCode) {
    throw new Error("Coupon code is required");
  }

  if (!normalizedUserId) {
    throw new Error("User ID is required");
  }

  const coupon = findCouponConfig(sanitizedCode);

  if (!coupon) {
    throw new Error("Coupon does not exist");
  }

  if (!coupon.enabled) {
    throw new Error("Coupon is not enabled");
  }

  if (subtotal <= 0) {
    throw new Error("Subtotal must be greater than 0");
  }

  if (coupon.firstOrderOnly) {
    const hasOrder = await userHasSuccessfulOrder(normalizedUserId);
    if (hasOrder) {
      throw new Error("Coupon is only valid for first-time customers");
    }
  }

  const { discount, finalAmount } = calculateCouponDiscount(
    subtotal,
    coupon
  );

  if (!Number.isFinite(discount) || discount < 0) {
    throw new Error("Invalid discount value");
  }

  if (discount > subtotal) {
    throw new Error("Discount cannot exceed subtotal");
  }

  return {
    success: true,
    couponCode: sanitizedCode,
    discount,
    subtotal,
    finalAmount,
  };
}
