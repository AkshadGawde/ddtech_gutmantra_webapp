import { useEffect, useCallback, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface HeroProps {
  onNavigate: (view: any, params?: any) => void;
}

// ─── Add your Cloudinary banner image URLs here ───────────────────────────────
// Recommended size: 1440×600px or 1920×700px (wide landscape banners)
const SLIDES = [
  {
    src: "",           // ← paste Cloudinary URL
    headline: "Pure Nutrition,",
    subheadline: "Traditional Taste.",
    description: "Stone-ground flours & cold-pressed oils, delivered fresh to your Pune home.",
    cta: "Shop Atta",
    ctaCategory: "atta",
    badge: "Sharbati Atta",
    badgeSub: "Stone-ground daily",
  },
  {
    src: "",           // ← paste Cloudinary URL
    headline: "Cold-Pressed",
    subheadline: "Pure Oils.",
    description: "Extracted slowly without heat to preserve every drop of natural goodness.",
    cta: "Shop Oils",
    ctaCategory: "oils",
    badge: "Cold-Pressed",
    badgeSub: "Unrefined & pure",
  },
  {
    src: "",           // ← paste Cloudinary URL
    headline: "Ancient Grains,",
    subheadline: "Modern Health.",
    description: "Jowar, bajra, ragi — traditional millets ground fresh for your family.",
    cta: "Shop Millets",
    ctaCategory: "millets",
    badge: "Multigrain",
    badgeSub: "Ancient grain blend",
  },
  {
    src: "",           // ← paste Cloudinary URL
    headline: "Farm to",
    subheadline: "Your Kitchen.",
    description: "Sourced directly from trusted farms. No middlemen. No compromises.",
    cta: "Explore All",
    ctaCategory: "all",
    badge: "100% Natural",
    badgeSub: "Farm fresh always",
  },
];

const MARQUEE_TEXT =
  'Welcome to GutMantra!  🌾  New Users Alert: Use coupon code "GMFIRST" at checkout for an exclusive discount on your first order!  ✨  ';

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

  return (
    <>
      {/* ── Marquee Banner ─────────────────────────────────────────────────── */}
      <div className="w-full bg-primary overflow-hidden py-2.5">
        <div className="relative flex whitespace-nowrap">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="flex-shrink-0 text-white text-[11px] font-bold uppercase tracking-widest"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                x: {
                  duration: 32,
                  ease: "linear",
                  repeat: Infinity,
                  delay: i === 1 ? -16 : 0,
                },
              }}
              aria-hidden={i === 1}
            >
              {Array(8).fill(MARQUEE_TEXT).join("   •   ")}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP: Full-width banner carousel (md and above)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hidden md:block relative w-full overflow-hidden">
        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden w-full">
          <div className="flex">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className="flex-[0_0_100%] min-w-0 relative w-full"
                style={{ height: "clamp(420px, 55vw, 680px)" }}
              >
                {/* Background image or placeholder */}
                {slide.src ? (
                  <img
                    src={slide.src}
                    alt={slide.headline}
                    className="absolute inset-0 w-full h-full object-cover"
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
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                {/* Slide content */}
                <div className="relative z-10 h-full max-w-7xl mx-auto px-10 flex flex-col justify-center">
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
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-5">
                      <Sparkles size={13} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                        Pune's Finest Flour Mill
                      </span>
                    </div>

                    <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tighter mb-1">
                      {slide.headline}
                    </h2>
                    <h2 className="text-5xl xl:text-6xl font-bold leading-tight tracking-tighter mb-5">
                      <span className="text-primary italic font-serif font-normal">
                        {slide.subheadline}
                      </span>
                    </h2>

                    <p className="text-white/75 text-base xl:text-lg mb-8 leading-relaxed font-medium max-w-md">
                      {slide.description}
                    </p>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          onNavigate("category", { category: slide.ctaCategory })
                        }
                        className="px-7 py-3.5 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 flex items-center gap-2 group text-xs"
                      >
                        {slide.cta}
                        <ArrowRight
                          size={15}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                      <NavLink
                        to="/our-story"
                        className="px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/25 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-all text-xs"
                      >
                        Our Story
                      </NavLink>
                    </div>

                    <div className="mt-10 flex gap-8 border-t border-white/10 pt-6">
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

                {/* Bottom-right product badge */}
                <div className="absolute bottom-8 right-10 z-10">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
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

        {/* Prev / Next arrows */}
        <button
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
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

        {/* Floating quality badge */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-8 right-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-secondary/30 rounded-full flex items-center justify-center text-secondary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Quality</p>
            <p className="text-sm font-bold text-white">Certified Pure</p>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE: Original two-column layout (below md)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="block md:hidden relative min-h-[90vh] flex items-center pt-16 overflow-hidden bg-bg-warm">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-secondary/5 skew-x-12 transform origin-bottom-left" />

        <div className="max-w-7xl mx-auto px-6 grid gap-12 items-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-black/5 rounded-full mb-6">
              <Sparkles size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Pune's Finest Flour Mill
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] mb-6 tracking-tighter">
              Pure <span className="text-primary italic font-serif font-normal">Nutrition</span>,{" "}
              <br />
              Traditional{" "}
              <span className="text-secondary italic font-serif font-normal">Taste</span>.
            </h1>

            <p className="text-base text-accent/70 max-w-lg mb-8 leading-relaxed font-medium">
              GutMantra brings the ancient wisdom of stone-ground flours and cold-pressed oils to
              your modern Pune home.
            </p>

            <div className="flex flex-col items-stretch gap-4">
              <button
                onClick={() => onNavigate("category", { category: "atta" })}
                className="px-8 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group text-xs"
              >
                Explore Shop
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <NavLink
                to="/our-story"
                className="px-8 py-4 bg-white text-accent border border-black/10 rounded-full font-bold uppercase tracking-widest hover:bg-black/5 transition-all text-xs inline-flex items-center justify-center"
              >
                Our Story
              </NavLink>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-8 border-t border-black/5 pt-8">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-primary">100%</span>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Natural</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-secondary">Stone</span>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Ground</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-accent">Pune</span>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Based</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 max-w-[90%] mx-auto bg-black">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-square object-cover opacity-80"
              >
                <source
                  src="https://assets.mixkit.co/videos/preview/mixkit-close-up-of-flour-being-poured-into-a-bowl-4245-large.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">Fresh Sharbati Atta</h3>
                    <p className="text-white/70 text-sm">Stone-ground daily</p>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                    <Leaf size={24} />
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 z-20 glass p-4 rounded-2xl shadow-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Quality</p>
                <p className="text-sm font-bold">Certified Pure</p>
              </div>
            </motion.div>

            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>
    </>
  );
}