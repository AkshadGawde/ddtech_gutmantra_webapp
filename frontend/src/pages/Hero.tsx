import { useEffect, useCallback, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface HeroProps {
  onNavigate: (view: any, params?: any) => void;
}

const SLIDES = [
  {
    src: "https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_1920/v1779797272/u9ursrutcvgpeh8wapm4.png",
    headline: "Pure Nutrition,",
    subheadline: "Traditional Taste",
    description: "Stone-ground flours & cold-pressed oils, delivered fresh to your Pune home.",
    cta: "Shop Atta",
    ctaCategory: "atta",
    badge: "Sharbati Atta",
    badgeSub: "Stone-ground daily",
  },
  {
    src: "https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_1920/v1779797283/ooogfdudi56zxwlpfx86.jpg",
    headline: "Cold-Pressed",
    subheadline: "Pure Oils",
    description: "Extracted slowly without heat to preserve every drop of natural goodness.",
    cta: "Shop Oils",
    ctaCategory: "oils",
    badge: "Cold-Pressed",
    badgeSub: "Unrefined & pure",
  },
  {
    src: "https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_1920/v1779797844/mcbjonldlewd0pei18zv.png",
    headline: "Farm to",
    subheadline: "Your Kitchen",
    description: "Sourced directly from trusted farms. No middlemen. No compromises.",
    cta: "Explore All",
    ctaCategory: "all",
    badge: "100% Natural",
    badgeSub: "Farm fresh always",
  },
  {
    src: "https://res.cloudinary.com/dk7ynv44a/image/upload/f_auto,q_auto,w_1920/v1779797844/ikpfhvcm14hsx8itfmkt.png",
    headline: "Doorstep Delivery",
    subheadline: "Fresh Everyday",
    description: "Freshly ground atta, oils & spices delivered straight to your doorstep with purity, speed and traditional goodness.",
    cta: "Shop Now",
    ctaCategory: "all",
    badge: "Freshly Ground",
    badgeSub: "Delivered daily",
  },
];

const PLACEHOLDER_GRADIENTS = [
  "from-amber-900/80 via-amber-700/60 to-stone-800/80",
  "from-green-900/80 via-emerald-700/60 to-stone-800/80",
  "from-orange-900/80 via-amber-600/60 to-stone-900/80",
  "from-stone-800/80 via-amber-800/60 to-green-900/80",
];

export default function Hero({ onNavigate }: HeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Show free delivery promo toast once per session
  useEffect(() => {
    if (!sessionStorage.getItem("fd_toast_shown")) {
      const t = setTimeout(() => {
        toast("🚚 Free delivery on orders above ₹799!", {
          description: "Shop for ₹799 or more and get delivery free.",
          duration: 5000,
        });
        sessionStorage.setItem("fd_toast_shown", "1");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    /* ── Unified full-bleed carousel — works on all screen sizes ── */
    <section className="relative w-full overflow-hidden mt-[100px] md:mt-[104px]">
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden w-full">
        <div className="flex">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] min-w-0 relative w-full"
              style={{ height: "clamp(460px, 50vw, 660px)" }}
            >
              {/* Background image — object-cover, no letterboxing on any screen size */}
              {slide.src ? (
                <img
                  src={slide.src}
                  alt={slide.headline}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                      backgroundSize: "12px 12px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-24">
                    <span className="text-white/20 text-8xl font-black uppercase tracking-tighter select-none">
                      {slide.badge}
                    </span>
                  </div>
                </div>
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />

              {/* Slide content */}
              <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center">
                <motion.div
                  key={`slide-content-${i}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    selectedIndex === i
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 30 }
                  }
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  className="max-w-xl"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-4 md:mb-5">
                    <Sparkles size={13} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                      Pune's Finest Flour Mill
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tighter mb-1">
                    {slide.headline}
                  </h2>
                  <h2 className="text-3xl md:text-5xl xl:text-6xl font-bold leading-tight tracking-tighter mb-4 md:mb-5">
                    <span className="text-primary italic font-serif font-normal">
                      {slide.subheadline}
                    </span>
                  </h2>

                  <p className="text-white/75 text-sm md:text-base xl:text-lg mb-6 md:mb-8 leading-relaxed font-medium max-w-md">
                    {slide.description}
                  </p>

                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      onClick={() =>
                        onNavigate("category", { category: slide.ctaCategory })
                      }
                      className="px-5 py-3 md:px-7 md:py-3.5 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 flex items-center gap-2 group text-xs"
                    >
                      {slide.cta}
                      <ArrowRight
                        size={15}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                    <NavLink
                      to="/our-story"
                      className="hidden md:inline-flex px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/25 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-all text-xs"
                    >
                      Our Story
                    </NavLink>
                  </div>

                  {/* Stats — desktop only */}
                  <div className="hidden md:flex mt-10 gap-8 border-t border-white/10 pt-6">
                    {[
                      { val: "100%", label: "Natural" },
                      { val: "Stone", label: "Ground" },
                      { val: "Pune", label: "Based" },
                    ].map(({ val, label }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-xl font-bold text-primary">{val}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Bottom-right badge:
                  Mobile — shows current slide image as thumbnail
                  Desktop — shows leaf icon */}
              <div className="absolute bottom-10 right-4 md:bottom-8 md:right-10 z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-3 md:px-5 md:py-4 flex items-center gap-3">
                  {/* Mobile: image thumbnail of current slide */}
                  {slide.src && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 md:hidden">
                      <img
                        src={slide.src}
                        alt={slide.badge}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Desktop: leaf icon */}
                  <div className="w-10 h-10 bg-primary rounded-full hidden md:flex items-center justify-center text-white flex-shrink-0">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{slide.badge}</p>
                    <p className="text-white/60 text-xs">{slide.badgeSub}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next arrows — desktop only */}
      <button
        onClick={scrollPrev}
        aria-label="Previous slide"
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/30 transition-all"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={scrollNext}
        aria-label="Next slide"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-white/30 transition-all"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? "w-7 h-2.5 bg-white"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Floating quality badge — desktop only */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:flex absolute top-8 right-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl items-center gap-3"
      >
        <div className="w-9 h-9 bg-secondary/30 rounded-full flex items-center justify-center text-secondary">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Quality</p>
          <p className="text-sm font-bold text-white">Certified Pure</p>
        </div>
      </motion.div>

      {/* Free delivery promo pill — visible on all screen sizes including mobile */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-16 left-4 md:bottom-10 md:left-10 z-20"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-xl"
        >
          <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center text-green-300 flex-shrink-0">
            <Truck size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Free delivery</p>
            <p className="text-xs md:text-sm font-bold text-white leading-tight">Orders above ₹799</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
