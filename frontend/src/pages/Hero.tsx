import { motion } from "motion/react";
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from "lucide-react";

interface HeroProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden bg-bg-warm">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-secondary/5 skew-x-12 transform origin-bottom-left" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-black/5 rounded-full mb-6">
            <Sparkles size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Pune's Finest Flour Mill</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] sm:leading-[0.9] mb-6 tracking-tighter">
            Pure <span className="text-primary italic font-serif font-normal">Nutrition</span>, <br />
            Traditional <span className="text-secondary italic font-serif font-normal">Taste</span>.
          </h1>

          <p className="text-base sm:text-lg text-accent/70 max-w-lg mb-8 sm:mb-10 leading-relaxed font-medium">
            GutMantra brings the ancient wisdom of stone-ground flours and cold-pressed oils to your modern Pune home. We believe in slow food, pure ingredients, and the honest taste of nature.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
            <button 
              onClick={() => onNavigate("category", { category: "atta" })}
              className="px-8 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group text-xs"
            >
              Explore Shop
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white text-accent border border-black/10 rounded-full font-bold uppercase tracking-widest hover:bg-black/5 transition-all text-xs">
              Our Story
            </button>
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
              <source src="https://assets.mixkit.co/videos/preview/mixkit-close-up-of-flour-being-poured-into-a-bowl-4245-large.mp4" type="video/mp4" />
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

          {/* Floating badges */}
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
  );
}
