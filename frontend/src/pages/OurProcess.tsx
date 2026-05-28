import { motion } from "motion/react";
import { Search, Cog, ShieldCheck, Truck } from "lucide-react";

const steps = [
  {
    title: "Sourcing",
    desc: "We hand-select premium grains directly from Sehore and local farms.",
    icon: <Search size={26} />,
    bg: "bg-orange-50",
    iconColor: "text-primary",
    dot: "bg-primary",
  },
  {
    title: "Stone Grinding",
    desc: "Grains are ground slowly in stone mills to keep nutrients intact.",
    icon: <Cog size={26} />,
    bg: "bg-green-50",
    iconColor: "text-secondary",
    dot: "bg-secondary",
  },
  {
    title: "Quality Check",
    desc: "Every batch undergoes strict testing for purity and texture.",
    icon: <ShieldCheck size={26} />,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    dot: "bg-amber-500",
  },
  {
    title: "Fresh Delivery",
    desc: "Packed with care and delivered fresh to your doorstep in Pune.",
    icon: <Truck size={26} />,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    dot: "bg-blue-500",
  },
];

export default function OurProcess() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
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
           The <span className="italic font-serif font-normal">
  <span className="text-orange-500">G</span>
  <span className="text-black">ut</span>
  <span className="text-green-600">Man</span>
  <span className="text-black">tra</span>
</span> Process.
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative">

          {/* ── Flowing connector — desktop only ── */}
          <div className="hidden lg:block absolute top-10 left-[12%] right-[12%]">
            {/* Track */}
            <div className="absolute inset-0 h-[3px] top-0 bg-black/6 rounded-full" />
            {/* Animated gradient fill */}
            <motion.div
              className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-primary via-amber-400 to-blue-500 rounded-full"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
            />
            {/* Step markers on the line */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.38, type: "spring", stiffness: 300 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${i === 0 ? 0 : i === 3 ? 100 : i * 33.33}%` }}
              >
                <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-md ${steps[i].dot}`} />
              </motion.div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center relative z-10 group"
              >
                {/* Icon box */}
                <div
                  className={`w-20 h-20 ${step.bg} ${step.iconColor} rounded-3xl flex items-center justify-center mb-7 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}
                >
                  {step.icon}
                </div>

                {/* Step number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold mb-4 border-2 bg-white shadow-sm ${step.iconColor} border-current`}>
                  {i + 1}
                </div>

                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-accent/50 font-medium leading-relaxed max-w-[190px]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
