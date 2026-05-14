import express, { Request, Response } from "express";
import { getDeliveryResult, geocodeAddress } from "../services/deliveryService.js";

const router = express.Router();

router.post("/calculate-delivery", async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const result = getDeliveryResult(latitude, longitude);

    if (!result.isDeliverable) {
      return res.status(400).json({
        success: false,
        ...result,
      });
    }

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Delivery calculation failed",
      distanceKm: 0,
      deliveryCharge: 0,
      isDeliverable: false,
    });
  }
});

router.post("/geocode-address", async (req: Request, res: Response) => {
  try {
    const { streetAddress, apartment, city, state, pinCode, country } = req.body;
    if (!streetAddress || !city || !state || !pinCode) {
      return res.status(400).json({
        success: false,
        message: "Street address, city, state, and PIN code are required",
        latitude: 0,
        longitude: 0,
        formattedAddress: "",
        distanceKm: 0,
        deliveryCharge: 0,
        isDeliverable: false,
      });
    }

    const address = [streetAddress, apartment, city, state, pinCode, country || "India"]
      .filter(Boolean)
      .join(", ");

    const result = await geocodeAddress(streetAddress, apartment, city, state, pinCode, country);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Geocoding failed",
      latitude: 0,
      longitude: 0,
      formattedAddress: req.body.streetAddress ? [req.body.streetAddress, req.body.apartment, req.body.city, req.body.state, req.body.pinCode, req.body.country || "India"].filter(Boolean).join(", ") : "",
      distanceKm: 0,
      deliveryCharge: 0,
      isDeliverable: false,
    });
  }
});

export default router;
