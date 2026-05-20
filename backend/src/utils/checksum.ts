import crypto from "crypto";

const SECRET_KEY = process.env.BILLDESK_SECRET_KEY || "";

if (!SECRET_KEY) {
  throw new Error("BILLDESK_SECRET_KEY environment variable is required");
}

export function normalizeChecksumValue(value: unknown): string {
  return String(value ?? "").trim();
}

export function createChecksum(values: string[]): string {
  const payload = values.join("|");
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(payload, "utf8");
  return hmac.digest("hex");
}

export function verifyChecksum(expected: string, values: string[]): boolean {
  if (!expected) {
    return false;
  }

  const generated = createChecksum(values);
  return generated === expected;
}
