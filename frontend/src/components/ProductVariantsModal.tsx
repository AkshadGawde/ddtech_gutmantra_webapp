import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import {
  extractVariantSku,
  extractVariantPrice,
  buildVariantName,
} from "../utils/skuHelpers";

interface ProductVariantsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductVariantsModal({ product, isOpen, onClose }: ProductVariantsModalProps) {
  const { addToCart } = useCart();
  const variants = product.variants || [];
  
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);

  /* ================= DYNAMIC GRIND/QUANTITY ================= */
  const getUniqueGrinds = () => {
    const grinds = variants.map((v: any) => v.grind).filter(Boolean);
    return [...new Set(grinds)];
  };

  const getUniqueQuantities = (grind?: string) => {
    const filtered = grind
      ? variants.filter((v: any) => v.grind === grind)
      : variants;
    const quantities = filtered.map((v: any) => v.quantity).filter(Boolean);
    return [...new Set(quantities)];
  };

  const updateVariant = (grind?: string, qty?: string) => {
    const variant = variants.find(
      (v: any) =>
        (!grind || v.grind === grind) && (!qty || v.quantity === qty)
    );
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  /* ================= ADD TO CART ================= */

const handleAddToCart = (e: React.MouseEvent) => {
  // ✅ Use robust SKU extraction
  const baseId = extractVariantSku(selectedVariant, product);
  const price = extractVariantPrice(selectedVariant, product);
  const variantName = buildVariantName(selectedVariant);

  // Debug logs
  console.log("🛒 Selected Variant:", selectedVariant);
  console.log("🛒 Extracted SKU:", baseId);
  console.log("🛒 Extracted Price:", price);

  // Real variation ID only if valid
  const variationId = selectedVariant?.petpoojaId
    ? String(selectedVariant.petpoojaId).replace(/^V/, "")
    : "";

  if (!baseId) {
    console.error("❌ Missing SKU for selected variant", {
      selectedVariant,
      product,
      baseId,
    });
    alert("Product information incomplete. Please refresh and try again.");
    return;
  }

  if (price <= 0) {
    console.error("❌ Invalid price for variant", {
      selectedVariant,
      product,
      price,
    });
    alert("Product price information missing. Please refresh and try again.");
    return;
  }

  addToCart({
    id: product.id,
    productId: product.id,

    // REQUIRED FOR PETPOOJA
    base_id: baseId,
    variation_id: variationId,

    name: product.name,
    price: price,
    quantity: quantity,

    image: product.image || "",
    variant: variantName,

    petpoojaId: selectedVariant?.petpoojaId,
    sku: baseId,

    category: product.category,
    grind: selectedVariant?.grind,
    selectedQuantity: selectedVariant?.quantity,
  });

  console.log("✅ Added to cart:", {
    base_id: baseId,
    variation_id: variationId,
    price,
    variantName,
  });

  // Trigger animation
  if ((window as any).triggerAddToCartAnimation) {
    (window as any).triggerAddToCartAnimation(
      e.clientX,
      e.clientY
    );
  }

  setQuantity(1);
  onClose();
};


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
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Product Image */}
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">
                  {product.category}
                </span>
                <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
              </div>

              {/* ================= GRIND SELECTOR ================= */}
              {variants.length > 0 && getUniqueGrinds().length > 1 && (
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                    Grind Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {getUniqueGrinds().map((grind: string) => (
                      <button
                        key={grind}
                        onClick={() => updateVariant(grind, selectedVariant?.quantity)}
                        className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-all ${
                          selectedVariant?.grind === grind
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {grind}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= QUANTITY/SIZE SELECTOR ================= */}
              {variants.length > 0 && getUniqueQuantities(selectedVariant?.grind).length > 1 && (
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                    Size / Weight
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {getUniqueQuantities(selectedVariant?.grind).map((qty: string) => (
                      <button
                        key={qty}
                        onClick={() => updateVariant(selectedVariant?.grind, qty)}
                        className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-all ${
                          selectedVariant?.quantity === qty
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= VARIANT OPTIONS (Fallback) ================= */}
              {variants.length > 0 && getUniqueGrinds().length <= 1 && getUniqueQuantities().length <= 1 && (
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                    Select Option
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((v: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-lg border-2 transition-all text-left text-sm font-bold ${
                          selectedVariant === v 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p>{v.grind || v.quantity || "Option"}</p>
                        <p className="text-primary mt-1">₹{v.price}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= QUANTITY SELECTOR ================= */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                  Order Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-2 hover:bg-white rounded-md transition-all active:scale-95"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-2 hover:bg-white rounded-md transition-all active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="text-right flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Price</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{((selectedVariant ? Number(selectedVariant.price) : product.price) * quantity).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= ADD BUTTON ================= */}
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group mt-auto"
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
