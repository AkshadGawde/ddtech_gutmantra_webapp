import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, totalAmount, totalItems } = useCart();
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
          />

          {/* DRAWER */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-[100] flex flex-col shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <div>
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <p className="text-sm text-accent/50">{totalItems} items</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="font-bold">Your cart is empty</p>
                  <p className="text-sm">Add some delicious products!</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.variant || ''}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border border-black/5 rounded-2xl p-4 flex gap-4"
                  >
                    {/* IMAGE */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                        <p className="text-primary font-bold text-sm">₹{item.price}</p>
                      </div>

                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center gap-2 bg-black/5 p-1 rounded-lg w-fit">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variant)}
                          className="p-1 hover:bg-white rounded transition-colors active:scale-90"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                          className="p-1 hover:bg-white rounded transition-colors active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* DELETE */}
                    <button
                      onClick={() => removeFromCart(item.id, item.variant)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors self-start"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* FOOTER */}
            {items.length > 0 && (
              <div className="border-t border-black/5 p-6 space-y-4">
                {/* TOTAL */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-accent/50">Total</span>
                  <span className="text-3xl font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>

                {/* CHECKOUT BUTTON */}
                <button
                  onClick={() => {
                    if (!user) {
                      alert("Please login to proceed");
                      onClose();
                      return;
                    }
                    onCheckout();
                  }}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* CONTINUE SHOPPING */}
                <button
                  onClick={onClose}
                  className="w-full py-3 border border-black/10 rounded-full font-bold uppercase tracking-widest hover:bg-black/5 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}