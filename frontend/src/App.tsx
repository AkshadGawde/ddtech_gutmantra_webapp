import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import SocialFloating from "./components/SocialFloating";

import Hero from "./pages/Hero";
import OurProcess from "./pages/OurProcess";
import OurStory from "./pages/OurStory";
import UserProfile from "./pages/UserProfile";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import Footer from "./pages/Footer";

import CategorySection from "./components/CategorySection";
import ProductGrid from "./components/ProductGrid";
import BrandStory from "./components/BrandStory";
import Testimonials from "./components/Testimonials";
import SocialReel from "./components/SocialReel";
import CategoryPage from "./components/CategoryPage";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <Navbar onOpenCart={() => setIsCartOpen(true)} />

        <Routes>
  {/* 🏠 HOME */}
  <Route
    path="/"
    element={
      <main>
        <Hero />
        <CategorySection />
        <ProductGrid />
        <BrandStory />
        <OurProcess />
        <Testimonials />
        <SocialReel />
      </main>
    }
  />

  {/* 🛒 CATEGORY ROUTES */}
  {/* ATTA */}
  <Route path="/atta" element={<CategoryPage />} />
  <Route path="/atta/:subcategory" element={<CategoryPage />} />

  {/* OILS */}
  <Route path="/oils" element={<CategoryPage />} />
  <Route path="/oils/:subcategory" element={<CategoryPage />} />

  {/* SPICES */}
  <Route path="/spices" element={<CategoryPage />} />
  <Route path="/spices/:subcategory" element={<CategoryPage />} />

  {/* 📄 STATIC PAGES */}
  <Route path="/our-story" element={<OurStory />} />
  <Route path="/contact" element={<ContactUs />} />
  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  <Route path="/refund-policy" element={<RefundPolicy />} />
  <Route path="/profile" element={<UserProfile />} />

  {/* 💳 ORDER FLOW */}
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/payment" element={<PaymentPage />} />
  <Route path="/success" element={<SuccessPage />} />

  {/* ❌ 404 */}
  <Route
    path="*"
    element={
      <div className="pt-24 text-center text-xl">
        404 - Page Not Found
      </div>
    }
  />
</Routes>

        {/* GLOBAL COMPONENTS */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <SocialFloating />
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}