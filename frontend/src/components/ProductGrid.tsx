import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShoppingCart, Heart, Star, Sparkles, Leaf } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { getProducts, Product } from "../services/productService";
import { getCloudinaryImage } from "../utils/cloudinary";
interface ProductGridProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function ProductGrid({ onNavigate }: ProductGridProps) {
  const { addToCart } = useCart();

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
      : products.slice(0, 6); // fallback if no best seller flag

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
              <Sparkles size={16} className="text-primary" />
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
              .
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

          {bestSellers.map((product, index) => {
            const image =
  product.image && product.image.includes("cloudinary")
    ? product.image
    : getCloudinaryImage(product.id);

            const price =
              Number(product.price) ||
              Number(product.variants?.[0]?.price) ||
              0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-black/5"
              >
                {/* IMAGE */}
                <div className="relative aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden mb-4 sm:mb-6">
                  <img

  src={image}

  alt={product.name}

  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"

  onError={(e) => {

    (e.currentTarget as HTMLImageElement).src = "/placeholder.png";

  }}

/>

                  {/* TAG */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Best Seller
                  </div>

                  {/* WISHLIST */}
                  <button className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-white">
                    <Heart size={18} />
                  </button>

                  {/* QUICK ADD */}
                  <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: price,
                          quantity: 1,
                          image: image,
                        })
                      }
                      className="w-full py-3 bg-white text-accent rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all"
                    >
                      <ShoppingCart size={16} />
                      Quick Add
                    </button>
                  </div>
                </div>

                {/* RATING */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={cn(
                        i < 4 ? "text-primary fill-primary" : "text-black/10"
                      )}
                    />
                  ))}
                  <span className="text-[10px] font-bold opacity-30 ml-2 uppercase tracking-widest">
                    4.8 (120 Reviews)
                  </span>
                </div>

                {/* DETAILS */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                      {product.category || "General"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹{price}
                    </p>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                      Per unit
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-accent/50 line-clamp-2 mb-6 font-medium leading-relaxed">
                  {product.description || "Premium quality product"}
                </p>

                {/* FOOTER */}
                <div className="flex items-center justify-between pt-6 border-t border-black/5">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white bg-black/5 overflow-hidden"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          alt="User"
                        />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      +4k
                    </div>
                  </div>

                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                    Happy Customers
                  </span>
                </div>
              </motion.div>
            );
          })}
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
                className="p-6 bg-white rounded-3xl border border-black/5 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Leaf size={24} />
                </div>

                <div>
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