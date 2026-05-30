import { motion } from "motion/react";
import { Leaf, ShieldCheck, Truck, Sparkles, ArrowRight, Wheat, Droplets } from "lucide-react";
import { NavLink } from "react-router-dom";

const PILLARS = [
  {
    icon: <Wheat size={22} />,
    bg: "bg-orange-50",
    iconColor: "text-primary",
    accent: "border-primary/20",
    title: "Finest Grain Quality",
    body: "Sourced, milled, and tested every batch for unmatched texture and nutrition.",
  },
  {
    icon: <Leaf size={22} />,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    accent: "border-amber-200",
    title: "Traditional Stone Grinding",
    body: "Slow, low-temperature stone grinding preserves nutrients modern mills destroy.",
  },
  {
    icon: <Truck size={22} />,
    bg: "bg-green-50",
    iconColor: "text-secondary",
    accent: "border-secondary/20",
    title: "Doorstep Delivery",
    body: "Premium flour delivered fresh to your home — zero effort, pure nutrition.",
  },
  {
    icon: <ShieldCheck size={22} />,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    accent: "border-blue-200",
    title: "Guaranteed Freshness",
    body: "Every pack is sealed and delivered at peak freshness — cook with confidence.",
  },
  {
    icon: <Droplets size={22} />,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accent: "border-emerald-200",
    title: "Cold-Pressed Oils",
    body: "Extracted without heat — full nutrients, rich color, and natural taste intact.",
  },
];

const FEATURES = [
  {
    title: "No Compromise In Grain Quality",
    color: "text-primary",
    body1: "When it comes to grain quality, there's simply no comparison. Our flour stands out for its exceptional texture, consistent freshness, and superior nutritional value. Sourced from the finest grains, meticulously milled, and rigorously tested, our products ensure the highest standards of quality in every batch.",
    body2: "Whether you're making Fulka, Chapati, Rotis, or crafting gourmet dishes, trust our flour to deliver unmatched results every time.",
    img: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779797272/u9ursrutcvgpeh8wapm4.png",
    imgFirst: true,
  },
  {
    title: "Traditional Stone Grinding",
    color: "text-secondary",
    body1: "Traditional stone grinding holds a special place in our flour milling process. By using age-old techniques with natural stones, we ensure that our grains are ground slowly and at low temperatures, preserving the essential nutrients and flavors.",
    body2: "Unlike modern, high-speed mills, stone grinding prevents the loss of vitamins and minerals — providing flour that is not only healthier but richer in taste and texture.",
    img: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779797844/mcbjonldlewd0pei18zv.png",
    imgFirst: false,
  },
  {
    title: "Doorstep Delivery",
    color: "text-primary",
    body1: "We understand the importance of convenience and quality. Our doorstep delivery service ensures that you receive our premium, health-focused flours directly to your home, saving you time and effort.",
    body2: "With just a few clicks, nutrient-rich flours are delivered right to your doorstep — allowing you to enjoy carefully sourced grains without any hassle.",
    img: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779797844/ikpfhvcm14hsx8itfmkt.png",
    imgFirst: true,
  },
];

export default function OurStory() {
  return (
    <div className="min-h-screen bg-bg-warm pt-[104px] pb-0">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-bg-warm to-secondary/8 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
          >
            <Sparkles size={13} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Our Story</span>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 leading-[1.05]"
              >
                Food for{" "}
                <span className="text-primary italic font-serif font-normal">Soul</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-accent/70 leading-relaxed mb-8 max-w-lg"
              >
                Do you miss the great taste of roti and chappatis your mom used to prepare? She always ensured the best grains — neatly cleaned and ground in traditional stone chakkis before making it to the kitchen.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-accent/60 leading-relaxed mb-10"
              >
                Understanding this missing link, we established GutMantra to bring back the nutrition and taste each of us relishes — bridging authentic tradition with modern convenience.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-8 border-t border-black/8 pt-8"
              >
                {[
                  { val: "500+", label: "Happy Families" },
                  { val: "100%", label: "Natural" },
                  { val: "Daily", label: "Fresh Ground" },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-primary">{val}</p>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-accent/40">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px]"
            >
              <img
                src="https://res.cloudinary.com/dk7ynv44a/image/upload/v1779797283/ooogfdudi56zxwlpfx86.jpg"
                alt="GutMantra — Our Story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Pune's Finest Flour Mill</p>
                    <p className="text-white/60 text-xs">Stone-ground. Cold-pressed. Pure.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why GutMantra ────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Our Philosophy</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-3">
              Why Choose <span className="text-primary italic font-serif font-normal">GutMantra?</span>
            </h2>
            <p className="text-accent/50 text-base max-w-xl mx-auto">
              Healthy living begins with wholesome eating — pure, nourishing grain products, always.
            </p>
          </div>

          {/* Pillars grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`flex items-start gap-4 bg-bg-warm rounded-2xl p-5 border ${p.accent} hover:shadow-md transition-all group`}
              >
                <div className={`w-11 h-11 flex-shrink-0 ${p.bg} ${p.iconColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-accent mb-1">{p.title}</h3>
                  <p className="text-xs text-accent/50 leading-relaxed">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Feature Deep Dives ───────────────────────────────────────────── */}
      <section className="py-20 bg-bg-warm">
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className={`grid md:grid-cols-2 gap-14 items-center ${!f.imgFirst ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Image */}
              <div className="rounded-3xl overflow-hidden shadow-xl h-80">
                <img
                  src={f.img}
                  alt={f.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Text */}
              <div>
                <h3 className={`text-3xl font-bold tracking-tighter mb-5 ${f.color}`}>{f.title}</h3>
                <p className="text-accent/70 leading-relaxed mb-4">{f.body1}</p>
                <p className="text-accent/55 leading-relaxed">{f.body2}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden"
      >
        <div className="bg-gradient-to-br from-primary to-amber-500 py-20 px-6">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
              <Sparkles size={13} className="text-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Join the Movement</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-5">
              Join Our Growing{" "}
              <span className="italic font-serif font-normal">Community</span>
            </h2>
            <p className="text-white/85 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Be part of 5,000+ families in Pune who have rediscovered the joy of authentic, stone-ground nutrition delivered to their doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink
                to="/"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white text-primary font-bold rounded-full hover:bg-gray-50 transition-all shadow-xl shadow-black/20 text-sm uppercase tracking-widest group"
              >
                Start Shopping
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </NavLink>
              <NavLink
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white/15 text-white border border-white/30 font-bold rounded-full hover:bg-white/25 transition-all text-sm uppercase tracking-widest"
              >
                Contact Us
              </NavLink>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </motion.section>

    </div>
  );
}
