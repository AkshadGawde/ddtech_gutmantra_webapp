import { motion } from "motion/react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCoupon } from "@/hooks/useCoupon";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CheckoutPageProps {
  onBack?: () => void;
  onNext?: () => void;
}

export default function CheckoutPage({ onBack, onNext }: CheckoutPageProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();

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

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // 🔥 NEW: PAYMENT MODE
  const [paymentMode, setPaymentMode] = useState<"COD" | "ONLINE">("COD");

  const navigate = useNavigate();

  const handleBack = () => {
    onBack ? onBack() : navigate("/");
  };

  const handleNext = () => {
    onNext ? onNext() : navigate("/success");
  };

  /* ================= ORDER FLOW ================= */
  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to proceed");
      return;
    }

    if (!address || !phone) {
      alert("Please fill all details");
      return;
    }

    setLoading(true);

    try {
      // 🔥 CRITICAL: USER MAPPING ID
      const orderID = `${user.uid}_${Date.now()}`;

      // 🔥 FORMAT FOR PETPOOJA
      const formattedItems = items.map((item: any) => {

  if (!item.baseId) {

    throw new Error(

      `Missing Petpooja Base ID for item: ${item.name}`

    );

  }

  return {

    base_id: item.baseId,

    variation_id:

      item.petpoojaVariationId || "",

    name: item.name,

    price: item.price,

    quantity: item.quantity,

  };

});

      const payload = {
        orderID,
        userId: user.uid,
        name: user.displayName || "Guest",
        phone,
        email: user.email || "",
        address,
        items: formattedItems,
        paymentMode, // 🔥 COD / ONLINE
        couponCode: couponApplied ? couponCode : undefined,
      };

      console.log("🚀 Sending Order:", payload);

      const res = await fetch("https://api.gutmantra.in/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error("Order failed");
      }

      console.log("✅ Order Sent to Petpooja:", data);

      clearCart();
      handleNext();
    } catch (err) {
      console.error("❌ Checkout Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to place order";
      if (errorMsg.includes("Missing Petpooja")) {
        alert("One or more items are missing Petpooja ID. Please contact support.");
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= EMPTY CART ================= */
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Cart is empty</h1>
          <button onClick={() => navigate("/")}>Go Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">

        {/* LEFT */}
        <div className="lg:col-span-7 space-y-10">

          <button onClick={handleBack}>← Back</button>

          <h1 className="text-5xl font-bold">
            Checkout
          </h1>

          {/* FORM */}
          <div className="space-y-6">

            {/* PHONE */}
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 border rounded-xl"
            />

            {/* ADDRESS */}
            <textarea
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 border rounded-xl"
            />

            {/* 🔥 PAYMENT MODE */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-bold">Coupon</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 p-4 border rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="px-6 py-3 rounded-xl border bg-black text-white"
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                </div>
                {couponMessage ? (
                  <p className="text-sm text-gray-700">{couponMessage}</p>
                ) : null}
                {couponApplied ? (
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="text-sm text-blue-600"
                  >
                    Remove coupon
                  </button>
                ) : null}
              </div>

              <p className="font-bold">Payment Method</p>

              <div className="flex gap-4">

                <button
                  onClick={() => setPaymentMode("COD")}
                  className={`px-6 py-3 rounded-xl border ${
                    paymentMode === "COD"
                      ? "bg-black text-white"
                      : ""
                  }`}
                >
                  Cash on Delivery
                </button>

                <button
                  onClick={() => setPaymentMode("ONLINE")}
                  className={`px-6 py-3 rounded-xl border ${
                    paymentMode === "ONLINE"
                      ? "bg-black text-white"
                      : ""
                  }`}
                >
                  Online Payment
                </button>

              </div>
            </div>

            {/* PLACE ORDER */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-xl"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5">
          <div className="border p-6 rounded-xl">

            <h2 className="text-xl font-bold mb-4">Summary</h2>

            {items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex justify-between mb-2"
              >
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 font-bold text-lg flex justify-between">
                <span>Final Amount</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}