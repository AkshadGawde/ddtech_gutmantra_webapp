import React, { useState, useEffect } from "react";
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
  const allVariants: any[] = product.variants || [];

  // ---------- derive selectable variants ----------
  // Filter out the meaningless "Default"/"Standard" placeholders.
  // Keep any variant that has a real name (quantity label).
  const namedVariants = allVariants.filter(
    (v) => v.quantity && v.quantity !== "Default" && v.quantity !== "Standard"
  );
  const pricedNamed = namedVariants.filter((v) => Number(v.price) > 0);

  // What we actually show in the selector:
  //   • priced named variants  (best case — spices with 50gm / 100gm)
  //   • all named variants     (priced later — at least show the names)
  //   • all variants           (fallback — even if only "Default" exists)
  const selectorVariants =
    pricedNamed.length > 0
      ? pricedNamed
      : namedVariants.length > 0
      ? namedVariants
      : allVariants;

  // Default selection: prefer 100gm variant → largest by price → first priced → first
  function pickDefault(list: any[]) {
    const priced = list.filter((v) => Number(v.price) > 0);
    if (priced.length === 0) return list[0] ?? null;
    const hundred = priced.find((v) => String(v.quantity || "").includes("100"));
    if (hundred) return hundred;
    return priced.reduce((max, v) => (Number(v.price) > Number(max.price) ? v : max), priced[0]);
  }

  const [selectedVariant, setSelectedVariant] = useState<any>(() => pickDefault(selectorVariants));
  const [quantity, setQuantity] = useState(1);

  // Re-initialise when the modal opens or the product changes
  useEffect(() => {
    if (isOpen) {
      setSelectedVariant(pickDefault(selectorVariants));
      setQuantity(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product.id]);

  // ---------- grind sub-selector (atta products) ----------
  const uniqueGrinds = [...new Set(selectorVariants.map((v) => v.grind).filter(Boolean))] as string[];
  const hasMultipleGrinds = uniqueGrinds.length > 1;

  // Variants matching the currently selected grind
  const variantsForGrind = hasMultipleGrinds && selectedVariant?.grind
    ? selectorVariants.filter((v) => v.grind === selectedVariant.grind)
    : selectorVariants;

  const uniqueSizes = [...new Set(variantsForGrind.map((v) => v.quantity).filter(Boolean))] as string[];

  // ---------- add to cart ----------
  const handleAddToCart = (e: React.MouseEvent) => {
    const baseId = extractVariantSku(selectedVariant, product);
    const price = extractVariantPrice(selectedVariant, product);
    const variantName = buildVariantName(selectedVariant);
    const variationId = selectedVariant?.petpoojaId
      ? String(selectedVariant.petpoojaId).replace(/^V/, "")
      : baseId;

    console.log("🛒 [Modal] selectedVariant:", selectedVariant);
    console.log("🛒 [Modal] baseId:", baseId, "| price:", price, "| variantName:", variantName);

    if (!baseId) {
      alert("Product SKU is missing. Please refresh and try again.");
      return;
    }

    if (price <= 0) {
      const available = pricedNamed.map((v) => `${v.quantity} ₹${v.price}`).join(", ");
      alert(
        available
          ? `Please select a variant — available: ${available}`
          : "Price not available yet. Please check back soon."
      );
      return;
    }

    addToCart({
      id: product.id,
      productId: product.id,
      base_id: baseId,
      variation_id: variationId,
      name: product.name,
      price,
      quantity,
      image: product.image || "",
      variant: variantName,
      petpoojaId: selectedVariant?.petpoojaId,
      sku: baseId,
      category: product.category,
      grind: selectedVariant?.grind,
      selectedQuantity: selectedVariant?.quantity,
    });

    console.log("✅ [Modal] Added to cart:", { base_id: baseId, variation_id: variationId, price, variantName });

    if ((window as any).triggerAddToCartAnimation) {
      (window as any).triggerAddToCartAnimation(e.clientX, e.clientY);
    }

    setQuantity(1);
    onClose();
  };

  const displayPrice = extractVariantPrice(selectedVariant, product);
  const hasNoPrice = pricedNamed.length === 0 && Number(product.price) === 0;

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
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image */}
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

              {/* ── Grind selector (atta only) ── */}
              {hasMultipleGrinds && (
                <div className="mb-4">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                    Grind Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueGrinds.map((grind) => (
                      <button
                        key={grind}
                        onClick={() => {
                          const next = selectorVariants.find((v) => v.grind === grind);
                          if (next) setSelectedVariant(next);
                        }}
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

              {/* ── Size / weight selector ── */}
              {uniqueSizes.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                    Select Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueSizes.map((size) => {
                      const v = variantsForGrind.find((vv) => vv.quantity === size);
                      const vPrice = v ? Number(v.price) : 0;
                      const isSelected = selectedVariant?.quantity === size &&
                        (!hasMultipleGrinds || selectedVariant?.grind === v?.grind);
                      return (
                        <button
                          key={size}
                          onClick={() => { if (v) setSelectedVariant(v); }}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <p className="text-sm font-bold">{size}</p>
                          {vPrice > 0 && (
                            <p className="text-xs font-semibold mt-0.5 text-primary">₹{vPrice}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── No data yet ── */}
              {hasNoPrice && (
                <p className="text-sm text-gray-400 mb-4">
                  Pricing will be available soon. Contact us for bulk orders.
                </p>
              )}

              {/* ── Order quantity + total ── */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">
                  Order Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
                    <button
                      onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                      className="p-2 hover:bg-white rounded-md transition-all active:scale-95"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((p) => p + 1)}
                      className="p-2 hover:bg-white rounded-md transition-all active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="text-right flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Price</p>
                    <p className="text-2xl font-bold text-primary">
                      {displayPrice > 0 ? `₹${(displayPrice * quantity).toFixed(0)}` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Add to cart ── */}
              <button
                onClick={handleAddToCart}
                disabled={hasNoPrice}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                {hasNoPrice ? "Pricing Unavailable" : "Add to Cart"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
