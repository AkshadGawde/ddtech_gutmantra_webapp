import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface EC2LoadingScreenProps {
  seconds: number;
  onComplete: () => void;
}

export default function EC2LoadingScreen({ seconds, onComplete }: EC2LoadingScreenProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center px-8"
    >
      {/* Animated server icon */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10 text-primary"
        >
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <rect x="2" y="10" width="20" height="5" rx="1" />
          <rect x="2" y="17" width="20" height="5" rx="1" />
          <circle cx="6" cy="5.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="6" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="6" cy="19.5" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Starting your session
      </h2>
      <p className="text-gray-500 text-sm text-center mb-8 max-w-xs">
        Our server is waking up just for you. This usually takes about {seconds} seconds.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
          <span>Server booting…</span>
          <span className="text-primary">{remaining}s</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2 mt-10">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.span
            key={delay}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
