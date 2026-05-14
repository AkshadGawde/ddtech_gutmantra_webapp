export interface CouponValidationResponse {
  success: boolean;
  couponCode: string;
  discount: number;
  subtotal: number;
  finalAmount: number;
  message?: string;
}

interface ValidateCouponRequest {
  couponCode: string;
  subtotal: number;
  userId: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export async function validateCoupon(
  couponCode: string,
  subtotal: number,
  userId: string
): Promise<CouponValidationResponse> {
  const response = await fetch(`${API_BASE}/validate-coupon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ couponCode, subtotal, userId } as ValidateCouponRequest),
  });

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || text || "Coupon validation failed";
    throw new Error(message);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Coupon validation returned invalid data");
  }

  if (!data.success) {
    throw new Error(data.message || "Coupon validation failed");
  }

  return data as CouponValidationResponse;
}
