import crypto from "crypto";
import {
  decodeRdata,
  encodeRdata,
} from "../utils/billdeskCrypto.js";

const MERCHANT_ID = process.env.BILLDESK_MERCHANT_ID || "";
const BILLDESK_RETURN_URL = process.env.BILLDESK_RETURN_URL || "";
const BILLDESK_BASE_URL = process.env.BILLDESK_BASE_URL || "https://sandbox.billdesk.com";
const BILLDESK_PAYMENT_CREATE_PATH =
  process.env.BILLDESK_PAYMENT_CREATE_PATH || "/payments/ve1_2/orders/create";
const BILLDESK_PAYMENT_URL = `${BILLDESK_BASE_URL}${BILLDESK_PAYMENT_CREATE_PATH}`;

if (!MERCHANT_ID) {
  throw new Error("BILLDESK_MERCHANT_ID environment variable is required");
}

if (!BILLDESK_RETURN_URL) {
  throw new Error("BILLDESK_RETURN_URL environment variable is required");
}

export interface BillDeskPayloadData {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
}

export interface BillDeskFormPayload {
  mercid: string;
  bdorderid: string;
  rdata: string;
}

export interface BillDeskInitResult {
  success: boolean;

  next_step: string;

  links: Array<{

    rel: string;

    href: string;

    method: string;

    parameters: Record<string, string>;

  }>;

  transactionToken: string;
}

export function buildBillDeskFormPayload(
  data: BillDeskPayloadData
): BillDeskInitResult {
  const txnAmount = data.amount.toFixed(2);
  const rdata = encodeRdata({
    orderId: data.orderId,
    amount: txnAmount,
    currency: "356",
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    ru: BILLDESK_RETURN_URL,
    createdAt: new Date().toISOString(),
  });

  const payload: BillDeskFormPayload = {
    mercid: MERCHANT_ID,
    bdorderid: data.orderId,
    rdata,
  };

  return {
    success: true,

  next_step: "redirect",

  links: [

    {

      rel: "redirect",

      href: BILLDESK_PAYMENT_URL,

      method: "POST",

      parameters: {

        mercid: payload.mercid,

        bdorderid: payload.bdorderid,

        rdata: payload.rdata,

      },

    },

  ],

  transactionToken: cryptoRandomToken(),
  };
}

export interface BillDeskCallbackData {
  valid: boolean;
  message: string;
  orderId: string;
  transactionId: string;
  status: string;
  amount: number;
  raw: Record<string, unknown>;
  rdata: Record<string, unknown> | null;
}

export function parseBillDeskCallback(body: Record<string, any>): BillDeskCallbackData {
  const orderId =
    String(body.bdorderid || body.orderid || body.orderId || body.order_id || body.merchantOrderId || "").trim();

  const transactionId =
    String(body.bdtransid || body.txnId || body.transactionId || body.transaction_id || "").trim();

  const status =
    String(body.status || body.auth_status || body.transaction_status || body.txnStatus || "").trim();

  const rdataString = String(body.rdata || "").trim();
  let decodedRdata: Record<string, unknown> | null = null;
  let valid = false;
  let amount = 0;

  if (rdataString) {
    try {
      decodedRdata = decodeRdata(rdataString);
      amount = Number(decodedRdata.amount ?? body.amount ?? body.txnAmount ?? body.transaction_amount ?? 0);
      valid = decodedRdata.orderId === orderId;
    } catch (error) {
      valid = false;
      console.error("❌ rdata decode failed:", error);
    }
  }

  if (!decodedRdata) {
    amount = Number(body.amount || body.txnAmount || body.transaction_amount || 0);
  }

  return {
    valid,
    message: valid ? "Callback validated using encoded rdata" : "Invalid callback payload or rdata",
    orderId,
    transactionId,
    status,
    amount,
    raw: body,
    rdata: decodedRdata,
  };
}

export function isBillDeskSuccess(status?: string): boolean {
  if (!status) return false;
  const normalized = status.toString().trim().toUpperCase();
  return ["SUCCESS", "0300", "CAPTURED", "APPROVED", "TXN_SUCCESS", "SETTLED"].includes(normalized);
}

function cryptoRandomToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
