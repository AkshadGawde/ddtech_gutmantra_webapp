import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
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
import billDeskOrderRoutes from "./src/routes/billdeskRoutes.js";
import billDeskWebhookRoutes from "./src/routes/billdesk-webhook.routes.js";
import otpRoutes from "./src/routes/otpRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import { initializeSmsClient } from "./src/services/smsService.js";
import { trackActivity } from "./src/middleware/activityTracker.js";

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
  "2": "Accepted by Kitchen",
  "3": "Accepted by Kitchen",
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

      "https://ddtechgutmantrawebapp-sage.vercel.app",

      "https://gutmantra.in",

      "https://www.gutmantra.in",

    ],

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "x-admin-password"],

  })

);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(trackActivity);

  console.log("🔥 Initializing Firebase...");
  initializeFirebaseAdmin();
  const db = getFirestoreDb();

  // ── Initialize SMS Client ────────────────────────────────────────────────────
  const zavuApiKey = process.env.ZAVUDEV_API_KEY;
  if (zavuApiKey) {
    try {
      await initializeSmsClient(zavuApiKey);
      console.log("📱 SMS service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize SMS service:", error);
      console.warn("⚠️ SMS OTP feature will not be available");
    }
  } else {
    console.warn("⚠️ ZAVUDEV_API_KEY not found in environment - SMS OTP disabled");
  }

  // ── Health ──────────────────────────────────────────────────────────────────

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/auth", otpRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", couponRoutes);
  app.use("/api", deliveryRoutes);
  app.use("/api", paymentRoutes);

  // ── Cancel Order ────────────────────────────────────────────────────────────

  app.post("/api/cancel-order", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const orderId = String(body.orderID || "").trim();
      const reason = String(body.reason || "Customer requested cancellation").trim();

      if (!orderId) {
        return res.status(400).json({ success: false, error: "orderID required" });
      }

      // Verify the order exists and is in a cancellable state
      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      const orderData = orderSnap.data()!;
      const currentStatus = String(orderData.status || "");

      // Only allow cancellation if not already delivered or cancelled
      if (currentStatus === "10") {
        return res.status(400).json({ success: false, error: "Cannot cancel a delivered order" });
      }
      if (currentStatus === "-1") {
        return res.status(400).json({ success: false, error: "Order is already cancelled" });
      }

      const payload = {
        app_key: PP_APP_KEY,
        app_secret: PP_APP_SECRET,
        access_token: PP_ACCESS_TOKEN,
        restID: PP_REST_ID,
        clientorderID: orderId,
        status: "-1",
        cancelReason: reason,
      };

      console.log("🚫 Cancelling order:", orderId, "reason:", reason);

      // Notify Petpooja POS — best-effort, never blocks the Firestore update
      let ppData: any = null;
      try {
        const ppRes = await fetch(PP_CANCEL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        ppData = await ppRes.json();
        console.log("🚫 Petpooja cancel response:", ppData);
      } catch (ppErr) {
        console.warn("⚠️ Petpooja cancel notify failed (non-fatal):", ppErr);
      }

      // Always update Firestore so the user sees the cancellation immediately
      await db.collection("orders").doc(orderId).update({
        status: "-1",
        statusLabel: "Cancelled",
        orderStatus: "CANCELLED",
        cancelledBy: "user",
        cancelReason: reason,
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Order ${orderId} cancelled by user`);

      return res.json({ success: true, petpoojaResponse: ppData });
    } catch (err) {
      console.error("❌ cancel-order error:", err);
      return res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ── Webhook (Petpooja → Firebase + WooCommerce) ─────────────────────────────

  app.post("/api/webhook", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      console.log("🔔 WEBHOOK payload:", JSON.stringify(data, null, 2));

      if (!data) {
        return res.status(400).json({ success: false, message: "No data received" });
      }

      // ── Menu push (Petpooja → Firestore) ──────────────────────────────────
      // Only treat as menu sync if payload has 'items' AND 'categories'
      // (order callbacks don't include categories)
      if (Array.isArray(data.items) && Array.isArray(data.categories)) {
        await syncMenuToFirestore(db, data);
        console.log("✅ Menu synced via webhook");
        return res.json({ success: true, message: "Menu synced" });
      }

      // ── Bulk order push ────────────────────────────────────────────────────
      if (data.orders) {
        await syncOrdersToFirestore(db, data);
        console.log("✅ Orders synced via webhook");
        return res.json({ success: true, message: "Orders synced" });
      }

      // ── Order status callback ──────────────────────────────────────────────
      // Per Petpooja docs: in the callback payload, 'orderID' is our client
      // order ID (despite the name). Try all known field variants.
      const clientOrderId = String(
        data.clientOrderID || data.clientorderID || data.client_order_id ||
        data.orderID || data.orderId || ""
      ).trim();
      const status = String(data.status || "").trim();
      const cancelReason = String(data.cancelReason || data.cancel_reason || "").trim();

      console.log(`🔔 Order callback → clientOrderId=${clientOrderId} status=${status}`);

      if (!status) {
        console.warn("⚠️ Webhook received with no status — ignoring");
        return res.json({ success: true, message: "No status to process" });
      }

      // Look up the Firestore order by document ID (our order ID)
      let firestoreOrderId: string | null = null;
      let orderData: any = null;

      if (clientOrderId) {
        const snap = await db.collection("orders").doc(clientOrderId).get();
        if (snap.exists) {
          firestoreOrderId = clientOrderId;
          orderData = snap.data();
        }
      }

      if (firestoreOrderId && orderData) {
        // Determine if this is a kitchen rejection vs a user-initiated cancel.
        // If the user already cancelled (cancelledBy: "user"), don't overwrite with
        // a Petpooja echo of the same -1.
        const alreadyCancelledByUser = orderData.cancelledBy === "user";
        if (status === "-1" && alreadyCancelledByUser) {
          console.log(`ℹ️ Order ${firestoreOrderId} was already cancelled by user — skipping Petpooja -1 echo`);
          return res.json({ success: true, message: "Already cancelled by user" });
        }

        const isKitchenRejection = status === "-1" && !alreadyCancelledByUser;
        const label = isKitchenRejection
          ? "Rejected by Kitchen"
          : (STATUS_LABELS[status] || status);

        // Update only status fields — never overwrite original cart items or totals
        const updatePayload: Record<string, any> = {
          status,
          statusLabel: label,
          orderStatus: status === "-1" ? "CANCELLED" : status === "10" ? "DELIVERED" : "ACTIVE",
          updatedAt: FieldValue.serverTimestamp(),
          lastWebhookAt: FieldValue.serverTimestamp(),
        };

        if (isKitchenRejection) {
          updatePayload.cancelledBy = "kitchen";
          if (cancelReason) updatePayload.rejectionReason = cancelReason;
        }

        await db.collection("orders").doc(firestoreOrderId).update(updatePayload);
        console.log(`✅ Order ${firestoreOrderId} updated → ${status} (${label})`);

        // Sync status to WooCommerce for completed/cancelled orders
        if (!SKIP_STATUSES.includes(status)) {
          const wcStatus = WC_STATUS_MAPPING[status];
          if (wcStatus) {
            await updateWcOrderStatus(firestoreOrderId, wcStatus);
          }
        }
      } else {
        console.warn(`⚠️ No Firestore order found for clientOrderId=${clientOrderId}`);
      }

      return res.json({ success: true, message: "Webhook processed" });
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

  // ── Order status poll (frontend fallback when webhook is not triggered) ─────
  // Petpooja's callback_url is only called for the initial save confirmation;
  // POS-side acceptance/rejection may not trigger a callback in all configurations.
  // This endpoint lets the frontend poll for the latest status.

  app.get("/api/orders/poll-status/:orderId", async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ success: false, error: "orderId required" });
      }

      // 1. Read current Firestore state
      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      const orderData = orderSnap.data()!;

      // Status is kept up-to-date by Petpooja's callback webhook.
      // Just return current Firestore state — no external Petpooja polling.
      const currentStatus = String(orderData.status || "");
      return res.json({
        success: true,
        status: currentStatus,
        statusLabel: orderData.statusLabel || STATUS_LABELS[currentStatus] || currentStatus,
        cancelledBy: orderData.cancelledBy || null,
        cancelReason: orderData.cancelReason || null,
        rejectionReason: orderData.rejectionReason || null,
        source: "firestore",
      });
    } catch (err) {
      console.error("❌ poll-status error:", err);
      return res.status(500).json({ success: false, error: String(err) });
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

  // ── BillDesk Payment Routes ─────────────────────────────────────────────────
  app.use("/api/orders", billDeskOrderRoutes);
  app.use("/api/billdesk", billDeskWebhookRoutes);

  // ── Order Status Routes ─────────────────────────────────────────────────────
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