export type CouponType = "percentage";

export interface CouponConfig {
  enabled: boolean;
  type: CouponType;
  value: number;
  maxDiscount: number;
  firstOrderOnly: boolean;
}

export const COUPONS: Record<string, CouponConfig> = {
  GMFIRST: {
    enabled: true,
    type: "percentage",
    value: 10,
    maxDiscount: 150,
    firstOrderOnly: true,
  },
};
