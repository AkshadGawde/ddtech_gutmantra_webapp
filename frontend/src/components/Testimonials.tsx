import { motion, AnimatePresence } from "motion/react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collectionGroup, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const FALLBACK = [
  {
    name: "Anjali Deshpande",
    role: "Home Maker, Kothrud",
    content: "The Sharbati Atta from GutMantra is a game changer. My rotis stay soft for hours, and the taste is exactly like what we used to get in our village.",
    image: "https://i.pravatar.cc/100?img=32",
  },
  {
    name: "Rahul Mehta",
    role: "Fitness Enthusiast",
    content: "I've been using their Wood Pressed Groundnut Oil for 6 months now. The aroma is incredible, and knowing it's pure and chemical-free gives me peace of mind.",
    image: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Priya Kulkarni",
    role: "Working Professional",
    content: "Their handmade spices are so potent! You only need a little bit to get that authentic Maharashtrian flavor. Highly recommend the Turmeric powder.",
    image: "https://i.pravatar.cc/100?img=44",
  },
  {
    name: "Sneha Joshi",
    role: "Home Chef, Baner",
    content: "GutMantra's cold pressed coconut oil has transformed my cooking. The purity is unmatched and you can literally smell the difference from store-bought brands.",
    image: "https://i.pravatar.cc/100?img=47",
  },
  {
    name: "Vinod Patil",
    role: "Retired Teacher, Hadapsar",
    content: "I switched to GutMantra's multigrain atta on my doctor's advice. My sugar levels have stabilised and rotis taste so much better than packaged flour.",
    image: "https://i.pravatar.cc/100?img=52",
  },
  {
    name: "Meera Kadam",
    role: "Nutritionist, Pune",
    content: "I recommend GutMantra to all my clients. Stone-ground, fresh, no additives — exactly what traditional Indian cooking needs to stay healthy.",
    image: "https://i.pravatar.cc/100?img=25",
  },
];

interface TestimonialItem {
  name: string;
  role: string;
  content: string;
  image: string;
}

export default function Testimonials() {
  const [items, setItems] = useState<TestimonialItem[]>(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  // Fetch up to 6 reviews from any product's reviews subcollection
  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collectionGroup(db, "reviews"), orderBy("createdAt", "desc"), limit(6));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setItems(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                name: data.customerName || "Customer",
                role: data.productName || "Verified Buyer",
                content: data.reviewText || "",
                image: `https://i.pravatar.cc/100?u=${d.id}`,
              };
            })
          );
        }
      } catch {
        // keep fallback
      }
    };
    fetch();
  }, []);

  const total = items.length;

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  // Auto-advance every 4s
  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  // Get 3 consecutive items starting at `current`
  const visible = Array.from({ length: 3 }, (_, i) => items[(current + i) % total]);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-6"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Customer Stories</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter"
          >
            Trusted by <span className="text-secondary italic font-serif font-normal">Pune Families</span>.
          </motion.h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Cards — show 1 on mobile, 3 on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-hidden">
            {visible.map((t, i) => (
              <AnimatePresence key={`${current}-${i}`} mode="wait">
                <motion.div
                  initial={{ opacity: 0, x: direction * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -60 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className={`p-10 rounded-[2.5rem] bg-bg-warm relative border border-black/5 hover:shadow-xl transition-all duration-500 group ${i > 0 ? "hidden md:block" : ""}`}
                >
                  <Quote className="absolute top-8 right-8 text-secondary/10 w-16 h-16 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />

                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={14} className="fill-secondary text-secondary" />
                    ))}
                  </div>

                  <p className="text-lg font-medium text-accent/80 mb-8 leading-relaxed italic">
                    "{t.content}"
                  </p>

                  <div className="flex items-center gap-4 pt-6 border-t border-black/5">
                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-accent">{t.name}</h4>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-black/15 hover:bg-black/30"}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
