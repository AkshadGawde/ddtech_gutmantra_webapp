import crypto from "crypto";

const MERCHANT_ID = process.env.BILLDESK_MERCHANT_ID!;

export interface BillDeskPayload {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
}

export function generateBillDeskPayload(
  data: BillDeskPayload
) {
  const txnAmount = data.amount.toFixed(2);

  const payload = {
    mercid: MERCHANT_ID,
    orderid: data.orderId,
    amount: txnAmount,
    currency: "356",
    ru: process.env.BILLDESK_RETURN_URL,
    itemcode: "DIRECT",
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
  };

  return payload;
}