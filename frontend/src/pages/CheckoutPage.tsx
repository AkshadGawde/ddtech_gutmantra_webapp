import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  Truck,
  MapPin,
  Tag,
  Loader2,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCoupon } from "../hooks/useCoupon";
import { db } from "../lib/firebase";
import { formatAddress } from "../utils/userHelpers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeliveryResult {
  success: boolean;
  distanceKm: number;
  deliveryCharge: number;
  isDeliverable: boolean;
  message: string;
  // Coordinates carried alongside the result to avoid async React state reads
  latitude?: number;
  longitude?: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  companyName?: string;
  country: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface CheckoutPageProps {
  onBack?: () => void;
  onNext?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "https://api.gutmantra.in/api";

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutPage({ onBack, onNext }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user, userData, refreshUserData } = useAuth();

  const [addressHydrated, setAddressHydrated] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [saveAddressLoading, setSaveAddressLoading] = useState(false);

  const {
    couponCode,
    setCouponCode,
    discount,
    finalAmount,
    couponApplied,
    loading: couponLoading,
    message: couponMessage,
    applyCoupon,
    clearCoupon,
  } = useCoupon({ subtotal: totalAmount, userId: user?.uid });

  // ─── State ─────────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"COD" | "ONLINE">("COD");
  const [deliveryResult, setDeliveryResult] = useState<DeliveryResult | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    companyName: "",
    country: "India",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    email: "",
    fullAddress: "",
    latitude: 0,
    longitude: 0,
  });

  // ─── Derived totals (declared at component scope, above all handlers) ──────

  const deliveryCharge = deliveryResult?.deliveryCharge ?? 0;
  const subtotal = totalAmount;
  const totalWithDelivery = subtotal - discount + deliveryCharge;

  // ─── Pre-fill from Firebase auth ───────────────────────────────────────────

  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        phone: user.phoneNumber || prev.phone,
        email: user.email || prev.email,
        firstName: user.displayName?.split(" ")[0] || prev.firstName,
        lastName: user.displayName?.split(" ").slice(1).join(" ") || prev.lastName,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user || addressHydrated || !userData?.address) {
      return;
    }

    const address = userData.address;
    const hasAddress = Boolean(
      address.streetAddress ||
        address.city ||
        address.state ||
        address.pinCode ||
        address.fullAddress ||
        address.firstName ||
        address.lastName
    );

    if (!hasAddress) {
      return;
    }

    setShippingAddress((prev) => ({
      ...prev,
      firstName: prev.firstName || address.firstName || "",
      lastName: prev.lastName || address.lastName || "",
      streetAddress: prev.streetAddress || address.streetAddress || "",
      apartment: prev.apartment || address.apartment || "",
      city: prev.city || address.city || "",
      state: prev.state || address.state || "",
      pinCode: prev.pinCode || address.pinCode || "",
      country: prev.country || address.country || "India",
      fullAddress: prev.fullAddress || address.fullAddress || "",
    }));

    setAddressHydrated(true);
    setAddressVerified(false);
  }, [user, userData, addressHydrated]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const buildFullAddress = (addr: ShippingAddress): string =>
    [
      addr.streetAddress,
      addr.apartment,
      addr.city,
      addr.state,
      addr.pinCode,
      addr.country,
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

  const hasRequiredAddressFields = (): boolean =>
    Boolean(
      shippingAddress.streetAddress &&
        shippingAddress.city &&
        shippingAddress.state &&
        shippingAddress.pinCode
    );

  // ─── GPS location ──────────────────────────────────────────────────────────

  /**
   * Uses the browser's Geolocation API to get the user's precise coordinates
   * then hits /calculate-delivery directly — no geocoding ambiguity.
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support GPS location.");
      return;
    }

    setGpsLoading(true);
    setDeliveryResult(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await validateDeliveryCoords(latitude, longitude);
          setDeliveryResult(result);
          // Note: result.latitude / result.longitude are already set inside
          // validateDeliveryCoords — no need to duplicate them here.
          if (result.isDeliverable) {
            setShippingAddress((prev) => ({
              ...prev,
              latitude,
              longitude,
            }));
          }
        } catch (err) {
          console.error("❌ GPS delivery check failed:", err);
          setDeliveryResult({
            success: false,
            distanceKm: 0,
            deliveryCharge: 0,
            isDeliverable: false,
            message: "Could not validate your location. Please enter address manually.",
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.error("❌ Geolocation error:", err);
        setGpsLoading(false);
        alert(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Please enable it in browser settings."
            : "Could not get your location. Please enter address manually."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ─── Delivery validation (coords path) ────────────────────────────────────

  const validateDeliveryCoords = async (
    latitude: number,
    longitude: number
  ): Promise<DeliveryResult> => {
    const response = await fetch(`${API_BASE}/calculate-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    const data = await response.json();

    return {
      success: data.success ?? false,
      distanceKm: data.distanceKm ?? 0,
      deliveryCharge: data.deliveryCharge ?? 0,
      isDeliverable: data.isDeliverable ?? false,
      message: data.message ?? "Delivery validation failed",
      latitude,
      longitude,
    };
  };

  // ─── Address geocode + delivery check (text path) ─────────────────────────

  /**
   * Called on PIN code blur or "Verify Address" button click.
   * Geocodes the typed address, then validates the resulting coordinates
   * against the delivery radius.
   *
   * Returns the validated DeliveryResult (or null on failure) so the
   * caller can use it directly without another state read.
   */
  const geocodeAndValidate = async (): Promise<DeliveryResult | null> => {
    if (!hasRequiredAddressFields()) return null;

    const fullAddress = buildFullAddress(shippingAddress);
    console.log("📍 Geocoding:", fullAddress);

    setDeliveryLoading(true);
    setDeliveryResult(null);

    try {
      const response = await fetch(`${API_BASE}/geocode-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streetAddress: shippingAddress.streetAddress,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pinCode: shippingAddress.pinCode,
          country: shippingAddress.country,
        }),
      });

      const data = await response.json();
      console.log("✅ Geocode response:", data);

      if (!data.success || !data.latitude || !data.longitude) {
        const result: DeliveryResult = {
          success: false,
          distanceKm: 0,
          deliveryCharge: 0,
          isDeliverable: false,
          message: data.message || "Could not resolve address. Please check and retry.",
        };
        setDeliveryResult(result);
        return result;
      }

      // Persist resolved coords into address state for display purposes only.
      // handleCheckout reads coords from validated.latitude/longitude, NOT from here.
      setShippingAddress((prev) => ({
        ...prev,
        latitude: data.latitude,
        longitude: data.longitude,
        fullAddress: data.formattedAddress || buildFullAddress(prev),
      }));

      const result: DeliveryResult = {
        success: data.success,
        distanceKm: data.distanceKm,
        deliveryCharge: data.deliveryCharge,
        isDeliverable: data.isDeliverable,
        message: data.message,
        // Carry coords directly in the result object — eliminates the async state race
        latitude: data.latitude,
        longitude: data.longitude,
      };

      setDeliveryResult(result);
      setAddressVerified(result.isDeliverable);
      return result;
    } catch (error) {
      console.error("❌ Geocode error:", error);
      const result: DeliveryResult = {
        success: false,
        distanceKm: 0,
        deliveryCharge: 0,
        isDeliverable: false,
        message: "Failed to validate address. Check your connection and retry.",
      };
      setDeliveryResult(result);
      setAddressVerified(false);
      return result;
    } finally {
      setDeliveryLoading(false);
    }
  };

  // ─── Save address ──────────────────────────────────────────────────────────

  const handleSaveAddress = async () => {
    if (!user?.uid || !addressVerified) return;

    setSaveAddressLoading(true);
    try {
      const firstName = shippingAddress.firstName.trim().split(" ")[0] || "";
      const lastName =
        shippingAddress.lastName.trim().split(" ").slice(1).join(" ") || "";
      const addressPayload = {
        firstName,
        lastName,
        streetAddress: shippingAddress.streetAddress,
        apartment: shippingAddress.apartment,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pinCode: shippingAddress.pinCode,
        country: shippingAddress.country,
        fullAddress:
          shippingAddress.fullAddress || formatAddress(shippingAddress),
      };

      await updateDoc(doc(db, "users", user.uid), {
        phone: shippingAddress.phone,
        updatedAt: new Date(),
        address: addressPayload,
      });

      await refreshUserData();
      alert("Verified address saved to your profile.");
    } catch (error) {
      console.error("❌ Save address failed:", error);
      alert("Could not save address. Please try again.");
    } finally {
      setSaveAddressLoading(false);
    }
  };

  // ─── Checkout ──────────────────────────────────────────────────────────────

  /**
   * Flow:
   * 1. Validate form fields
   * 2. If no delivery result yet, geocode now and wait for it
   * 3. Check deliverability
   * 4. Call create-order (stores order as payment_pending)
   * 5a. ONLINE: call create-online-order → build hidden form → submit to BillDesk
   *     (do NOT clearCart or navigate — wait for payment callback)
   * 5b. COD: clearCart() → navigate("/success")
   */
  const handleCheckout = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.streetAddress ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pinCode ||
      !shippingAddress.phone ||
      !shippingAddress.email
    ) {
      alert("Please fill all required fields");
      return;
    }

    // ── Step 1: ensure we have a delivery result ──
    let validated = deliveryResult;

    if (!validated) {
      validated = await geocodeAndValidate();
    }

    if (!validated) {
      alert("Could not validate your address. Please check and retry.");
      return;
    }

    // ── Step 2: check deliverability ──
    if (!validated.isDeliverable) {
      alert(validated.message || "Delivery not available for this address.");
      return;
    }

    // ── Step 3: place order ──
    try {
      setLoading(true);

      const formattedItems = items.map((item: any) => {
        const variantSuffix =
          item.variant && !item.name.includes(item.variant) ? ` (${item.variant})` : "";
        return {
          base_id: item.base_id || item.sku || (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : ""),
          variation_id: item.variation_id || (item.petpoojaId ? String(item.petpoojaId).replace(/^V/, "") : ""),
          name: `${item.name}${variantSuffix}`,
          price: String(item.price),
          quantity: String(item.quantity),
        };
      });

      const nullBaseIds = formattedItems.filter((item: any) => !item.base_id);
      if (nullBaseIds.length > 0) {
        throw new Error(`Items missing SKU: ${nullBaseIds.map((i: any) => i.name).join(", ")}`);
      }

      const fullAddress = buildFullAddress(shippingAddress);
      if (!fullAddress) { alert("Address missing"); return; }

      console.log("💳 PAYMENT MODE:", paymentMode);

      // ── ONLINE PAYMENT FLOW (BillDesk) ──────────────────────────────────
      if (paymentMode === "ONLINE") {
        const onlinePayload = {
          userid: user.uid,
          items: formattedItems,
          paymentmethod: "card",
          payment_type: "ONLINE",
          shippingAddress: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            phone: shippingAddress.phone,
            email: shippingAddress.email,
            streetAddress: shippingAddress.streetAddress,
            apartment: shippingAddress.apartment,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pinCode: shippingAddress.pinCode,
            country: shippingAddress.country,
            fullAddress,
            latitude: validated!.latitude || shippingAddress.latitude,
            longitude: validated!.longitude || shippingAddress.longitude,
          },
          buyerEmail: shippingAddress.email,
          buyerPhone: shippingAddress.phone,
          deliveryCharge,
          discount,
        };

        console.log("📦 Online payload:", JSON.stringify(onlinePayload, null, 2));

        const response = await fetch(`${API_BASE}/orders/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(onlinePayload),
        });

        const data = await response.json();
        console.log("📡 BillDesk create-order response:", data);

        if (!data.success) throw new Error(data.error || "Failed to create order");

        const { orderid, mercid, bdorderid, payment_link, rdata, authorization } = data;

        if (!payment_link || !bdorderid || !rdata) {
          throw new Error("Incomplete payment data returned from server");
        }

        console.log("✅ BillDesk order created:", { orderid, bdorderid, payment_link });
        console.log("   mercid:", mercid, " authorization:", authorization ? authorization.slice(0, 30) + "…" : "none");

        const paymentWindow = window.open("", "BillDeskPayment", "width=950,height=700,scrollbars=yes");
        if (!paymentWindow) {
          alert("Popup blocked. Please allow popups for this site and try again.");
          return;
        }

        // BillDesk embeddedsdk requires a form POST with exact field names
        // from the response parameters object: mercid, bdorderid, rdata
        // Plus the authorization token from the response headers object.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payment_link;
        form.target = "BillDeskPayment";

        const formFields: Record<string, string> = {
          mercid:        mercid,
          bdorderid:     bdorderid,
          rdata:         rdata,
          ...(authorization ? { authorization } : {}),
        };
        Object.entries(formFields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type  = "hidden";
          input.name  = name;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Poll for payment status every 3 seconds (fallback if webhook fires first)
        let pollCount = 0;
        const maxPolls = 100; // 5 minutes

        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await fetch(`${API_BASE}/orders/status/${orderid}`);
            const statusData = await statusRes.json();
            const paymentStatus = statusData.order?.payment_status;

            console.log(`[Poll ${pollCount}/${maxPolls}] status: ${paymentStatus}, petpooja_synced: ${statusData.order?.petpooja_synced}`);

            if (paymentStatus === "0300") {
              clearInterval(pollInterval);
              paymentWindow?.close();

              // Trigger PetPooja sync as fallback (webhook may have already done it)
              if (!statusData.order?.petpooja_synced) {
                try {
                  await fetch(`${API_BASE}/orders/sync-to-petpooja/${orderid}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  console.log("✅ PetPooja sync triggered from frontend");
                } catch (syncErr) {
                  console.warn("PetPooja sync fallback error:", syncErr);
                }
              }

              clearCart();
              navigate(`/success?orderId=${orderid}`);
              return;
            }

            if (paymentStatus === "0399" || paymentStatus === "0001") {
              clearInterval(pollInterval);
              paymentWindow?.close();
              alert("Payment failed or was cancelled. Please try again.");
              return;
            }

            if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              alert("Payment is taking longer than expected. We'll notify you by email once confirmed.");
              navigate("/");
            }
          } catch (pollErr) {
            console.warn("Poll error:", pollErr);
          }
        }, 3000);

        return;
      }

      // ── COD FLOW (existing endpoint) ─────────────────────────────────────
      const orderID = `${user.uid}_${Date.now()}`;
      const codPayload = {
        orderID,
        paymentMode,
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          streetAddress: shippingAddress.streetAddress,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pinCode: shippingAddress.pinCode,
          country: shippingAddress.country,
          fullAddress,
          latitude: validated!.latitude || shippingAddress.latitude,
          longitude: validated!.longitude || shippingAddress.longitude,
        },
        items: formattedItems,
        couponCode: couponApplied ? couponCode : undefined,
      };

      console.log("📦 COD payload:", JSON.stringify(codPayload, null, 2));

      const codResponse = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codPayload),
      });

      const codData = await codResponse.json();
      console.log("📡 COD response:", codData);

      if (!codData.success) throw new Error(codData.message || "Order failed");

      clearCart();
      onNext ? onNext() : navigate("/success");
    } catch (error: any) {
      console.error("❌ Checkout error:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Empty cart ────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-black text-white px-8 py-3 rounded-full"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => (onBack ? onBack() : navigate("/"))}
            className="flex items-center gap-2 text-gray-600 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Cart
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* ── LEFT — Billing + Delivery ── */}
          <div className="lg:col-span-7 space-y-8">
            {/* Billing details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <User size={24} />
                Billing Details
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={shippingAddress.firstName}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }));
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={shippingAddress.lastName}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }));
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Street Address *"
                  value={shippingAddress.streetAddress}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, streetAddress: e.target.value }));
                    setDeliveryResult(null);
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Apartment / Landmark"
                  value={shippingAddress.apartment}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, apartment: e.target.value }));
                    setDeliveryResult(null);
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <input
                  type="text"
                  placeholder="City *"
                  value={shippingAddress.city}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, city: e.target.value }));
                    setDeliveryResult(null);
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={shippingAddress.state}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, state: e.target.value }));
                    setDeliveryResult(null);
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="PIN Code *"
                  value={shippingAddress.pinCode}
                  onChange={(e) => {
                    setShippingAddress((prev) => ({ ...prev, pinCode: e.target.value }));
                    setDeliveryResult(null);
                    setAddressVerified(false);
                  }}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <input
                  type="text"
                  placeholder="Phone *"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-3 border rounded-xl"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={shippingAddress.email}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>

              {/* Verify Address button */}
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => geocodeAndValidate()}
                  disabled={deliveryLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deliveryLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                  {deliveryLoading ? "Validating..." : "Verify Address"}
                </button>

                {addressVerified && (
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={saveAddressLoading}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveAddressLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Save Verified Address"
                    )}
                  </button>
                )}

                <p className="text-xs text-gray-500">
                  Click to validate your address and check delivery availability.
                  {addressVerified && " Your verified address can be saved to your profile."}
                </p>
              </div>

              {/* GPS button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-black rounded-xl font-medium text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gpsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                  {gpsLoading ? "Fetching location..." : "Use Current Location"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  For accurate delivery — uses your GPS coordinates directly.
                </p>
              </div>
            </div>

            {/* Delivery status panel */}
            {(deliveryLoading || deliveryResult) && (
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  deliveryLoading
                    ? "bg-gray-50 border-gray-200"
                    : deliveryResult?.isDeliverable
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {deliveryLoading ? (
                    <Loader2 size={24} className="text-gray-500 animate-spin" />
                  ) : (
                    <Truck
                      size={24}
                      className={
                        deliveryResult?.isDeliverable ? "text-green-600" : "text-red-600"
                      }
                    />
                  )}
                  <h3 className="font-semibold">Delivery Information</h3>
                </div>

                {deliveryLoading ? (
                  <p className="text-gray-600">Checking delivery availability...</p>
                ) : deliveryResult ? (
                  <div className="space-y-2 text-sm">
                    {deliveryResult.distanceKm > 0 && (
                      <p>Distance: {deliveryResult.distanceKm.toFixed(2)} km</p>
                    )}
                    {deliveryResult.isDeliverable && (
                      <p>
                        Delivery charge:{" "}
                        {deliveryResult.deliveryCharge === 0
                          ? "Free"
                          : `₹${deliveryResult.deliveryCharge}`}
                      </p>
                    )}
                    <p
                      className={
                        deliveryResult.isDeliverable ? "text-green-700" : "text-red-700"
                      }
                    >
                      {deliveryResult.message}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ── RIGHT — Order summary + coupon + checkout ── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item, index) => {
                  const variantLabel =
                    item.variant && !item.name.includes(item.variant)
                      ? item.variant
                      : null;
                  return (
                    <div key={index} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {variantLabel && (
                          <p className="text-xs text-gray-500">{variantLabel}</p>
                        )}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              {/* ── Coupon section ── */}
              <div className="border rounded-xl p-4 mb-6 bg-gray-50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Tag size={16} />
                  Coupon Code
                </h3>

                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-semibold text-green-800 text-sm">{couponCode}</p>
                      <p className="text-xs text-green-600">
                        Saving ₹{discount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={clearCoupon}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                    >
                      {couponLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}

                {/* GMFIRST first-order hint */}
                {couponCode.replace(/\s/g, "").toUpperCase() === "GMFIRST" && !couponApplied && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    ℹ️ GMFIRST is only valid for your first order.
                  </p>
                )}

                {/* Coupon feedback message */}
                {couponMessage && !couponApplied && (
                  <p className="text-xs text-red-600 mt-2">{couponMessage}</p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({couponCode})</span>
                    <span>−₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-blue-600">
                  <span>Delivery</span>
                  <span>
                    {deliveryResult?.isDeliverable
                      ? deliveryCharge === 0
                        ? "Free"
                        : `₹${deliveryCharge.toFixed(2)}`
                      : "—"}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>₹{totalWithDelivery.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment mode */}
              <div className="mt-6 space-y-2">
                <p className="font-medium text-sm">Payment Mode</p>
                <div className="flex gap-3">
                  {(["COD", "ONLINE"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                        paymentMode === mode
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {mode === "COD" ? "Cash on Delivery" : "Online Payment"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={loading || deliveryLoading}
                className="w-full mt-8 bg-black text-white py-4 rounded-2xl font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                {loading
                  ? "Placing Order..."
                  : deliveryLoading
                  ? "Validating Address..."
                  : "Place Order"}
              </button>

              {/* Delivery warning — shown as text, NOT as a disabled button */}
              {!deliveryLoading && deliveryResult && !deliveryResult.isDeliverable && (
                <p className="text-red-600 text-sm mt-4 text-center">
                  {deliveryResult.message}
                </p>
              )}

              {!deliveryLoading && !deliveryResult && (
                <p className="text-gray-400 text-xs mt-4 text-center">
                  Enter your PIN code or use GPS to check delivery availability
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}