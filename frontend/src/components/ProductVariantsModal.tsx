import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Product } from "../services/productService";
import { useCart } from "../context/CartContext";

interface ProductVariantsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductVariantsModal({ product, isOpen, onClose }: ProductVariantsModalProps) {
  const { addToCart } = useCart();
  const variants = product.variants || [];
  
  // Default to first variant or product price
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = (e: React.MouseEvent) => {
    const price = selectedVariant ? Number(selectedVariant.price) : product.price;
    const variantName = selectedVariant ? (selectedVariant.weight || selectedVariant.name || "") : "";
    
    if (!selectedVariant?.petpoojaId) {
      console.warn("⚠️ petpoojaId missing for variant:", selectedVariant);
    }

    addToCart({
      id: `${product.id}${variantName ? `-${variantName}` : ""}`,
      name: `${product.name}${variantName ? ` (${variantName})` : ""}`,
      price: price,
      quantity: quantity,
      image: product.image || "",
      variant: variantName,
      petpoojaId: selectedVariant?.petpoojaId,
      category: product.category
    });
    
    // Trigger animation
    if ((window as any).triggerAddToCartAnimation) {
      (window as any).triggerAddToCartAnimation(e.clientX, e.clientY);
    }

    // Reset and close
    setQuantity(1);
    onClose();
  };

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedVariant(variants[0] || null);
      setQuantity(1);
    }
  }, [isOpen, variants]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Product Image (Mobile: Top, Desktop: Left) */}
            <div className="w-full md:w-2/5 aspect-square md:aspect-auto overflow-hidden bg-black/5">
              <img 
                src={product.image || "/placeholder.png"}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-8 flex flex-col">
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">{product.category}</span>
                <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
              </div>

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 text-accent">Select Option</p>
                  <div className="grid grid-cols-2 gap-3">
                    {variants.map((v: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-2xl border-2 transition-all text-left ${
                          selectedVariant === v 
                            ? "border-primary bg-primary/5" 
                            : "border-black/5 hover:border-black/10"
                        }`}
                      >
                        <p className="text-xs font-bold">{v.weight || v.name}</p>
                        <p className="text-sm font-bold text-primary mt-1">₹{v.price}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 text-accent">Quantity</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 bg-black/5 p-2 rounded-2xl">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-2 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-2 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="text-right flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Price</p>
                    <p className="text-2xl font-bold text-primary">₹{((selectedVariant ? Number(selectedVariant.price) : product.price) * quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group mt-auto"
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                Add to Cart
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
