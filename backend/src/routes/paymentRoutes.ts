import express from "express";
import {
  createOrder,
  createOnlineOrder,
  billdeskCallback,
} from "../controllers/paymentController.js";
import { verifyBilldesk } from "../middleware/verifyBilldesk.js";

const router = express.Router();

/**
 * Create a host order and persist payment_pending in Firestore.
 */
router.post("/create-order", createOrder);

/**
 * Initialize BillDesk redirect using a POST payload.
 */
router.post("/create-online-order", createOnlineOrder);

/**
 * BillDesk callback endpoint. Verifies rdata/signature before processing.
 */
router.post("/billdesk/callback", verifyBilldesk, billdeskCallback);

export default router;
