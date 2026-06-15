export interface DeliveryResult {
  distanceKm: number;
  deliveryCharge: number;
  isDeliverable: boolean;
  message: string;
}

export interface GeocodeResult extends DeliveryResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const STORE_LATITUDE = 18.622908159747414;
const STORE_LONGITUDE = 73.91612726991299;
const EARTH_RADIUS_KM = 6371;

export function calculateDistanceKm(
  latitude: number,
  longitude: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(latitude - STORE_LATITUDE);
  const dLng = toRadians(longitude - STORE_LONGITUDE);
  const lat1 = toRadians(STORE_LATITUDE);
  const lat2 = toRadians(latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round((EARTH_RADIUS_KM * c) * 100) / 100;
}

export function calculateDeliveryCharge(distanceKm: number): number {
  if (distanceKm <= 5) return 0;
  if (distanceKm <= 10) return 30;
  if (distanceKm <= 15) return 40;
  return Number.POSITIVE_INFINITY;
}

export function getDeliveryResult(
  latitude: unknown,
  longitude: unknown
): DeliveryResult {
  const lat = typeof latitude === "number" ? latitude : parseFloat(String(latitude ?? ""));
  const lng = typeof longitude === "number" ? longitude : parseFloat(String(longitude ?? ""));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      distanceKm: 0,
      deliveryCharge: 0,
      isDeliverable: false,
      message: "Invalid delivery coordinates",
    };
  }

  const distanceKm = calculateDistanceKm(lat, lng);
  const deliveryCharge = calculateDeliveryCharge(distanceKm);
  const isDeliverable = distanceKm <= 15;

  return {
    distanceKm,
    deliveryCharge: isDeliverable ? deliveryCharge : 0,
    isDeliverable,
    message: isDeliverable
      ? `Delivery available at ${distanceKm.toFixed(2)} km`
      : `Sorry, we deliver only up to 15 km. Your location is ${distanceKm.toFixed(2)} km away.`,
  };
}

export async function geocodeAddress(streetAddress: string, apartment: string, city: string, state: string, pinCode: string, country: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  const address = [streetAddress, apartment, city, state, pinCode, country || "India"].filter(Boolean).join(", ");
  const encodedAddress = encodeURIComponent(address);
  const components = `country:${country || "IN"}|postal_code:${pinCode}|locality:${city}|administrative_area:${state}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&components=${encodeURIComponent(components)}&key=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const data = await response.json();

  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: address,
      distanceKm: 0,
      deliveryCharge: 0,
      isDeliverable: false,
      message: "Unable to geocode address. Please check the address and try again.",
    };
  }

  const result = data.results[0];
  const location = result.geometry.location;
  const lat = location.lat;
  const lng = location.lng;
  const formattedAddress = result.formatted_address;

  const distanceKm = calculateDistanceKm(lat, lng);
  const deliveryCharge = calculateDeliveryCharge(distanceKm);
  const isDeliverable = distanceKm <= 15;

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress,
    distanceKm,
    deliveryCharge: isDeliverable ? deliveryCharge : 0,
    isDeliverable,
    message: isDeliverable
      ? `Delivery available at ${distanceKm.toFixed(2)} km`
      : `Sorry, we deliver only up to 15 km. Your location is ${distanceKm.toFixed(2)} km away.`,
  };
}
