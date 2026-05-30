import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function CategorySection({ onNavigate }: CategorySectionProps) {
  return (
    <section id="categories" className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-6"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Our Collections</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tighter"
            >
              Curated for your <span className="text-secondary italic font-serif font-normal">Gut Health</span>
            </motion.h2>
          </div>
          {/* <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-accent/60 max-w-sm font-medium"
          >
            From stone-ground flours to wood-pressed oils, every GutMantra product is a testament to our commitment to Pune's health and traditional Maharashtrian flavors.
          </motion.p> */}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => onNavigate("category", { category: category.slug })}
              className={cn(
                "group relative h-[380px] rounded-[2.5rem] overflow-hidden cursor-pointer",
                category.color
              )}
            >
              {/* ... video/img content remains same ... */}
              {index === 0 ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 mix-blend-multiply"
                >
                  <source src="https://res.cloudinary.com/dk7ynv44a/video/upload/v1779798078/oubimsrhhxormiyywzof.mp4" type="video/mp4" />
                </video>
              ) : index === 1 ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 mix-blend-multiply"
                >
                  <source src="https://res.cloudinary.com/dk7ynv44a/video/upload/v1779975657/ndd4wv5lzjjwpucsvjaq.mp4" type="video/mp4" />
                </video>
              ) : index === 2 ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 mix-blend-multiply"
                >
                  <source src="https://res.cloudinary.com/dk7ynv44a/video/upload/v1779975742/bjufcpmb0btaceussr8q.mp4" type="video/mp4" />
                </video>
              ) : (
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8">
                <h3 className="text-3xl font-bold text-white mb-3 leading-none tracking-tighter">{category.name}</h3>
                <p className="text-white/70 text-base mb-6 max-w-[200px] leading-snug font-medium">{category.description}</p>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight size={20} />
                </div>
              </div>

              <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 glass rounded-full flex items-center justify-center text-white">
                  <span className="text-xs font-bold uppercase tracking-widest">Shop</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
