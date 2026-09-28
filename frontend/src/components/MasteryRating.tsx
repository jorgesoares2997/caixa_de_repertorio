"use client";

import { motion } from "framer-motion";

export function MasteryRating({ 
  level, 
  onChange 
}: { 
  level: number; 
  onChange: (level: number) => void;
}) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3, 4, 5].map((val) => {
        const isActive = val <= level;
        
        // Define color based on level logic
        let bgClass = "bg-muted border-transparent";
        if (isActive) {
          if (level === 1) bgClass = "bg-accent-orange border-ink shadow-[1px_1px_0px_#161616]";
          else if (level >= 2 && level <= 4) bgClass = "bg-ink text-surface border-ink shadow-[1px_1px_0px_#161616]";
          else if (level === 5) bgClass = "bg-accent-lime border-ink shadow-[1px_1px_0px_#161616]";
        }

        return (
          <motion.button
            key={val}
            onClick={() => onChange(val)}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-6 h-8 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${bgClass}`}
          >
            {/* Optional: Add small inner dots or lines for texture, but simple solid blocks look great too */}
            <span className="sr-only">Nível {val}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
