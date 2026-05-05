import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, useLocation } from "react-router-dom";
import { CATEGORIES } from "../constants";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Star } from "lucide-react";

import { getProducts, Product } from "../services/productService";
import { CATEGORY_MAP } from "../constants/categoryMap";

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
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="mb-16">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {category?.name} {subcategory ? `/ ${subcategory}` : ""}
            </span>
          </motion.div>

          <motion.h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            {subcategory || category?.name}
          </motion.h1>

          <p className="text-lg text-accent/60 max-w-2xl">
            {category?.description}
          </p>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {loading ? (
            <div className="col-span-full text-center py-20 opacity-50">
              Loading products...
            </div>
          ) : products.length > 0 ? (

            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition"
              >
                {/* IMAGE */}
                <div className="aspect-square rounded-xl overflow-hidden mb-4">
                  <img
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* NAME */}
                <h3 className="font-bold text-lg">{product.name}</h3>

                {/* RATING */}
                <div className="flex items-center gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* PRICE + CART */}
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-primary">
                    ₹{product.price}
                  </span>

                  <button
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.image || "",
                      })
                    }
                    className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </motion.div>
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