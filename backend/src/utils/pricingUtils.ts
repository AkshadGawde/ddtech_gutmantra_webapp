import type { CouponConfig } from "../config/coupons.js";

export function sanitizeCouponCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function sanitizeSubtotal(value: unknown): number {
  const subtotal = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    throw new Error("Invalid subtotal");
  }
  return subtotal;
}

export function calculatePercentageDiscount(
  subtotal: number,
  percentage: number,
  maxDiscount: number
): { discount: number; finalAmount: number } {
  const rawDiscount = (subtotal * percentage) / 100;
  const discount = Math.min(Math.max(0, rawDiscount), maxDiscount, subtotal);
  const finalAmount = Math.max(0, subtotal - discount);
  return {
    discount: Math.round(discount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: CouponConfig
): { discount: number; finalAmount: number } {
  if (coupon.type === "percentage") {
    return calculatePercentageDiscount(subtotal, coupon.value, coupon.maxDiscount);
  }

  return {
    discount: 0,
    finalAmount: subtotal,
  };
}
