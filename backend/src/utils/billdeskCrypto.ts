import crypto from "crypto";

const BILLDESK_SECRET_KEY = process.env.BILLDESK_SECRET_KEY || "";

if (!BILLDESK_SECRET_KEY) {
  throw new Error("BILLDESK_SECRET_KEY environment variable is required");
}

export function createBillDeskSignature(payload: string): string {
  const hmac = crypto.createHmac("sha256", BILLDESK_SECRET_KEY);
  hmac.update(payload, "utf8");
  return hmac.digest("hex");
}

export function verifyBillDeskSignature(payload: string, expectedSignature: string): boolean {
  if (!expectedSignature) {
    return false;
  }

  const generated = createBillDeskSignature(payload);
  return generated === expectedSignature;
}

export function encodeRdata(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(data);
  const encoded = Buffer.from(serialized, "utf8").toString("base64");
  const signature = createBillDeskSignature(encoded);
  return `${encoded}.${signature}`;
}

export function decodeRdata(rdata: string) {
  if (!rdata || typeof rdata !== "string") {
    throw new Error("Missing rdata");
  }

  const [encoded, signature] = rdata.split(".");
  if (!encoded || !signature) {
    throw new Error("Malformed rdata");
  }

  if (!verifyBillDeskSignature(encoded, signature)) {
    throw new Error("Invalid rdata signature");
  }

  const decodedJson = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(decodedJson);
}
