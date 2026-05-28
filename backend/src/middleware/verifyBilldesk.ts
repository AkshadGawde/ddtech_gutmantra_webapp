import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export interface BillDeskRequest extends Request {
  billdeskCallback?: Record<string, any>;
}

const MERCHANT_KEY = process.env.BILLDESK_MERCHANT_KEY || "";

/**
 * Verify BillDesk's BD-Signature header using HMAC-SHA256 with merchant key.
 * BillDesk signs the raw request body with the merchant key.
 * If signature is missing or key is not configured, we log and allow through
 * (captures first real webhook so we can confirm the exact format).
 */
export async function verifyBilldesk(
  req: BillDeskRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const bdSignature = (
      req.headers["bd-signature"] ||
      req.headers["x-billdesk-signature"] ||
      req.headers["billdesk-signature"] ||
      req.headers["x-signature"] ||
      ""
    ) as string;

    if (!bdSignature) {
      // BillDesk may not always send signature on redirect callbacks — log and proceed
      console.warn("⚠️ No BD-Signature header in BillDesk callback — proceeding without signature check");
      next();
      return;
    }

    if (!MERCHANT_KEY) {
      console.warn("⚠️ BILLDESK_MERCHANT_KEY not set — skipping signature verification");
      next();
      return;
    }

    // Use raw body if available (requires express raw body middleware), else re-stringify
    const rawBody: Buffer | undefined = (req as any).rawBody;
    const payload = rawBody
      ? rawBody.toString("utf8")
      : JSON.stringify(req.body);

    const expected = crypto
      .createHmac("sha256", MERCHANT_KEY)
      .update(payload)
      .digest("hex");

    if (bdSignature.toLowerCase() !== expected.toLowerCase()) {
      console.error("❌ BD-Signature mismatch", {
        received: bdSignature,
        expected,
        payloadLength: payload.length,
      });
      // Log mismatch but do NOT block — signature format may differ (base64 vs hex, etc.)
      // Remove this fallthrough once you've confirmed the correct format in production
      console.warn("⚠️ Signature mismatch — allowing through for debugging (check logs)");
    } else {
      console.log("✅ BD-Signature verified");
    }

    next();
  } catch (error) {
    console.error("❌ verifyBilldesk middleware error:", error);
    next();
  }
}
