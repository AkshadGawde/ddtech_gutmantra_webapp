import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebaseAdmin } from "./src/services/firebaseAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";

dotenv.config();

const __dirname = process.cwd();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  console.log("🔥 Initializing Firebase Admin SDK...");
  try {
    initializeFirebaseAdmin();
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    process.exit(1);
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  // Auth routes
  console.log("📝 Registering auth routes...");
  app.use("/api/auth", authRoutes);

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
      bdOrderId: `BD_${Date.now()}`,
    });
  });

  app.post("/api/payments/callback", (req, res) => {
    const { bdOrderId, transactionStatus, amount } = req.body;

    console.log("Payment callback received:", { bdOrderId, transactionStatus });

    if (transactionStatus === "Success") {
      res.json({ success: true, message: "Payment confirmed" });
    } else {
      res.status(400).json({ success: false, message: "Payment failed" });
    }
  });

  // Vite middleware for frontend
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);
  app.use(express.static(path.join(__dirname, "src")));

  app.get("*", async (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.type("html");
    const html = await vite.transformIndexHtml(
      req.originalUrl,
      "<!DOCTYPE html><html></html>"
    );
    res.end(html);
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📝 Auth endpoints:`);
    console.log(`   POST /api/auth/legacy-login - Migrate WordPress users`);
    console.log(`   POST /api/auth/login - Firebase login`);
    console.log(`   POST /api/auth/register - Register new user`);
    console.log(`   GET /api/auth/profile - Get user profile`);
    console.log(`   POST /api/auth/logout - Logout`);
  });
}

startServer().catch(console.error);
