import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.local") });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // BillDesk Payment Initiation (Placeholder)
  app.post("/api/payments/initiate", async (req, res) => {
    const { orderId, amount, customerEmail } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`Initiating payment for order ${orderId} of amount ${amount}`);

    res.json({
      success: true,
      paymentUrl: "https://mock-billdesk.com/pay",
      merchantId: process.env.BILLDESK_MERCHANT_ID || "MOCK_MERCHANT",
      bdOrderId: `BD_${nanoid()}`,
    });
  });

  app.post("/api/payments/callback", (req, res) => {
    // BillDesk will POST to this endpoint after payment
    const { bdOrderId, transactionStatus, amount } = req.body;

    console.log("Payment callback received:", { bdOrderId, transactionStatus });

    if (transactionStatus === "Success") {
      res.json({ success: true, message: "Payment confirmed" });
    } else {
      res.status(400).json({ success: false, message: "Payment failed" });
    }
  });

  // Vite middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "mpa",
    root: path.join(__dirname, "../frontend"),
  });

  app.use(vite.middlewares);
  app.use(express.static(path.join(__dirname, "../frontend/src")));

  app.get("*", async (req, res) => {
    try {
      const indexHtmlPath = path.join(__dirname, "../frontend/index.html");
      let html = fs.readFileSync(indexHtmlPath, "utf-8");
      html = await vite.transformIndexHtml(req.originalUrl, html);
      res.type("html");
      res.end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      res.status(500).end(err.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
