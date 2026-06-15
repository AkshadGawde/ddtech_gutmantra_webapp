import { motion } from "motion/react";
import { Leaf, Award, Heart, Users } from "lucide-react";

export default function BrandStory() {
  return (
    <section className="py-24 bg-bg-warm overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://res.cloudinary.com/dk7ynv44a/image/upload/v1779984052/htvkyqrq2n3c4oj6o2qr.png" 
                alt="Our Heritage" 
                className="w-full h-[600px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12 text-white">
                <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-80">Est. 2022</p>
                <h3 className="text-4xl font-bold tracking-tighter leading-tight">
                  Rooted in Tradition, <br />
                  <span className="italic font-serif font-normal">Crafted for Health</span>.
                </h3>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Our Story</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight"
            >
             The Heart of <span className="italic font-serif font-normal">
<br/>
  <span className="text-orange-500">G</span>
  <span className="text-black">ut</span>
  <span className="text-green-600">Man</span>
  <span className="text-black">tra</span>
</span> 
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-accent/70 mb-10 leading-relaxed font-medium"
            >
              GutMantra was born from a simple realization: the modern kitchen has lost its connection to true nutrition. In our quest for convenience, we sacrificed the slow, traditional methods that made our ancestors' food so wholesome.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { 
                  title: "Stone Ground", 
                  desc: "We use traditional stone mills to grind our flour, preserving the vital nutrients and natural oils.",
                  icon: <Leaf className="text-primary" size={24} />
                },
                { 
                  title: "Pure & Honest", 
                  desc: "No additives, no preservatives, and no hidden chemicals. Just pure, honest food.",
                  icon: <Award className="text-secondary" size={24} />
                },
                { 
                  title: "Community First", 
                  desc: "We source directly from local farmers in Madhya Pradesh, ensuring fair prices and fresh produce.",
                  icon: <Users className="text-accent" size={24} />
                },
                { 
                  title: "Made with Love", 
                  desc: "Every batch is hand-checked and packed with care in our Pune facility.",
                  icon: <Heart className="text-primary" size={24} />
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-sm text-accent/50 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-12 p-8 bg-white rounded-3xl border border-black/5 shadow-sm"
            >
              <h4 className="text-xl font-bold mb-4">Our Commitment to Pune</h4>
              <p className="text-sm text-accent/60 leading-relaxed font-medium">
                GutMantra isn't just a business; it's a movement to bring back the "Ghar ka Khana" feeling. We understand the busy lives of Pune's families, and we're here to ensure that even in a fast-paced world, your health never takes a backseat. From the fields of Sehore to your doorstep in Dhanori, Charoli or Hadapsar, we maintain a strict cold-chain and hygiene protocol.
              </p>
            </motion.div>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/10">
                <h5 className="font-bold text-secondary mb-2">500+</h5>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Happy Families</p>
              </div>
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <h5 className="font-bold text-primary mb-2">100%</h5>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Chemical Free</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
