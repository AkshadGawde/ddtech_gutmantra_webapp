export interface DeliveryRequest {
  latitude: number;
  longitude: number;
}

export interface DeliveryResponse {
  success: boolean;
  distanceKm: number;
  deliveryCharge: number;
  isDeliverable: boolean;
  message: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://api.gutmantra.in/api";

export async function calculateDelivery(
  latitude: number,
  longitude: number
): Promise<DeliveryResponse> {
  const response = await fetch(`${API_BASE}/calculate-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ latitude, longitude } as DeliveryRequest),
  });

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || text || "Delivery validation failed";
    throw new Error(message);
  }

  return data as DeliveryResponse;
}
