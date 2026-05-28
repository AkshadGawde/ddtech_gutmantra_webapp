import https from "https";
import crypto from "crypto";

const MERCHANT_ID = "KANAKV2";
const MERCHANT_KEY = "to8pJnluXU43FPzhC2P2YLlbmylW4NEm";

const payload = {
  mercid: MERCHANT_ID,
  orderid: "TEST-" + Date.now(),
  amount: "1.00",
  order_date: new Date().toISOString().split("T")[0],
  currency: "356",
  itemcode: "TEST",
  ru: "https://api.gutmantra.in/callback",
};

const signature = crypto
  .createHmac("sha256", MERCHANT_KEY)
  .update(JSON.stringify(payload))
  .digest("hex");

const options = {
  hostname: "uat1.billdesk.com",
  path: "/u2/payments/ve1_2/orders/create",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/jose",
    "BD-Traceid": Date.now() + "-TEST",
    "BD-Timestamp": new Date().toISOString().replace("Z", "+00:00"),
    "BD-Signature": signature,
  },
};

console.log("🔍 Testing BillDesk Create Order API...");
console.log("Payload:", JSON.stringify(payload, null, 2));
console.log("Timestamp:", options.headers["BD-Timestamp"]);
console.log("Signature:", signature.substring(0, 20) + "...");

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("\n📊 BillDesk Response:");
    console.log("Status:", res.statusCode);
    console.log("Headers:", JSON.stringify(res.headers, null, 2));
    console.log("Body:", data);
  });
});

req.on("error", (err) => {
  console.error("❌ Request failed:", err.message);
});

req.write(JSON.stringify(payload));
req.end();
EOF;
