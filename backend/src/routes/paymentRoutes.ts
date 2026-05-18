import express from "express";
import {
  generateBillDeskPayload,
} from "../services/billdeskServices.js";
import { getFirestoreDb } from "../services/firebaseAdmin.js";

const router = express.Router();

/**
 * =========================================================
 * CREATE ONLINE ORDER
 * =========================================================
 */
router.post("/create-online-order", async (req, res) => {
  try {
    const {
      orderId,
      amount,
      customerEmail,
      customerPhone,
    } = req.body;

    console.log("💰 CREATE ONLINE ORDER BODY", req.body);

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    console.log("🚀 Initializing BillDesk payment:", {
      orderId,
      amount,
    });

    const billdeskPayload =
      generateBillDeskPayload({
        orderId,
        amount,
        customerEmail,
        customerPhone,
      });

    console.log("📦 BILLDESK PAYLOAD", billdeskPayload);

    const responseData = {
      success: true,
      paymentUrl: "https://pguat.billdesk.io/payments/ve1_2/orders/create",
      payload: billdeskPayload,
    };

    console.log("📡 BILLDESK RESPONSE", responseData);

    return res.json(responseData);
  } catch (error) {
    console.error(
      "❌ Payment initialization failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Payment initialization failed",
    });
  }
});

/**
 * =========================================================
 * BILLDESK CALLBACK
 * =========================================================
 */
router.post("/billdesk/callback", async (req, res) => {
  try {
    console.log(
      "📥 BillDesk Callback Received"
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    const db = getFirestoreDb();

    /**
     * BillDesk payload mapping
     * Update these after inspecting actual callback response
     */
    const orderId =
      req.body.orderId ||
      req.body.order_id ||
      req.body.merchantOrderId ||
      req.body.bdorderid;

    const transactionId =
      req.body.transactionId ||
      req.body.txnId ||
      req.body.transaction_id ||
      req.body.bdtransid;

    const paymentStatus =
      req.body.status ||
      req.body.auth_status ||
      req.body.transaction_status;

    if (!orderId) {
      console.error(
        "❌ Missing orderId in callback"
      );

      return res.status(400).json({
        success: false,
        message: "Missing orderId",
      });
    }

    const orderRef = db
      .collection("orders")
      .doc(orderId);

    /**
     * SUCCESS CASE
     */
    if (
      paymentStatus === "SUCCESS" ||
      paymentStatus === "0300" ||
      paymentStatus === "CAPTURED"
    ) {
      await orderRef.update({
        paymentStatus: "PAID",

        orderStatus: "PLACED",

        billdeskTransactionId:
          transactionId || null,

        paymentResponse: req.body,

        paidAt: new Date(),

        updatedAt: new Date(),
      });

      console.log(
        `✅ Payment successful for order ${orderId}`
      );
    } else {
      /**
       * FAILURE CASE
       */
      await orderRef.update({
        paymentStatus: "FAILED",

        orderStatus: "PAYMENT_FAILED",

        paymentResponse: req.body,

        updatedAt: new Date(),
      });

      console.log(
        `❌ Payment failed for order ${orderId}`
      );
    }

console.log("📥 BillDesk callback:", req.body);

    /**
     * BillDesk expects HTTP 200
     */
    return res.status(200).send("OK");
  } catch (error) {
    console.error(
      "❌ BillDesk callback error:",
      error
    );

    return res.status(500).send("ERROR");
  }
});

export default router;