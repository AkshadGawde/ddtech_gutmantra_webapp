import { useEffect, useState } from "react";
import { validateCoupon, type CouponValidationResponse } from "@/services/couponService";

interface UseCouponResult {
  couponCode: string;
  setCouponCode: (value: string) => void;
  discount: number;
  finalAmount: number;
  couponApplied: boolean;
  loading: boolean;
  message: string | null;
  applyCoupon: () => Promise<void>;
  clearCoupon: () => void;
}

interface UseCouponOptions {
  subtotal: number;
  userId?: string;
}

export function useCoupon({ subtotal, userId }: UseCouponOptions): UseCouponResult {
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(subtotal);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFinalAmount(subtotal);
    if (!couponApplied) {
      setDiscount(0);
    }
  }, [subtotal, couponApplied]);

  const applyCoupon = async () => {
    if (!userId) {
      setMessage("Login is required to apply coupons.");
      return;
    }

    if (!couponCode.trim()) {
      setMessage("Please enter a coupon code.");
      return;
    }

    if (subtotal <= 0) {
      setMessage("Invalid subtotal for coupon validation.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response: CouponValidationResponse = await validateCoupon(
        couponCode,
        subtotal,
        userId
      );

      setDiscount(response.discount);
      setFinalAmount(response.finalAmount);
      setCouponApplied(true);
      setMessage(`Coupon applied successfully: ₹${response.discount} off.`);
    } catch (error: any) {
      setDiscount(0);
      setFinalAmount(subtotal);
      setCouponApplied(false);
      setMessage(error?.message || "Coupon validation failed");
    } finally {
      setLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    setFinalAmount(subtotal);
    setCouponApplied(false);
    setMessage(null);
  };

  return {
    couponCode,
    setCouponCode,
    discount,
    finalAmount,
    couponApplied,
    loading,
    message,
    applyCoupon,
    clearCoupon,
  };
}
