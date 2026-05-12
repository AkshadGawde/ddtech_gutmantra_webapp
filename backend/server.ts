import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebaseAdmin, getFirestoreDb } from "./src/services/firebaseAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";
import { syncMenuToFirestore } from "./src/services/menuSync.js";
import { syncOrdersToFirestore } from "./src/services/orderSync.js";
import { FieldValue } from "firebase-admin/firestore";

dotenv.config();

// ================= WOOCOMMERCE CONFIG =================

const WC_BASE_URL = "https://gutmantra.in";
const WC_CONSUMER_KEY = "ck_4dfb44306941ede97fb309dc441abfa42c3fdc87";
const WC_CONSUMER_SECRET = "cs_d2808f39b2879c7a4a18d30db43c77dd036a61e7";
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

// ================= PETPOOJA CONFIG =================

const PP_APP_KEY = "73nywgsd0ab6hu4qz51ro2kfemt8xcpv";
const PP_APP_SECRET = "aaef5fe113c373a0a7ac4e8a6413c5b1c46c3a8b";
const PP_ACCESS_TOKEN = "23a33ca178836da5b3144ab299ef1bc2633e21f6";
const PP_REST_ID = "107556";
const PP_CREATE_URL = "https://pponlineordercb.petpooja.com/save_order";
const PP_CANCEL_URL = "https://pponlineordercb.petpooja.com/update_order_status";
const PP_CALLBACK_URL = "https://api.gutmantra.in/api/webhook";

// ================= HELPERS =================

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

// ================= SERVER =================

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  console.log("🔥 Initializing Firebase...");
  initializeFirebaseAdmin();
  const db = getFirestoreDb();

  // ================= HEALTH =================

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);

  // ================= CREATE ORDER (Petpooja) =================

  app.post("/api/create-order", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const required = ["orderID", "name", "phone", "items"];

    for (const f of required) {
      if (!body[f]) {
        return res.status(400).json({
          error: `${f} missing`,
        });
      }
    }

    const orderId = String(body.orderID);

    const items: any[] = [];

    for (const item of body.items) {
      const baseId = item.base_id || item.sku;
      const variationId = item.variation_id || item.petpoojaId;

      if (!baseId) {
        return res.status(400).json({
          error: `Missing base_id/sku for item '${item.name}'`,
        });
      }

      items.push({
        id: String(baseId),
        variation_id: variationId
          ? String(variationId).replace("V", "")
          : "",

        name: item.name,
        price: String(item.price),
        quantity: String(item.quantity),

        tax_inclusive: true,
      });
    }

    if (!items.length) {
      return res.status(400).json({
        error: "No valid items",
      });
    }

    console.log(
      "🔥 FINAL ITEMS →",
      JSON.stringify(items, null, 2)
    );

    const total = items.reduce(
      (sum, i) =>
        sum +
        parseFloat(i.price) *
          parseInt(i.quantity),
      0
    );

    const payload = {
  app_key: PP_APP_KEY,
  app_secret: PP_APP_SECRET,
  access_token: PP_ACCESS_TOKEN,

  orderinfo: {
    OrderInfo: {
      Restaurant: {
        details: {
          restID: PP_REST_ID,
        },
      },

      Customer: {
        details: {
          name: body.name,
          phone: body.phone,
          email: body.email || "",
          address: body.address || "",
          latitude: "",
          longitude: "",
        },
      },

      Order: {
        details: {
          orderID: orderId,

          preorder_date: "",
          preorder_time: "",

          service_charge: "0",
          sc_tax_amount: "0",

          delivery_charges: "0",
          dc_tax_percentage: "0",
          dc_tax_amount: "0",

          packing_charges: "0",
          pc_tax_amount: "0",
          pc_tax_percentage: "0",

          // IMPORTANT
          order_type: "H",

          advanced_order: "N",

          payment_type:
            body.paymentMode || "COD",

          table_no: "",
          no_of_persons: "0",

          discount_total: "0",
          tax_total: "0",

          discount_type: "F",

          total: String(total),

          description:
            "ORDER FROM GUTMANTRA WEBSITE",

          created_on: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),

          enable_delivery: 1,

          min_prep_time: 60,

          callback_url:
            PP_CALLBACK_URL,
        },
      },

      OrderItem: {
        details: items.map((i) => ({
          // THIS IS CSV "id"
          id: i.id,

          name: i.name,

          tax_inclusive: true,

          item_discount: "0",

          price: i.price,

          final_price: i.price,

          quantity: i.quantity,

          description: "",

          // IMPORTANT
          variation_name: i.name,

          // THIS IS variationid
          variation_id:
            i.variation_id || "",

          AddonItem: {
            details: [],
          },
        })),
      },

      Tax: {
        details: [],
      },

      Discount: {
        details: [],
      },

      // IMPORTANT
      udid: " ",

      // IMPORTANT
      device_type: "web",
    },
  },
};

    console.log(
      "📦 PAYLOAD →",
      JSON.stringify(payload, null, 2)
    );

    const ppRes = await fetch(
      PP_CREATE_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      }
    );

    let ppData: any;

    try {
      ppData = await ppRes.json();
    } catch {
      ppData = {
        raw: await ppRes.text(),
      };
    }

    console.log("📡 STATUS:", ppRes.status);

    console.log("📡 RESPONSE:", ppData);

    if (
      ppRes.status !== 200 ||
      ppData?.success !== "1"
    ) {
      return res.status(400).json({
        success: false,
        petpooja_error: ppData,
      });
    }

    await db
      .collection("orders")
      .doc(orderId)
      .set(
        {
          orderID: orderId,

          petpoojaID:
            ppData?.clientorderID ||
            orderId,

          userId:
            orderId.split("_")[0],

          status: "pending",

          statusLabel:
            "Order Placed",

          items,

          total,

          name: body.name,

          phone: body.phone,

          email: body.email || "",

          address:
            body.address || "",

          paymentMode:
            body.paymentMode || "COD",

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),

          source: "petpooja",
        },
        { merge: true }
      );

    console.log(
      `✅ Firebase order saved: ${orderId}`
    );

    return res.json({
      success: true,
      petpooja: ppData,
    });
  } catch (err) {
    console.error(
      "❌ create-order error:",
      err
    );

    return res.status(500).json({
      error: String(err),
    });
  }
});

  // ================= CANCEL ORDER (Petpooja) =================

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

      // ✅ Update Firebase
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

  // ================= WEBHOOK (Petpooja → Firebase + WooCommerce) =================

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

      // --- Sync menu/orders if this is a menu push webhook ---
      if (Array.isArray(data.items) && data.items.length > 0) {
        await syncMenuToFirestore(db, data);
        console.log("✅ Menu synced");
      }

      if (data.orders) {
        await syncOrdersToFirestore(db, data);
        console.log("✅ Orders synced");
      }

      // --- Update WooCommerce ---
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

      // --- Update Firebase ---
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

  // ================= MANUAL MENU SYNC =================

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

  // ================= MANUAL ORDER SYNC =================

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

  // ================= GET WEBHOOK DATA =================

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

  // ================= ROOT =================

  app.get("/", (_req: Request, res: Response) => {
    res.send("🚀 Backend running");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);