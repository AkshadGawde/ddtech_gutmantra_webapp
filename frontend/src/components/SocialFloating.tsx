import { motion, AnimatePresence } from "motion/react";
import { Instagram, Facebook, Twitter, MessageCircle, Share2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SocialFloating() {
  const [isOpen, setIsOpen] = useState(false);

  const socials = [
    { icon: Instagram, color: "bg-pink-600", label: "Instagram" },
    { icon: Facebook, color: "bg-blue-600", label: "Facebook" },
    { icon: Twitter, color: "bg-sky-500", label: "Twitter" },
    { icon: MessageCircle, color: "bg-green-500", label: "WhatsApp" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex flex-col gap-3 mb-2"
          >
            {socials.map((social, index) => (
              <motion.button
                key={social.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-black/10 hover:scale-110 transition-transform group relative",
                  social.color
                )}
              >
                <social.icon size={20} />
                <span className="absolute right-full mr-4 px-3 py-1 bg-white text-accent text-xs font-bold uppercase tracking-widest rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {social.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500",
          isOpen ? "bg-accent rotate-90" : "bg-primary"
        )}
      >
        {isOpen ? <X size={24} /> : <Share2 size={24} />}
      </motion.button>
    </div>
  );
}
