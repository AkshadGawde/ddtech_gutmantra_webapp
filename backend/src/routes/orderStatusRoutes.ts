import express from "express";
import { getFirestoreDb } from "../services/firebaseAdmin.js";

const router = express.Router();

/**
 * GET ORDER PAYMENT STATUS
 */
router.get("/order-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({
        success: false,
        error: "INVALID_ORDER_ID",
        message: "Order ID is required and must be a string",
      });
    }

    const db = getFirestoreDb();

    const orderDoc = await db
      .collection("orders")
      .doc(orderId)
      .get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderData = orderDoc.data();

    return res.json({
      success: true,
      orderId,
      paymentStatus: orderData?.paymentStatus || "unknown",
      orderStatus: orderData?.orderStatus || "unknown",
      petpoojaID: orderData?.petpoojaID || null,
      updatedAt: orderData?.updatedAt || null,
    });
  } catch (error) {
    console.error(
      "❌ Order status fetch failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order status",
    });
  }
});

export default router;