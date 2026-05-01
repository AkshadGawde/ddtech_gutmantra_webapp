import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <ShoppingBag size={18} className="sm:hidden" />
                  <ShoppingBag size={20} className="hidden sm:block" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">Your Cart</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{totalItems} Items</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={20} className="sm:hidden" />
                <X size={24} className="hidden sm:block" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <p className="font-medium">Your cart is empty</p>
                  <button 
                    onClick={onClose}
                    className="text-primary font-bold uppercase tracking-widest text-xs hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/5 shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-accent leading-tight">{item.name}</h3>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-black/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mt-1">{item.category}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-black/5 rounded-lg px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white rounded-md transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="font-bold text-primary">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/5 bg-bg-warm space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium opacity-60">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium opacity-60">
                    <span>Delivery</span>
                    <span className="text-secondary">FREE</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{totalPrice}</span>
                  </div>
                </div>
                
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                  Checkout
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
