import { motion } from "motion/react";
import { Instagram, Play, Heart, MessageCircle, Share2 } from "lucide-react";

interface SocialReelProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function SocialReel({ onNavigate }: SocialReelProps) {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 text-center md:text-left">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full mb-6"
            >
              <Instagram size={16} className="text-pink-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600">Follow us @GutMantra</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tighter"
            >
              See us in <span className="text-primary italic font-serif font-normal">Action</span>.
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-accent/60 max-w-sm font-medium"
          >
            Join our community on Instagram for daily recipes, mill tours, and health tips.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Main Reel Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative group aspect-[9/16] max-w-[400px] mx-auto w-full bg-black rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-close-up-of-flour-being-poured-into-a-bowl-4245-large.mp4" type="video/mp4" />
            </video>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Reel UI Overlay */}
            <div className="absolute bottom-10 left-8 right-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=5" alt="GutMantra" />
                </div>
                <div>
                  <p className="font-bold text-sm">gutmantra_store</p>
                  <p className="text-[10px] opacity-70">Original Audio</p>
                </div>
                <button className="ml-auto px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  Follow
                </button>
              </div>
              <p className="text-sm font-medium mb-4 line-clamp-2">
                Freshly stone-ground Sharbati Atta being prepared for our morning deliveries! 🌾✨ #GutMantra #FreshFlour #PuneEats
              </p>
            </div>

            <div className="absolute right-6 bottom-32 flex flex-col gap-6 text-white">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                  <Heart size={20} fill="white" />
                </div>
                <span className="text-[10px] font-bold">1.2k</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <span className="text-[10px] font-bold">45</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
                  <Share2 size={20} />
                </div>
                <span className="text-[10px] font-bold">128</span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <Play size={40} className="text-white fill-white ml-2" />
              </div>
            </div>
          </motion.div>

          {/* Side Content */}
          <div className="flex flex-col gap-12">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2.5rem] bg-bg-warm border border-black/5"
            >
              <h3 className="text-2xl font-bold mb-4">Why we do what we do?</h3>
              <p className="text-accent/60 font-medium leading-relaxed">
                "We believe that the journey of food from the farm to your table should be transparent, natural, and filled with the same care you'd give your own family."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold italic font-serif">G</div>
                <span className="font-bold text-sm tracking-tight">Founder, GutMantra</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              {[
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
                "https://images.unsplash.com/photo-1596040033229-a9821ebe058d?auto=format&fit=crop&q=80&w=400"
              ].map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="aspect-square rounded-[2rem] overflow-hidden border border-black/5"
                >
                  <img src={img} alt="Social" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
