import { motion } from "motion/react";
import { ArrowLeft, MapPin, Phone, User, Mail, CreditCard, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { nanoid } from "nanoid";

interface CheckoutPageProps {
  onBack: () => void;
  onNext: () => void;
}

export default function CheckoutPage({ onBack, onNext }: CheckoutPageProps) {
  const { items, totalAmount } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to proceed");
      return;
    }
    if (!address || !phone) {
      alert("Please fill in all details");
      return;
    }

    setLoading(true);
    try {
      const orderId = nanoid(10).toUpperCase();
      const orderData = {
        id: orderId,
        userId: user.uid,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant || ""
        })),
        totalAmount,
        paymentStatus: "pending",
        orderStatus: "placed",
        shippingAddress: address,
        phone,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);
      onNext();
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
        {/* Left: Form */}
        <div className="lg:col-span-7 space-y-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-8"
            >
              <ArrowLeft size={16} />
              Back to Shop
            </button>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">Shipping <span className="text-primary italic font-serif font-normal">Details</span>.</h1>
            <p className="text-accent/50 font-medium max-w-md">Please enter your delivery information below to proceed with your order.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-8 md:p-12 rounded-[2.5rem] space-y-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    type="text" 
                    value={user?.displayName || ""}
                    readOnly
                    className="w-full bg-white/50 border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary transition-all opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/50 border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                <input 
                  type="email" 
                  value={user?.email || ""}
                  readOnly
                  className="w-full bg-white/50 border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary transition-all opacity-60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Delivery Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-4 text-primary" />
                <textarea 
                  rows={4}
                  placeholder="Shop No. 4, Green Park, Baner, Pune, Maharashtra 411045" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white/50 border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "Creating Order..." : "Continue to Payment"}
              <CreditCard size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-black/5 sticky top-32"
          >
            <h2 className="text-2xl font-bold tracking-tight mb-8">Order Summary</h2>
            
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
              {items.map((item) => (
                <div key={`${item.id}-${item.variant}`} className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-black/5">
              <div className="flex justify-between text-sm font-medium opacity-60">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm font-medium opacity-60">
                <span>Delivery</span>
                <span className="text-secondary">FREE</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-4">
                <span>Total</span>
                <span className="text-primary">₹{totalAmount}</span>
              </div>
            </div>

            <div className="mt-10 p-6 bg-secondary/5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Secure Checkout</p>
                <p className="text-sm font-bold">Your data is protected</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
