import React, { useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Star, Heart, Eye } from "lucide-react";
import { Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import ProductVariantsModal from "./ProductVariantsModal";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get lowest price and min variant
  const variants = product.variants || [];
  const minVariant = variants.length > 0 ? variants.reduce((min, v) => (Number(v.price) < Number(min.price) ? v : min), variants[0]) : null;
  const displayPrice = minVariant ? Number(minVariant.price) : product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add minimum variant with minimum quantity
    const price = minVariant ? Number(minVariant.price) : product.price;
    const variantName = minVariant ? (minVariant.weight || minVariant.name || "") : "";
    
    // 🧪 DEBUG: Log input state
    console.log("🧪 MIN_VARIANT (ProductCard)", minVariant);
    console.log("🧪 PRODUCT (ProductCard)", product);
    
    if (!minVariant?.petpoojaId) {
      console.warn("⚠️ petpoojaId missing for variant:", minVariant);
    }

    const baseId = minVariant?.sku || (product as any).sku || "";
    const variationId = minVariant?.petpoojaId
      ? String(minVariant.petpoojaId).replace(/^V/, "")
      : "";

    console.log("🧪 COMPUTED: baseId=", baseId, "variationId=", variationId);

    if (!baseId) {
      console.error("❌ Quick add missing base_id / sku for product", product);
      alert("Product SKU is missing. Please select a variant.");
      return;
    }

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

    console.log("✅ CART_ITEM (ProductCard)", cartItem);
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
        className="group bg-white rounded-[2.5rem] p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-black/5 cursor-pointer"
      >
        {/* IMAGE */}
        <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6">
          <img
            src={product.image || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
            }}
          />

          {/* WISHLIST */}
          <button 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-white"
          >
            <Heart size={18} />
          </button>

          {/* QUICK ACTIONS */}
          <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100 flex gap-2">
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
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={10}
              className={cn(
                i < 4 ? "text-primary fill-primary" : "text-black/10"
              )}
            />
          ))}
          <span className="text-[10px] font-bold opacity-30 ml-2 uppercase tracking-widest">
            4.8 (120)
          </span>
        </div>

        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {product.category}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-primary">₹{displayPrice}</p>
            {variants.length > 0 && (
              <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Starting at</p>
            )}
          </div>
        </div>

        <p className="text-xs text-accent/50 line-clamp-2 mb-6 font-medium leading-relaxed h-8">
          {product.description || "Premium quality product from GutMantra."}
        </p>

        {/* FOOTER */}
        <div className="flex items-center justify-between pt-6 border-t border-black/5">
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
