import React, { useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import ProductVariantsModal from "./ProductVariantsModal";
import {
  extractVariantSku,
  extractVariantPrice,
  buildVariantName,
} from "../utils/skuHelpers";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const variants = product.variants || [];
  const pricedVariants = variants.filter((v) => Number(v.price) > 0);
  const sortedPriced = [...pricedVariants].sort((a, b) => Number(a.price) - Number(b.price));
  // Default to 100gm variant → largest → first priced
  const defaultVariant =
    pricedVariants.find((v) => String(v.quantity || "").includes("100")) ||
    (sortedPriced.length > 0 ? sortedPriced[sortedPriced.length - 1] : null) ||
    (variants.length > 0 ? variants[0] : null);
  const minVariant = sortedPriced.length > 0 ? sortedPriced[0] : defaultVariant;
  const minPrice = sortedPriced.length > 0 ? Number(sortedPriced[0].price) : product.price;
  const maxPrice = sortedPriced.length > 1 ? Number(sortedPriced[sortedPriced.length - 1].price) : 0;
  const defaultPrice = defaultVariant ? Number(defaultVariant.price) : product.price;
  const displayPrice = defaultPrice > 0 ? defaultPrice : product.price;
  const showRange = maxPrice > minPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add minimum variant with minimum quantity
    const price = extractVariantPrice(minVariant, product);
    const variantName = buildVariantName(minVariant);
    const baseId = extractVariantSku(minVariant, product);

    // Debug logs
    console.log("🛒 MIN_VARIANT (ProductCard)", minVariant);
    console.log("🛒 Extracted SKU:", baseId);
    console.log("🛒 Extracted Price:", price);

    if (!minVariant?.petpoojaId) {
      console.warn("⚠️ petpoojaId missing for variant:", minVariant);
    }

    if (!baseId) {
      console.error("❌ Quick add missing SKU for product", {
        minVariant,
        product,
      });
      alert("Product information incomplete. Please try again.");
      return;
    }

    if (price <= 0) {
      console.error("❌ Quick add invalid price", {
        minVariant,
        product,
        price,
      });
      alert("Product price information missing. Please try again.");
      return;
    }

    const variationId = minVariant?.petpoojaId
      ? String(minVariant.petpoojaId).replace(/^V/, "")
      : "";

    const cartItem = {
      id: `${product.id}${variantName ? `-${variantName}` : ""}`,
      name: `${product.name}${variantName ? ` (${variantName})` : ""}`,
      price: price,
      quantity: 1,
      image: product.image || "",
      variant: variantName,
      petpoojaId: minVariant?.petpoojaId,
      base_id: baseId,
      variation_id: variationId,
      sku: baseId,
      category: product.category,
    };

    console.log("✅ CART_ITEM (ProductCard quick add)", cartItem);
    addToCart(cartItem);

    // Trigger animation
    if ((window as any).triggerAddToCartAnimation) {
      (window as any).triggerAddToCartAnimation(e.clientX, e.clientY);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        onClick={() => navigate(`/product/${product.id}`)}
        className="group bg-white rounded-2xl sm:rounded-[2.5rem] p-2.5 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-black/5 cursor-pointer"
      >
        {/* IMAGE */}
        <div className="relative aspect-square rounded-xl sm:rounded-[2rem] overflow-hidden mb-2.5 sm:mb-6">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.src.endsWith("/placeholder.svg")) {
                img.src = "/placeholder.svg";
              }
            }}
          />

          {/* WISHLIST — desktop only */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex absolute top-4 right-4 w-10 h-10 glass rounded-full items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-white"
          >
            <Heart size={18} />
          </button>

          {/* QUICK ACTIONS — desktop hover only */}
          <div className="hidden sm:flex absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex-1 py-3 bg-white text-accent rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-primary hover:text-white transition-all whitespace-nowrap"
            >
              Select Variants
            </button>
            <button
              onClick={handleQuickView}
              className="flex-1 py-3 bg-white text-accent rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Eye size={14} />
              Quick View
            </button>
            <button
              onClick={handleQuickAdd}
              className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-dark transition-all shrink-0"
            >
              <ShoppingBag size={18} />
            </button>
          </div>
        </div>

        {/* DETAILS */}
        <div className="flex justify-between items-start gap-1.5 sm:gap-4 mb-1.5 sm:mb-4">
          <div className="min-w-0">
            <h3 className="text-[13px] sm:text-xl font-bold tracking-tight mb-0.5 sm:mb-1 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-secondary">
              {product.category}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[13px] sm:text-xl font-bold text-primary">
              {displayPrice > 0
                ? showRange
                  ? `₹${minPrice}–₹${maxPrice}`
                  : `₹${displayPrice}`
                : "—"}
            </p>
            {pricedVariants.length > 0 && (
              <p className="hidden sm:block text-[8px] font-bold opacity-30 uppercase tracking-widest">
                {showRange ? "Price range" : "Starting at"}
              </p>
            )}
          </div>
        </div>

        {/* DESCRIPTION — desktop only */}
        <p className="hidden sm:block text-xs text-accent/50 line-clamp-2 mb-6 font-medium leading-relaxed h-8">
          {product.description || "Premium quality product from GutMantra."}
        </p>

        {/* MOBILE ADD BUTTON — always visible on mobile, hidden on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className="sm:hidden w-full mt-1.5 py-2 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-wider"
        >
          Add
        </button>

        {/* FOOTER — desktop only */}
        <div className="hidden sm:flex items-center justify-between pt-6 border-t border-black/5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white bg-black/5 overflow-hidden"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 15}`}
                  alt="User"
                />
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
              +4k
            </div>
          </div>

          <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">
            Happy Customers
          </span>
        </div>
      </motion.div>

      <ProductVariantsModal 
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
