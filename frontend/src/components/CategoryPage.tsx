import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Truck } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import { CATEGORIES } from "../constants";
import { useCart } from "../context/CartContext";

import { getProducts, Product } from "../services/productService";
import { CATEGORY_MAP } from "../constants/categoryMap";
import ProductCard from "./ProductCard";

export default function CategoryPage() {
  const { addToCart } = useCart();

  const { subcategory } = useParams();
  const location = useLocation();

  const categorySlug = location.pathname.split("/")[1] || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.find((c) => c.slug === categorySlug);

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      try {
        const allProducts = await getProducts();

        console.log("🔥 NORMALIZED PRODUCTS:", allProducts);

        const config = CATEGORY_MAP[categorySlug];

        if (!config) {
          setProducts([]);
          return;
        }

        const filtered = allProducts.filter((p: any) => {
          const name = p.name.toLowerCase();
          const raw = (p.rawCategory || "").toLowerCase();

          /* ===== MAIN CATEGORY MATCH ===== */
          const mainMatch =
            p.category === categorySlug ||
            config.match.some((word: string) =>
              name.includes(word) || raw.includes(word)
            );

          if (!mainMatch) return false;

          /* ===== SUB CATEGORY MATCH ===== */
          if (subcategory && config.sub?.[subcategory]) {
            return config.sub[subcategory].some((word: string) =>
              name.includes(word)
            );
          }

          return true;
        });

        // Deduplicate by product ID
        const uniqueProducts = Array.from(new Map(filtered.map((p: any) => [p.id, p])).values());

        console.log("🔥 FILTERED PRODUCTS:", uniqueProducts);

        setProducts(uniqueProducts);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categorySlug, subcategory]);

  /* ================= UI ================= */
  return (
    <div className="pt-24 sm:pt-32 pb-24">
      {/* Fixed free-delivery pill — stays visible while scrolling on all screen sizes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="fixed bottom-6 left-4 z-50 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 bg-green-600 text-white rounded-2xl px-3 py-2 shadow-lg shadow-green-600/30"
        >
          <Truck size={15} className="flex-shrink-0" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 leading-none mb-0.5">Free delivery</p>
            <p className="text-xs font-bold leading-none">Orders above ₹799</p>
          </div>
        </motion.div>
      </motion.div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="mb-8 sm:mb-16">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {category?.name} {subcategory ? `/ ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}` : ""}
            </span>
          </motion.div>

          <motion.h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-3 sm:mb-6">
            {subcategory ? subcategory.charAt(0).toUpperCase() + subcategory.slice(1) : category?.name}
          </motion.h1>

          <p className="text-sm sm:text-lg text-accent/60 max-w-2xl">
            {category?.description}
          </p>
        </div>

        {/* PRODUCTS GRID */}
        <div className="product-grid">

          {loading ? (
            <div className="col-span-full text-center py-20 opacity-50">
              Loading products...
            </div>
          ) : products.length > 0 ? (

            products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))

          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl font-bold opacity-30">
                No products found in this category.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}