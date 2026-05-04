import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { initializeFirebaseAdmin, getFirestoreDb } from "./src/services/firebaseAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";
import { syncMenuToFirestore } from "./src/services/menuSync.js";
import { syncOrdersToFirestore } from "./src/services/orderSync.js";

dotenv.config();

const __dirname = process.cwd();

// ---------- HELPERS ----------
function cleanData(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value === undefined) return null;
      if (value === "None") return null;
      return value;
    })
  );
}

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// ---------- SERVER ----------
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  console.log("🔥 Initializing Firebase...");
  initializeFirebaseAdmin();
  const db = getFirestoreDb();

  // ---------- HEALTH ----------
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);

  // ================= WEBHOOK =================
 app.post("/webhook", async (req, res) => {

  try {

    const payload = req.body;

    console.log("🔥 WEBHOOK RECEIVED");

    if (Array.isArray(payload.items) && payload.items.length > 0) {

      await syncMenuToFirestore(db, payload);

      console.log("✅ Menu synced");

    }

    if (payload.orders) {

      await syncOrdersToFirestore(db, payload);

      console.log("✅ Orders synced");

    }

    return res.json({ success: true });

  } catch (err) {

    console.error("❌ Webhook error:", err);

    return res.status(500).json({ error: "Webhook failed" });

  }

});
app.post("/sync-menu", async (req, res) => {
  try {
    console.log("🟦 MANUAL SYNC TRIGGERED");

    // 👉 Call PetPooja API (you need credentials)
    const response = await fetch("https://api.petpooja.com/v1/menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    return res.json({
      success: true,
      message: "Manual sync completed",
      ...result,
    });

  } catch (err) {
    console.error("❌ SYNC ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Sync failed",
    });
  }
});

app.post("/sync-orders", async (req, res) => {

  try {

    console.log("🟦 MANUAL ORDER SYNC TRIGGERED");

    const response = await fetch("https://api.petpooja.com/v1/orders", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

      },

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

    return res.json({

      success: true,

      message: "Orders synced successfully 🚀",

      ...result,

    });

  } catch (err) {

    console.error("❌ ORDER SYNC ERROR:", err);

    return res.status(500).json({

      success: false,

      message: "Order sync failed",

    });

  }

});

app.get("/", (req, res) => {
  res.send("🚀 Backend running");
});

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);