import {
  ShoppingCart,
  Menu,
  Leaf,
  ChevronDown,
  X,
  Search,
  ChevronRight,
  LogOut,
  Settings,
  LayoutDashboard,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName, getUserInitials } from "../utils/userHelpers";
import { CATEGORIES } from "@/constants";
import LoginModal from "./LoginModal";
import SearchBar from "./SearchBox";

interface NavbarProps {
  onOpenCart: () => void;
}

const MARQUEE_H = 36;
const MARQUEE_TEXT =
  'Welcome to GutMantra!  🌾  New Users Alert: Use coupon code "GMFIRST" at checkout for an exclusive discount on your first order!  ✨  ';

export default function Navbar({ onOpenCart }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { totalItems } = useCart();
  const { user, userData, logout, isAdmin, sessionExpired } = useAuth();
  const navigate = useNavigate();

  // Open login modal when cart triggers require-login event or session expires
  useEffect(() => {
    const handler = () => setIsLoginModalOpen(true);
    window.addEventListener("require-login", handler);
    return () => window.removeEventListener("require-login", handler);
  }, []);

  useEffect(() => {
    if (sessionExpired) setIsLoginModalOpen(true);
  }, [sessionExpired]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const getRoute = (slug: string) => {
    if (slug === "cold-pressed-oils") return "oils";
    return slug;
  };

  return (
    <>
      {/* ── Marquee Banner — always fixed at the very top ── */}
      <div
        className="fixed left-0 right-0 z-50 bg-primary overflow-hidden"
        style={{ top: 0, height: MARQUEE_H }}
      >
        <div className="relative flex whitespace-nowrap h-full items-center">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="flex-shrink-0 text-white text-[11px] font-bold uppercase tracking-widest"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                x: { duration: 70, ease: "linear", repeat: Infinity, delay: i === 1 ? -16 : 0 },
              }}
              aria-hidden={i === 1}
            >
              {Array(8).fill(MARQUEE_TEXT).join("   •   ")}
            </motion.span>
          ))}
        </div>
      </div>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{ top: MARQUEE_H }}
        className={cn(
          "fixed left-0 right-0 z-50 transition-colors duration-300 border-b",
          isScrolled
            ? "bg-white shadow-sm border-black/8"
            : "bg-white/95 backdrop-blur-sm border-black/5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-[68px]">

          {/* ── LOGO ── */}
          <NavLink to="/" className="flex items-center flex-shrink-0 z-10">
            <img
              src="https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_200/v1779879308/kup9jkswy7abbal9xdov.png"
              alt="GutMantra"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </NavLink>

          {/* ── DESKTOP NAV ── */}
          <div className="hidden md:flex items-center gap-5 lg:gap-7 text-[12px] font-bold uppercase tracking-wider text-accent">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn("hover:text-primary transition-colors py-1", isActive && "text-primary")
              }
            >
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
                  className="flex items-center gap-1 hover:text-primary transition-colors py-1"
                >
                  {cat.name}
                  {cat.subcategories && (
                    <ChevronDown
                      size={12}
                      className={cn(
                        "transition-transform duration-200",
                        activeDropdown === cat.id && "rotate-180"
                      )}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {activeDropdown === cat.id && cat.subcategories && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 bg-white shadow-2xl rounded-2xl w-52 mt-2 overflow-hidden border border-black/5 z-50"
                    >
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub.slug}
                          onClick={() => {
                            navigate(`/${getRoute(cat.slug)}/${sub.slug}`);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-primary/5 hover:text-primary text-sm font-bold tracking-wide transition-colors"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          {sub.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <NavLink
              to="/our-story"
              className={({ isActive }) =>
                cn("hover:text-primary transition-colors py-1", isActive && "text-primary")
              }
            >
              Our Story
            </NavLink>
          </div>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex items-center gap-0.5 sm:gap-1">

            {/* Search */}
            <SearchBar
              isOpen={isSearchOpen}
              onOpen={() => setIsSearchOpen(true)}
              onClose={() => setIsSearchOpen(false)}
            />

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-full hover:bg-primary/5 transition-all active:scale-95"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-[9px] bg-primary text-white font-bold rounded-full border border-white"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* User — desktop only */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() =>
                  user ? setIsUserMenuOpen(!isUserMenuOpen) : setIsLoginModalOpen(true)
                }
                className="p-2 rounded-full hover:bg-primary/5 transition-all active:scale-95"
                aria-label="User menu"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user?.displayName || ""}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                    {user ? getUserInitials(getDisplayName(userData, user)) : <User size={14} />}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl w-56 p-2 border border-black/5 flex flex-col gap-1 z-[60]"
                  >
                    <div className="px-4 py-3 border-b border-black/5 mb-1">
                      <p className="text-xs font-bold text-accent truncate">
                        {getDisplayName(userData, user)}
                      </p>
                      <p className="text-[10px] text-accent/40 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold transition-all group"
                    >
                      <Settings size={15} className="opacity-40 group-hover:opacity-100" />
                      Profile Settings
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-primary/5 hover:text-primary rounded-xl text-sm font-bold transition-all group"
                      >
                        <LayoutDashboard size={15} className="opacity-40 group-hover:opacity-100" />
                        Dashboard
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl text-sm font-bold transition-all group mt-1"
                    >
                      <LogOut size={15} className="opacity-40 group-hover:opacity-100" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hamburger — mobile only, always visible */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-primary/5 transition-colors ml-1"
              aria-label="Open menu"
            >
              <Menu size={22} className="text-accent" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE DRAWER (rendered outside nav so z-index is clean) ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-[82%] max-w-[320px] bg-[#faf8f5] z-[201] flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-black/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <Leaf size={16} className="text-white" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-accent">GutMantra</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-accent" />
                </button>
              </div>

              {/* Search bar */}
              <div className="px-4 pt-4 pb-2">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
                  className="w-full flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-black/8 shadow-sm text-left"
                >
                  <Search size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-accent/40 font-medium">Search products...</span>
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent/30 px-2 py-3">
                  Menu
                </p>

                {/* Home */}
                <NavLink
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl mb-1 font-bold text-sm transition-all",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "hover:bg-white text-accent"
                    )
                  }
                >
                  Home
                  <ChevronRight size={16} className="opacity-50" />
                </NavLink>

                {/* Category links */}
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="mb-1">
                    <button
                      onClick={() => {
                        navigate(`/${getRoute(cat.slug)}`);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl font-bold text-sm text-accent hover:bg-white transition-all group"
                    >
                      {cat.name}
                      <ChevronRight
                        size={16}
                        className="opacity-50 group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>

                    {cat.subcategories?.map((sub) => (
                      <button
                        key={sub.slug}
                        onClick={() => {
                          navigate(`/${getRoute(cat.slug)}/${sub.slug}`);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 pl-9 text-[13px] font-semibold text-accent/50 hover:text-primary transition-colors"
                      >
                        <div className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Our Story */}
                <NavLink
                  to="/our-story"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl mb-1 font-bold text-sm transition-all",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "hover:bg-white text-accent"
                    )
                  }
                >
                  Our Story
                  <ChevronRight size={16} className="opacity-50" />
                </NavLink>

                {/* Profile — logged-in only */}
                {user && (
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl mb-1 font-bold text-sm transition-all",
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "hover:bg-white text-accent"
                      )
                    }
                  >
                    My Profile
                    <ChevronRight size={16} className="opacity-50" />
                  </NavLink>
                )}
              </nav>

              {/* Drawer footer — user / login */}
              <div className="px-4 py-4 border-t border-black/5 bg-white">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {getUserInitials(getDisplayName(userData, user))}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{getDisplayName(userData, user)}</p>
                      <button
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-red-500"
                      >
                        Sign Out
                      </button>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { navigate("/admin"); setIsMobileMenuOpen(false); }}
                        className="p-2 rounded-xl bg-primary/10 text-primary"
                      >
                        <LayoutDashboard size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-xs"
                  >
                    Get Started
                    <ChevronRight size={16} />
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
        sessionExpired={sessionExpired}
      />
    </>
  );
}