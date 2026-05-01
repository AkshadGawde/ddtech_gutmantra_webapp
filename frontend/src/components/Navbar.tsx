import {
  ShoppingCart,
  User,
  Menu,
  Leaf,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/constants";
import LoginModal from "./LoginModal";

interface NavbarProps {
  onOpenCart: () => void;
}

export default function Navbar({ onOpenCart }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { totalItems } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 force slug mapping fix
  const getRoute = (slug: string) => {
    if (slug === "cold-pressed-oils") return "oils";
    return slug;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 py-3",
        isScrolled ? "glass shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Leaf size={18} />
          </div>
          <span className="font-bold">GutMantra</span>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6 text-xs uppercase">

          <NavLink to="/" className="hover:text-primary">
            Home
          </NavLink>

          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="relative"
              onMouseEnter={() => setActiveDropdown(cat.id)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => navigate(`/${getRoute(cat.slug)}`)}
                className="flex items-center gap-1 hover:text-primary"
              >
                {cat.name}
                {cat.subcategories && <ChevronDown size={14} />}
              </button>

              {/* DROPDOWN */}
              <AnimatePresence>
                {activeDropdown === cat.id && cat.subcategories && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 bg-white shadow-xl rounded-xl w-52 mt-2 overflow-hidden"
                  >
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.slug}
                        onClick={() => {
                          navigate(`/${getRoute(cat.slug)}/${sub.slug}`);
                          setActiveDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <NavLink to="/our-story">Our Story</NavLink>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* CART */}
          <button onClick={onOpenCart} className="relative">
            <ShoppingCart />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-primary text-white px-1 rounded">
                {totalItems}
              </span>
            )}
          </button>

          {/* USER */}
          <div className="relative">
            <button
              onClick={() =>
                user ? setIsUserMenuOpen(!isUserMenuOpen) : setIsLoginModalOpen(true)
              }
            >
              <User />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 bg-white shadow-lg rounded-xl w-44 p-2"
                >
                  <button
                    onClick={() => navigate("/profile")}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    Profile
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      Admin
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 hover:bg-red-100 text-red-500 rounded"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MOBILE */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu />
          </button>
        </div>
      </div>

      {/* MOBILE NAV */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden bg-white shadow-lg mt-3 rounded-xl p-4 space-y-2"
          >
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </NavLink>

            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    navigate(`/${getRoute(cat.slug)}`);
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-semibold"
                >
                  {cat.name}
                </button>

                {cat.subcategories?.map((sub) => (
                  <button
                    key={sub.slug}
                    onClick={() => {
                      navigate(`/${getRoute(cat.slug)}/${sub.slug}`);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block ml-3 text-sm text-gray-600"
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </motion.nav>
  );
}