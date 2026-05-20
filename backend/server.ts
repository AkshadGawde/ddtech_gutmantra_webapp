import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebaseAdmin, getFirestoreDb } from "./src/services/firebaseAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";
import couponRoutes from "./src/routes/couponRoutes.js";
import deliveryRoutes from "./src/routes/deliveryRoutes.js";
import { syncMenuToFirestore } from "./src/services/menuSync.js";
import { syncOrdersToFirestore } from "./src/services/orderSync.js";
import { getDeliveryResult } from "./src/services/deliveryService.js";
import { FieldValue } from "firebase-admin/firestore";

import paymentRoutes from "./src/routes/paymentRoutes.js";
import orderStatusRoutes from "./src/routes/orderStatusRoutes.js";

dotenv.config();

// ─── WooCommerce ──────────────────────────────────────────────────────────────

const WC_BASE_URL = "https://gutmantra.in";
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET!;
const WC_AUTH = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

const WC_STATUS_MAPPING: Record<string, string> = {
  "1": "processing",
  "10": "completed",
  "-1": "cancelled",
};

const SKIP_STATUSES = ["5", "4"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  "1": "Accepted by Kitchen",
  "2": "Preparing",
  "4": "Out for Delivery",
  "5": "Ready for Pickup",
  "10": "Delivered",
  "-1": "Cancelled",
};

// ─── Petpooja ─────────────────────────────────────────────────────────────────

const PP_APP_KEY = process.env.PETPOOJA_APP_KEY!;
const PP_APP_SECRET = process.env.PETPOOJA_APP_SECRET!;
const PP_ACCESS_TOKEN = process.env.PETPOOJA_ACCESS_TOKEN!;
const PP_REST_ID = process.env.PETPOOJA_REST_ID!;
const PP_CREATE_URL = process.env.PETPOOJA_CREATE_URL || "https://pponlineordercb.petpooja.com/save_order";
const PP_CANCEL_URL = process.env.PETPOOJA_CANCEL_URL || "https://pponlineordercb.petpooja.com/update_order_status";
const PP_CALLBACK_URL = process.env.PETPOOJA_CALLBACK_URL || "https://api.gutmantra.in/api/webhook";

console.log("🔥 USING REST ID:", PP_REST_ID);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanData(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value === undefined) return null;
      if (value === "None") return null;
      return value;
    })
  );
}

