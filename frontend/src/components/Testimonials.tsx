import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Anjali Deshpande",
    role: "Home Maker, Kothrud",
    content: "The Sharbati Atta from GutMantra is a game changer. My rotis stay soft for hours, and the taste is exactly like what we used to get in our village.",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=32"
  },
  {
    name: "Rahul Mehta",
    role: "Fitness Enthusiast",
    content: "I've been using their Wood Pressed Groundnut Oil for 6 months now. The aroma is incredible, and knowing it's pure and chemical-free gives me peace of mind.",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=12"
  },
  {
    name: "Priya Kulkarni",
    role: "Working Professional",
    content: "Their handmade spices are so potent! You only need a little bit to get that authentic Maharashtrian flavor. Highly recommend the Turmeric powder.",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=44"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-bg-warm relative border border-black/5 hover:shadow-xl transition-all duration-500 group"
            >
              <Quote className="absolute top-8 right-8 text-secondary/10 w-16 h-16 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-secondary text-secondary" />
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
          ))}
        </div>
      </div>
    </section>
  );
}
