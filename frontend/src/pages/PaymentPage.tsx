import { motion } from "motion/react";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PaymentPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function PaymentPage({ onBack, onSuccess }: PaymentPageProps) {
  const { totalPrice } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<string>("upi");

  const paymentMethods = [
    { id: "upi", name: "UPI Payment", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
    { id: "card", name: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
    { id: "cod", name: "Cash on Delivery", icon: CheckCircle2, desc: "Pay when you receive" },
  ];

  return (
    <div className="min-h-screen bg-bg-warm pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-8"
          >
            <ArrowLeft size={16} />
            Back to Shipping
          </button>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">Select <span className="text-primary italic font-serif font-normal">Payment</span>.</h1>
          <p className="text-accent/50 font-medium max-w-md mx-auto">Choose your preferred payment method to complete your purchase.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 md:p-12 rounded-[3rem] space-y-10"
        >
          <div className="grid gap-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  "w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between group",
                  selectedMethod === method.id 
                    ? "bg-white border-primary shadow-xl shadow-primary/10" 
                    : "bg-white/50 border-black/5 hover:border-black/10"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                    selectedMethod === method.id ? "bg-primary text-white" : "bg-black/5 text-accent/40"
                  )}>
                    <method.icon size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold tracking-tight">{method.name}</h3>
                    <p className="text-sm font-medium opacity-40">{method.desc}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedMethod === method.id ? "border-primary bg-primary" : "border-black/10"
                )}>
                  {selectedMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-10 border-t border-black/5 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Total Payable</p>
                <p className="text-4xl font-bold text-primary">₹{totalPrice}</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Order ID</p>
                <p className="text-sm font-bold">#GM-2026-4061</p>
              </div>
            </div>

            <button 
              onClick={onSuccess}
              className="w-full py-6 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group text-lg"
            >
              <ShieldCheck size={24} />
              Pay Now & Confirm
            </button>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-8 opacity-30 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/1200px-UPI-Logo.png" alt="UPI" className="h-6" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" />
        </div>
      </div>
    </div>
  );
}
