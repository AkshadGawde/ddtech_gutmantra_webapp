import { useState } from "react";
import { calculateDelivery, type DeliveryResponse } from "@/services/deliveryService";

export function useDelivery() {
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string>(
    "Enter your address to check delivery eligibility"
  );

  const calculateDeliveryAsync = async (lat: number, lng: number) => {
    setDeliveryLoading(true);
    try {
      const response: DeliveryResponse = await calculateDelivery(lat, lng);
      setDeliveryDistance(response.distanceKm);
      setDeliveryCharge(response.deliveryCharge);
      setDeliveryAvailable(response.isDeliverable);
      setDeliveryMessage(response.message);
    } catch (error) {
      setDeliveryAvailable(false);
      setDeliveryMessage("Failed to calculate delivery. Please try again.");
      console.error("Delivery calculation error:", error);
    } finally {
      setDeliveryLoading(false);
    }
  };

  return {
    deliveryDistance,
    deliveryCharge,
    deliveryAvailable,
    deliveryLoading,
    deliveryMessage,
    calculateDelivery: calculateDeliveryAsync,
  };
}
