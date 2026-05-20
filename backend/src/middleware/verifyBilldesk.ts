import { Request, Response, NextFunction } from "express";
import { parseBillDeskCallback } from "../services/billdeskService.js";
import { getOrderById } from "../services/orderService.js";

export interface BillDeskRequest extends Request {
  billdeskCallback?: ReturnType<typeof parseBillDeskCallback>;
}

export async function verifyBilldesk(
  req: BillDeskRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Step 1: Parse and verify rdata signature
    const callback = parseBillDeskCallback(req.body);

    if (!callback.valid) {
      console.error("❌ BillDesk callback signature/rdata verification failed", callback);
      return res.status(400).send("INVALID_BILLDESK_CALLBACK");
    }

    console.log("✅ BillDesk signature verification passed");

    // Step 2: Validate required callback fields
    if (!callback.orderId) {
      console.error("❌ Missing orderId in callback");
      return res.status(400).send("MISSING_ORDER_ID");
    }

    if (!callback.transactionId) {
      console.error("❌ Missing transactionId in callback");
      return res.status(400).send("MISSING_TRANSACTION_ID");
    }

    if (!callback.status) {
      console.error("❌ Missing status in callback");
      return res.status(400).send("MISSING_STATUS");
    }

    // Step 3: Validate transaction token against stored value
    const orderData = await getOrderById(callback.orderId);

    if (!orderData) {
      console.error(`❌ Order not found: ${callback.orderId}`);
      return res.status(404).send("ORDER_NOT_FOUND");
    }

    const storedToken = orderData.billdeskRequest?.transactionToken as string | undefined;
    const callbackToken = req.body.transactionToken as string | undefined;

    if (storedToken && callbackToken) {
      if (storedToken !== callbackToken) {
        console.error(`❌ Transaction token mismatch for order ${callback.orderId}`);
        return res.status(400).send("INVALID_TRANSACTION_TOKEN");
      }
      console.log("✅ Transaction token verified");
    } else if (storedToken && !callbackToken) {
      // BillDesk may not always send the token — log but don't block
      console.warn(`⚠️ Callback missing transaction token for order ${callback.orderId}`);
    }

    req.billdeskCallback = callback;
    next();
  } catch (error) {
    console.error("❌ BillDesk callback verification error:", error);
    return res.status(400).send("INVALID_BILLDESK_CALLBACK");
  }
}
