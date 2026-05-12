import express from "express";
import { validateCoupon } from "../services/couponService.js";

const router = express.Router();

router.post("/validate-coupon", async (req, res) => {
  try {
    const { couponCode, subtotal, userId } = req.body;
    const result = await validateCoupon(couponCode, subtotal, userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || "Coupon validation failed",
    });
  }
});

export default router;
