import { Request, Response, NextFunction } from "express";
import { parseBillDeskCallback } from "../services/billdeskService.js";

export interface BillDeskRequest extends Request {
  billdeskCallback?: ReturnType<typeof parseBillDeskCallback>;
}

export function verifyBilldesk(
  req: BillDeskRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const callback = parseBillDeskCallback(req.body);

    if (!callback.valid) {
      console.error("❌ BillDesk callback signature/rdata verification failed", callback);
      return res.status(400).send("INVALID_BILLDESK_CALLBACK");
    }

    req.billdeskCallback = callback;
    next();
  } catch (error) {
    console.error("❌ BillDesk callback verification error:", error);
    return res.status(400).send("INVALID_BILLDESK_CALLBACK");
  }
}