async function updateWcOrderStatus(orderId: string, status: string) {
  try {
    const res = await fetch(`${WC_BASE_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${WC_AUTH}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    console.log(`✅ WooCommerce order ${orderId} updated to '${status}':`, data);
  } catch (err) {
    console.error(`❌ Error updating WooCommerce order ${orderId}:`, err);
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(

  cors({

    origin: [

      "http://localhost:5173",

      "https://ddtech-gutmantra-webb.vercel.app",

      "https://gutmantra.in",

      "https://www.gutmantra.in",

    ],

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

  })

);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  console.log("🔥 Initializing Firebase...");
  initializeFirebaseAdmin();
  const db = getFirestoreDb();

  // ── Health ──────────────────────────────────────────────────────────────────

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", couponRoutes);
  app.use("/api", deliveryRoutes);
  app.use("/api", paymentRoutes);

  // ── Cancel Order ────────────────────────────────────────────────────────────

  app.post("/api/cancel-order", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const orderId = body.orderID;

      if (!orderId) {
        return res.status(400).json({ error: "orderID required" });
      }

      const payload = {
        app_key: PP_APP_KEY,
        app_secret: PP_APP_SECRET,
        access_token: PP_ACCESS_TOKEN,
        restID: PP_REST_ID,
        clientorderID: orderId,
        status: "-1",
        cancelReason: body.reason || "User cancelled",
      };

      const ppRes = await fetch(PP_CANCEL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ppData = await ppRes.json();
      console.log("🚫 CANCEL RESPONSE:", ppData);

      await db.collection("orders").doc(orderId).set(
        {
          status: "-1",
          statusLabel: "Cancelled",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`✅ Firebase order cancelled: ${orderId}`);

      return res.json({ success: true, response: ppData });
    } catch (err) {
      console.error("❌ cancel-order error:", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // ── Webhook (Petpooja → Firebase + WooCommerce) ─────────────────────────────

  app.post("/api/webhook", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      console.log("🔔 WEBHOOK:", data);

      if (!data) {
        return res.status(400).json({ success: false, message: "No data received" });
      }

      const orderId = String(data.orderID || "");
      const status = String(data.status || "");
      const label = STATUS_LABELS[status] || status;

      if (Array.isArray(data.items) && data.items.length > 0) {
        await syncMenuToFirestore(db, data);
        console.log("✅ Menu synced");
      }

      if (data.orders) {
        await syncOrdersToFirestore(db, data);
        console.log("✅ Orders synced");
      }

      if (orderId && status) {
        if (SKIP_STATUSES.includes(status)) {
          console.log(`⏭️ Skipping WooCommerce update for order ${orderId} (status ${status})`);
        } else {
          const wcStatus = WC_STATUS_MAPPING[status];
          if (wcStatus) {
            await updateWcOrderStatus(orderId, wcStatus);
          } else {
            console.log(`⚠️ No WooCommerce mapping for status '${status}'`);
          }
        }
      }

      if (orderId) {
        const userId = orderId.includes("_") ? orderId.split("_")[0] : "guest";

        await db.collection("orders").doc(orderId).set(
          {
            orderID: orderId,
            userId,
            status,
            statusLabel: label,
            items: data.OrderItem || [],
            total: data.order_total || 0,
            updatedAt: FieldValue.serverTimestamp(),
            source: "petpooja",
          },
          { merge: true }
        );

        console.log(`✅ Firebase updated for order ${orderId} → ${label}`);
      }

      return res.json({
        success: true,
        message: "Webhook received and processed successfully",
        receivedData: data,
      });
    } catch (err) {
      console.error("❌ Webhook error:", err);
      return res.status(500).json({ success: false, message: String(err) });
    }
  });

  // ── Manual menu sync ────────────────────────────────────────────────────────

  app.post("/sync-menu", async (_req: Request, res: Response) => {
    try {
      console.log("🟦 MANUAL SYNC TRIGGERED");

      const response = await fetch("https://api.petpooja.com/v1/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: process.env.PETPOOJA_APP_KEY,
          app_secret: process.env.PETPOOJA_APP_SECRET,
          access_token: process.env.PETPOOJA_ACCESS_TOKEN,
        }),
      });

      const data = await response.json();

      if (!data || !data.items) {
        throw new Error("Invalid PetPooja response");
      }

      const result = await syncMenuToFirestore(db, data);

      return res.json({ success: true, message: "Manual sync completed", ...result });
    } catch (err) {
      console.error("❌ SYNC ERROR:", err);
      return res.status(500).json({ success: false, message: "Sync failed" });
    }
  });

  // ── Manual order sync ───────────────────────────────────────────────────────

  app.post("/sync-orders", async (_req: Request, res: Response) => {
    try {
      console.log("🟦 MANUAL ORDER SYNC TRIGGERED");

      const response = await fetch("https://api.petpooja.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: process.env.PETPOOJA_APP_KEY,
          app_secret: process.env.PETPOOJA_APP_SECRET,
          access_token: process.env.PETPOOJA_ACCESS_TOKEN,
        }),
      });

      const data = await response.json();

      if (!data || !data.orders) {
        throw new Error("Invalid order response from PetPooja");
      }

      const result = await syncOrdersToFirestore(db, data);

      return res.json({ success: true, message: "Orders synced successfully 🚀", ...result });
    } catch (err) {
      console.error("❌ ORDER SYNC ERROR:", err);
      return res.status(500).json({ success: false, message: "Order sync failed" });
    }
  });

  // ── Webhook data ────────────────────────────────────────────────────────────

  app.get("/api/webhook-data", async (_req: Request, res: Response) => {
    try {
      const snapshot = await db.collection("orders").get();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error("❌ webhook-data error:", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  // ── BillDesk ────────────────────────────────────────────────────────────────────
  app.use("/api", paymentRoutes);
  app.use("/api", orderStatusRoutes);

  // ── Root ────────────────────────────────────────────────────────────────────

  app.get("/", (_req: Request, res: Response) => {
    res.send("🚀 Backend running");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);