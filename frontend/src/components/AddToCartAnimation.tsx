import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag } from "lucide-react";

interface FlyingItem {
  id: number;
  x: number;
  y: number;
}

export default function AddToCartAnimation() {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const trigger = useCallback((x: number, y: number) => {
    const id = Date.now();
    setFlyingItems(prev => [...prev, { id, x, y }]);
    
    // Remove after animation
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== id));
    }, 1000);
  }, []);

  // Expose trigger to window for global access (simplest for this use case)
  useEffect(() => {
    (window as any).triggerAddToCartAnimation = trigger;
    return () => {
      delete (window as any).triggerAddToCartAnimation;
    };
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      <AnimatePresence>
        {flyingItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ 
              x: item.x - 20, 
              y: item.y - 20, 
              scale: 1, 
              opacity: 1,
              rotate: 0 
            }}
            animate={{ 
              x: window.innerWidth - 60, // Approximate cart position
              y: 20, 
              scale: 0.2, 
              opacity: 0,
              rotate: 360 
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.34, 1.56, 0.64, 1] 
            }}
            className="fixed w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <ShoppingBag size={20} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
