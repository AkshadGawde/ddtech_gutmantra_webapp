import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import SocialFloating from "./components/SocialFloating";
import AddToCartAnimation from "./components/AddToCartAnimation";

import Hero from "./pages/Hero";
import OurProcess from "./pages/OurProcess";
import OurStory from "./pages/OurStory";
import UserProfile from "./pages/UserProfile";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentProcessing from "./pages/PaymentProcessing";
import SuccessPage from "./pages/SuccessPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import Footer from "./pages/Footer";

import CategorySection from "./components/CategorySection";
import ProductGrid from "./components/ProductGrid";
import BrandStory from "./components/BrandStory";
import Testimonials from "./components/Testimonials";
import SocialReel from "./components/SocialReel";
import CategoryPage from "./components/CategoryPage";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const navigate = useNavigate();

  /* ================= NAVIGATION HANDLER ================= */
  const handleNavigate = (
    view: string,
    params?: any
  ) => {
    if (view === "category") {
      navigate(`/${params.category}`);
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />

        {/* NAVBAR */}
        <Navbar
          onOpenCart={() =>
            setIsCartOpen(true)
          }
        />

        {/* ROUTES */}
        <Routes>
          {/* ================= HOME ================= */}
          <Route
            path="/"
            element={
              <main>
                <Hero
                  onNavigate={
                    handleNavigate
                  }
                />

                <CategorySection
                  onNavigate={
                    handleNavigate
                  }
                />

                <ProductGrid
                  onNavigate={
                    handleNavigate
                  }
                />

                <BrandStory />

                <OurProcess />

                <Testimonials />

                <SocialReel
                  onNavigate={
                    handleNavigate
                  }
                />
              </main>
            }
          />

          {/* ================= CATEGORY ================= */}
          <Route
            path="/atta"
            element={<CategoryPage />}
          />

          <Route
            path="/atta/:subcategory"
            element={<CategoryPage />}
          />

          <Route
            path="/oils"
            element={<CategoryPage />}
          />

          <Route
            path="/oils/:subcategory"
            element={<CategoryPage />}
          />

          <Route
            path="/spices"
            element={<CategoryPage />}
          />

          <Route
            path="/spices/:subcategory"
            element={<CategoryPage />}
          />

          {/* ================= PRODUCT PAGE ================= */}
          <Route
            path="/product/:id"
            element={<ProductPage />}
          />

          {/* ================= AUTH ================= */}
          <Route path="/login" element={<LoginPage />} />

          {/* ================= STATIC ================= */}
          <Route
            path="/our-story"
            element={<OurStory />}
          />

          <Route
            path="/contact"
            element={<ContactUs />}
          />

          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />

          <Route
            path="/refund-policy"
            element={<RefundPolicy />}
          />

          <Route
            path="/profile"
            element={
              <UserProfile
                onNavigate={
                  handleNavigate
                }
              />
            }
          />

          {/* ================= ORDER FLOW ================= */}
          <Route
            path="/checkout"
            element={<CheckoutPage />}
          />

          

<Route

  path="/payment-processing"

  element={<PaymentProcessing />}

/>

<Route

  path="/success"

  element={

    <SuccessPage

      onHome={() => navigate("/")}

    />

  }

/>

          <Route path="/admin" element={<AdminPage />} />

          {/* ================= 404 ================= */}
          <Route
            path="*"
            element={
              <div className="pt-24 text-center text-xl">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>

        {/* GLOBAL UI */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() =>
            setIsCartOpen(false)
          }
          onCheckout={() => {
            setIsCartOpen(false);

            navigate("/checkout");
          }}
        />

        <SocialFloating />

        <AddToCartAnimation />

        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}