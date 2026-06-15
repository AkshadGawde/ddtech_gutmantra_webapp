import React, { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getProducts, Product } from "../services/productService";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const data = await getProducts();
      setAllProducts(data);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (query.trim().length > 1) {
      const words = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
      const filtered = allProducts.filter(p => {
        const text = [p.name, p.category, p.description ?? ""].join(" ").toLowerCase();
        return words.some(word => text.includes(word));
      }).slice(0, 5);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, allProducts]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleResultClick = (product: Product) => {
    navigate(`/product/${product.id}`);
    onClose();
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/${slug}`);
    onClose();
  };

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="p-2 hover:bg-black/5 rounded-full transition-colors"
        title="Search products"
      >
        <Search size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2 bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-4 md:p-5 flex items-center gap-3 md:gap-4 border-b border-black/5">
                <Search size={20} className="text-primary flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-base md:text-lg font-medium"
                />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 rounded-full flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto p-4">
                {query.trim().length > 0 ? (
                  results.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2 mb-2">Results</p>
                      {results.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleResultClick(product)}
                          className="w-full flex items-center gap-3 md:gap-4 p-3 hover:bg-primary/5 rounded-2xl transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-black/5 overflow-hidden shrink-0">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.src.endsWith("/placeholder.svg")) {
                                  img.src = "/placeholder.svg";
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm md:text-base line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-secondary font-bold uppercase tracking-widest">{product.category}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary text-sm md:text-base">₹{product.price}</p>
                            <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center opacity-40">
                      <p className="text-sm">No products found for "{query}"</p>
                    </div>
                  )
                ) : (
                  <div className="py-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2 mb-4">Popular Categories</p>
                      <div className="flex flex-wrap gap-2 px-2">
                        {[
                          { label: "Cold Pressed Oils", slug: "oils" },
                          { label: "Stone Ground Atta", slug: "atta" },
                          { label: "Spices", slug: "spices" },
                        ].map(cat => (
                          <button
                            key={cat.slug}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className="px-4 py-2 bg-black/5 hover:bg-primary/10 hover:text-primary rounded-full text-xs font-bold transition-all"
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
