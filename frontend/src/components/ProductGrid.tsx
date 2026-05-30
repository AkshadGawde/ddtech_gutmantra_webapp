import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CATEGORIES } from "@/constants";
import { useCart } from "@/context/CartContext";
import { getProducts, Product } from "../services/productService";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function ProductGrid({ onNavigate }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        console.log("🔥 GRID PRODUCTS:", data);
        setProducts(data);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /* ================= BEST SELLERS ================= */
  const bestSellers =
    products.filter((p) => p.isBestSeller)?.length > 0
      ? products.filter((p) => p.isBestSeller).slice(0, 6)
      : products.slice(0, 6);

  if (loading) {
    return (
      <div className="py-24 text-center opacity-50">
        Loading Best Sellers...
      </div>
    );
  }

  return (
    <section id="shop" className="py-16 bg-bg-warm">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Best Sellers
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tighter"
            >
              Pune's favorite{" "}
              <span className="text-primary italic font-serif font-normal">
                Pantry Essentials
              </span>
              
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <button
              onClick={() =>
                onNavigate("category", { category: "atta" })
              }
              className="px-6 py-3 bg-white border border-black/10 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black/5 transition-all"
            >
              View All Products
            </button>
          </motion.div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {bestSellers.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* CATEGORY NAV */}
        <div className="mt-20 pt-16 border-t border-black/5">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold tracking-tight">
              Explore our full range
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -5 }}
                onClick={() =>
                  onNavigate("category", { category: cat.slug })
                }
                className="overflow-hidden bg-white rounded-3xl border border-black/5 flex flex-col items-center text-center hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-full h-36 md:h-60 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] font-bold opacity-30 mt-1">
                    View All Products
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}