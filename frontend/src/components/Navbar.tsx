import {
  ShoppingCart,
  User,
  Menu,
  Leaf,
  ChevronDown,
  X,
  Search,
  ChevronRight,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/constants";
import LoginModal from "./LoginModal";
import SearchBar from "./SearchBox";

interface NavbarProps {
  onOpenCart: () => void;
}

export default function Navbar({ onOpenCart }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { totalItems } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Click outside listener for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // force slug mapping fix
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
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          
          {/* SEARCH - MOBILE */}
          <div className="md:hidden">
            <SearchBar />
          </div>

          {/* SEARCH - DESKTOP */}
          <div className="hidden sm:md:block">
            <SearchBar />
          </div>

          {/* CART */}
          <button 
            onClick={onOpenCart} 
            className={cn(
              "relative p-2 rounded-full transition-all active:scale-95",
              isScrolled ? "hover:bg-primary/5" : "hover:bg-white/10"
            )}
          >
            <ShoppingCart size={22} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-[10px] bg-primary text-white font-bold rounded-full border-2 border-white shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* USER */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() =>
                user ? setIsUserMenuOpen(!isUserMenuOpen) : setIsLoginModalOpen(true)
              }
              className={cn(
                "p-2 rounded-full transition-all active:scale-95",
                isScrolled ? "hover:bg-primary/5" : "hover:bg-white/10"
              )}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-6 h-6 rounded-full" />
              ) : (
                <User size={22} />
              )}
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl w-56 p-2 border border-black/5 flex flex-col gap-1 z-[60]"
                >
                  <div className="px-4 py-3 border-b border-black/5 mb-1">
                    <p className="text-xs font-bold text-accent truncate">{user?.displayName}</p>
                    <p className="text-[10px] text-accent/40 truncate">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold transition-all group"
                  >
                    <Settings size={16} className="opacity-40 group-hover:opacity-100" />
                    Profile Settings
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold transition-all group"
                    >
                      <LayoutDashboard size={16} className="opacity-40 group-hover:opacity-100" />
                      Dashboard
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl text-sm font-bold transition-all group mt-1"
                  >
                    <LogOut size={16} className="opacity-40 group-hover:opacity-100" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-primary/5 rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-bg-warm z-[101] overflow-hidden flex flex-col md:hidden"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Leaf size={18} />
                  </div>
                  <span className="font-bold tracking-tight">GutMantra</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                {/* Search in Mobile Menu */}
                <div className="relative">
                  <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                    <Search size={18} className="text-secondary" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className="bg-transparent border-none outline-none text-sm w-full font-medium"
                      readOnly
                      onClick={() => {
                        // In a real app we'd open a search modal here too
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-4 px-2">Navigation</p>
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all font-bold",
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white"
                    )}
                  >
                    Home
                    <ChevronRight size={18} className="opacity-40" />
                  </NavLink>
                  
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <button
                        onClick={() => navigate(`/${getRoute(cat.slug)}`)}
                        className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-white transition-all font-bold group"
                      >
                        {cat.name}
                        <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      {cat.subcategories?.map((sub) => (
                        <button
                          key={sub.slug}
                          onClick={() => navigate(`/${getRoute(cat.slug)}/${sub.slug}`)}
                          className="flex items-center gap-3 w-full p-3 pl-8 text-sm font-bold text-accent/60 hover:text-primary transition-colors"
                        >
                          <div className="w-1 h-1 rounded-full bg-primary/40" />
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  ))}

                  <NavLink 
                    to="/our-story" 
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-white transition-all font-bold"
                  >
                    Our Story
                    <ChevronRight size={18} className="opacity-40" />
                  </NavLink>
                </div>
              </div>

              {/* Login/User state in mobile menu */}
              <div className="p-6 border-t border-black/5 bg-white">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ""} />
                      ) : (
                        <User size={24} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm tracking-tight">{user.displayName}</p>
                      <button 
                        onClick={logout} 
                        className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    Get Started
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </motion.nav>
  );
}