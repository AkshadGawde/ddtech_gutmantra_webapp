import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Toast() {
  const { notification } = useCart();

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-accent text-white rounded-2xl shadow-2xl border border-white/10 min-w-[300px]"
        >
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-sm font-bold tracking-tight">{notification}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
