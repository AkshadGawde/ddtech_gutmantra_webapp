import { motion } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Share2,
  Loader,
} from "lucide-react";
import { getProduct, Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import ProductVariantsModal from "../components/ProductVariantsModal";
import ReviewsSection from "../components/ReviewsSection";
import SimilarProducts from "../components/SimilarProducts";
import {
  extractVariantSku,
  extractVariantPrice,
  buildVariantName,
} from "../utils/skuHelpers";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getProduct(id);

        if (!data) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  /* ================= IMAGE GALLERY ================= */
  const images = product?.images && product.images.length > 0 ? product.images : [product?.image];

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  /* ================= VARIANT MATCHING ================= */
  const getUniqueGrinds = () => {
    if (!product?.variants) return [];
    const grinds = product.variants.map((v: any) => v.grind).filter(Boolean);
    return [...new Set(grinds)];
  };

  const getUniqueQuantities = (grind?: string) => {
    if (!product?.variants) return [];
    const filtered = grind
      ? product.variants.filter((v: any) => v.grind === grind)
      : product.variants;
    const quantities = filtered.map((v: any) => v.quantity).filter(Boolean);
    return [...new Set(quantities)];
  };

  const updateVariant = (grind?: string, quantity?: string) => {
    const variant = product?.variants?.find(
      (v: any) =>
        (!grind || v.grind === grind) && (!quantity || v.quantity === quantity)
    );
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  /* ================= ADD TO CART ================= */
  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    // ✅ Use robust SKU and price extraction
    const baseId = extractVariantSku(selectedVariant, product);
    const price = extractVariantPrice(selectedVariant, product);
    const variantName = buildVariantName(selectedVariant);

    // Debug logs
    console.log("🛒 SELECTED_VARIANT (ProductPage)", selectedVariant);
    console.log("🛒 Extracted SKU:", baseId);
    console.log("🛒 Extracted Price:", price);

    const variationId = selectedVariant.petpoojaId
      ? String(selectedVariant.petpoojaId).replace(/^V/, "")
      : "";

    if (!baseId) {
      console.error("❌ Missing SKU for selected variant", {
        selectedVariant,
        product,
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

    const cartItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: price,
      quantity: selectedQuantity,
      image: product.image || "",
      variant: variantName,
      base_id: baseId,
      variation_id: variationId,
      petpoojaId: selectedVariant.petpoojaId,
      category: product.category,
      grind: selectedVariant.grind,
      selectedQuantity: selectedVariant.quantity,
      sku: baseId,
    };

    console.log("✅ CART_ITEM (ProductPage)", cartItem);
    addToCart(cartItem);
    setSelectedQuantity(1);

    // Trigger animation if available
    if ((window as any).triggerAddToCartAnimation) {
      (window as any).triggerAddToCartAnimation(window.innerWidth - 100, 50);
    }
  };

  /* ================= BUY NOW ================= */
  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-primary mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Product not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary font-bold mb-8 hover:gap-3 transition-all"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* ================= LEFT: IMAGE GALLERY ================= */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* MAIN IMAGE */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100">
              <motion.img
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[selectedImageIndex] || "/placeholder.png"}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                }}
              />

              {/* IMAGE NAV */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* INDICATORS */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === selectedImageIndex
                            ? "bg-white w-8"
                            : "bg-white/50 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img || "/placeholder.png"}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ================= RIGHT: PRODUCT INFO ================= */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-between"
          >
            {/* HEADER INFO */}
            <div className="space-y-6">
              {/* CATEGORY */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full w-fit">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {product.category}
                </span>
              </div>

              {/* TITLE */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500">SKU: {product.id}</p>
              </div>

              {/* PRICE */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  ₹{selectedVariant?.price || product.price}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedVariant?.quantity || "Per unit"}
                </span>
              </div>

              {/* DESCRIPTION */}
              {product.description && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">About this product</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* ================= VARIANT SELECTORS ================= */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-6 pt-4">
                  {/* GRIND SELECTOR */}
                  {getUniqueGrinds().length > 1 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Grind Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {getUniqueGrinds().map((grind) => (
                          <button
                            key={grind}
                            onClick={() => updateVariant(grind, selectedVariant?.quantity)}
                            className={`py-3 px-4 rounded-lg border-2 font-bold transition-all ${
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

                  {/* QUANTITY SELECTOR */}
                  {getUniqueQuantities(selectedVariant?.grind).length > 1 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Size / Quantity
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {getUniqueQuantities(selectedVariant?.grind).map((qty) => (
                          <button
                            key={qty}
                            onClick={() => updateVariant(selectedVariant?.grind, qty)}
                            className={`py-3 px-4 rounded-lg border-2 font-bold transition-all ${
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
                </div>
              )}

              {/* QUANTITY SELECTOR */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-3 w-fit">
                  <button
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold w-8 text-center">{selectedQuantity}</span>
                  <button
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-8 border-t border-gray-200">
              <button
                onClick={handleAddToCart}
                className="py-4 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <ShoppingBag size={20} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold uppercase tracking-wider"
              >
                Buy Now
              </button>
            </div>

            {/* WISHLIST / SHARE */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold uppercase text-sm flex items-center justify-center gap-2">
                <Heart size={18} />
                Wishlist
              </button>
              <button className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold uppercase text-sm flex items-center justify-center gap-2">
                <Share2 size={18} />
                Share
              </button>
            </div>
          </motion.div>
        </div>

        {/* REVIEWS SECTION */}
        <ReviewsSection productId={product.id} productName={product.name} />

        {/* SIMILAR PRODUCTS */}
        <SimilarProducts category={product.category} currentProductId={product.id} />
      </div>

      {/* VARIANT MODAL */}
      <ProductVariantsModal
        product={product}
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
      />
    </div>
  );
}
