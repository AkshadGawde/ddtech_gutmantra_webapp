import { motion } from "motion/react";
import { CheckCircle2, ArrowRight, ShoppingBag, Share2, Sparkles } from "lucide-react";

interface SuccessPageProps {
  onHome: () => void;
}

export default function SuccessPage({ onHome }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-secondary/5 skew-x-12 transform origin-bottom-left" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full glass p-8 md:p-20 rounded-[2.5rem] md:rounded-[4rem] text-center relative z-10 shadow-2xl shadow-black/5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 md:w-24 md:h-24 bg-secondary rounded-full flex items-center justify-center text-white mx-auto mb-6 md:mb-10 shadow-xl shadow-secondary/20"
        >
          <CheckCircle2 size={32} className="md:hidden" />
          <CheckCircle2 size={48} className="hidden md:block" />
        </motion.div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
          <Sparkles size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Order Confirmed</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
          Your Gut is <br />
          <span className="text-secondary italic font-serif font-normal">Thanking You</span>.
        </h1>

        <p className="text-base md:text-lg text-accent/50 font-medium mb-8 md:mb-12 leading-relaxed">
          Your order #GM-2026-4061 has been placed successfully. 
          We're preparing your fresh, stone-ground essentials for delivery!
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={onHome}
            className="w-full py-5 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
          >
            Continue Shopping
            <ShoppingBag size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full py-5 bg-white text-accent border border-black/10 rounded-full font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center justify-center gap-2">
            Share the Goodness
            <Share2 size={18} />
          </button>
        </div>

        <div className="mt-16 pt-12 border-t border-black/5 flex flex-col items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Estimated Delivery</p>
          <p className="text-xl font-bold">Tomorrow, before 8:00 PM</p>
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 4 + i, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 0.5
          }}
          className="absolute hidden md:block"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 15}%`,
            opacity: 0.1
          }}
        >
          <div className="w-12 h-12 bg-primary rounded-full blur-xl" />
        </motion.div>
      ))}
    </div>
  );
}
