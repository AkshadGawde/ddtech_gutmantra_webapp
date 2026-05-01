import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PETPOOJA_URL =
  "https://qle1yy2ydc.execute-api.ap-southeast-1.amazonaws.com/V1/mapped_restaurant_menus";

app.post("/api/menu", async (req, res) => {
  try {
    const response = await fetch(PETPOOJA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restID: process.env.PETPOOJA_REST_ID,
        app_key: process.env.PETPOOJA_APP_KEY,
        app_secret: process.env.PETPOOJA_APP_SECRET,
        access_token: process.env.PETPOOJA_ACCESS_TOKEN,
      }),
    });

    const data = await response.json();

    console.log("🔥 RAW API:", data);

    if (data.success === "0") {
      return res.status(400).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

app.listen(5001, () => {
  console.log("🚀 Proxy running on http://localhost:5001");
});
