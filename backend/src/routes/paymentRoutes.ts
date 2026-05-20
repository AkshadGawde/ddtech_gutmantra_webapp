import express, { Request, Response, NextFunction } from "express";
import {
  createOrder,
  createOnlineOrder,
  billdeskCallback,
} from "../controllers/paymentController.js";
import { verifyBilldesk } from "../middleware/verifyBilldesk.js";

const router = express.Router();

const INDIAN_PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_ID_RE = /^[\w_]+$/;
const PIN_RE = /^[0-9]{6}$/;

function validationError(res: Response, errors: string[]) {
  return res.status(400).json({
    success: false,
    error: "VALIDATION_ERROR",
    errors,
  });
}

function validateCreateOrder(req: Request, res: Response, next: NextFunction) {
  const { orderID, orderId, paymentMode, shippingAddress, items } = req.body;
  const id = String(orderID || orderId || "").trim();
  const errors: string[] = [];

  if (!id || !ORDER_ID_RE.test(id)) errors.push("Invalid order ID format");
  if (!["ONLINE", "COD"].includes(paymentMode)) errors.push("paymentMode must be ONLINE or COD");
  if (!Array.isArray(items) || items.length === 0) errors.push("At least one cart item is required");

  if (!shippingAddress || typeof shippingAddress !== "object") {
    errors.push("shippingAddress is required");
  } else {
    const a = shippingAddress;
    if (!a.firstName?.trim()) errors.push("shippingAddress.firstName is required");
    if (!a.lastName?.trim()) errors.push("shippingAddress.lastName is required");
    if (!a.streetAddress?.trim()) errors.push("shippingAddress.streetAddress is required");
    if (!a.city?.trim()) errors.push("shippingAddress.city is required");
    if (!a.state?.trim()) errors.push("shippingAddress.state is required");
    if (!PIN_RE.test(String(a.pinCode || ""))) errors.push("shippingAddress.pinCode must be 6 digits");
    if (!a.country?.trim()) errors.push("shippingAddress.country is required");
    if (!INDIAN_PHONE_RE.test(String(a.phone || "").replace(/\D/g, "")))
      errors.push("shippingAddress.phone must be a valid 10-digit Indian mobile number");
    if (!EMAIL_RE.test(String(a.email || ""))) errors.push("shippingAddress.email is invalid");
  }

  if (errors.length > 0) {
    console.warn("❌ create-order validation errors:", errors);
    return validationError(res, errors);
  }
  next();
}

function validateCreateOnlineOrder(req: Request, res: Response, next: NextFunction) {
  const { orderId, amount, customerEmail, customerPhone } = req.body;
  const errors: string[] = [];

  if (!orderId || !ORDER_ID_RE.test(String(orderId).trim())) errors.push("Invalid order ID format");

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    errors.push("amount must be a positive number");
  } else {
    const decimals = (String(amount).split(".")[1] || "").length;
    if (decimals > 2) errors.push("amount must have at most 2 decimal places");
  }

  if (!EMAIL_RE.test(String(customerEmail || ""))) errors.push("customerEmail is invalid");
  if (!INDIAN_PHONE_RE.test(String(customerPhone || "").replace(/\D/g, "")))
    errors.push("customerPhone must be a valid 10-digit Indian mobile number");

  if (errors.length > 0) {
    console.warn("❌ create-online-order validation errors:", errors);
    return validationError(res, errors);
  }
  next();
}

/**
 * Create a host order and persist payment_pending in Firestore.
 */
router.post("/create-order", validateCreateOrder, createOrder);

/**
 * Initialize BillDesk redirect using a POST payload.
 */
router.post("/create-online-order", validateCreateOnlineOrder, createOnlineOrder);

/**
 * BillDesk callback endpoint. Verifies rdata/signature before processing.
 */
router.post("/billdesk/callback", verifyBilldesk, billdeskCallback);

export default router;
