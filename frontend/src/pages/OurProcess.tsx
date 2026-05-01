import { motion } from "motion/react";
import { Search, Cog, ShieldCheck, Truck } from "lucide-react";

const steps = [
  {
    title: "Sourcing",
    desc: "We hand-select premium grains directly from Sehore and local farms.",
    icon: <Search size={24} />,
    color: "bg-orange-50 text-primary"
  },
  {
    title: "Stone Grinding",
    desc: "Grains are ground slowly in stone mills to keep nutrients intact.",
    icon: <Cog size={24} />,
    color: "bg-green-50 text-secondary"
  },
  {
    title: "Quality Check",
    desc: "Every batch undergoes strict testing for purity and texture.",
    icon: <ShieldCheck size={24} />,
    color: "bg-amber-50 text-accent"
  },
  {
    title: "Fresh Delivery",
    desc: "Packed with care and delivered fresh to your doorstep in Pune.",
    icon: <Truck size={24} />,
    color: "bg-blue-50 text-blue-600"
  }
];

export default function OurProcess() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">How it works</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter"
          >
            The <span className="text-primary italic font-serif font-normal">GutMantra</span> Process.
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-black/5 -translate-y-12" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div className={`w-20 h-20 ${step.color} rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                {step.icon}
              </div>
              <div className="w-8 h-8 bg-white border border-black/5 rounded-full flex items-center justify-center text-xs font-bold mb-4 shadow-sm">
                {i + 1}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-accent/50 font-medium leading-relaxed max-w-[200px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
