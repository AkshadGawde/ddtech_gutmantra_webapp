import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getProducts, Product } from "../services/productService";
import ProductCard from "./ProductCard";
import { Loader } from "lucide-react";

interface SimilarProductsProps {
  category: string;
  currentProductId: string;
}

export default function SimilarProducts({ category, currentProductId }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await getProducts();
        // Filter: same category, exclude current product, limit to 6
        const similar = allProducts
          .filter((p) => p.category === category && p.id !== currentProductId)
          .slice(0, 6);
        setProducts(similar);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, currentProductId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader className="animate-spin text-primary mx-auto mb-4" size={40} />
        <p className="text-gray-600">Loading similar products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-20 border-t border-gray-200"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
        Similar Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <ProductCard product={product} index={index} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
