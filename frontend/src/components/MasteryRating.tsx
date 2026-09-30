"use client";

import { motion } from "framer-motion";

export function MasteryRating({ 
  level, 
  onChange,
  readOnly = false,
  size = "md"
}: { 
  level: number; 
  onChange?: (level: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const levelDescriptions = [
    "1: Aprendendo / Estrutura básica",
    "2: Em ensaio / Decorando",
    "3: Toca com cifra / Seguro",
    "4: Muito seguro / De cor",
    "5: 100% Dominado / Pronto para palco"
  ];

  const sizeClasses = size === "sm" ? "w-5 h-6 text-[10px]" : "w-6 h-7 text-xs";

  return (
    <div className="flex gap-1 items-center" title={`Domínio: ${level || 0}/5 - ${levelDescriptions[(level || 1) - 1] || ""}`}>
      {[1, 2, 3, 4, 5].map((val) => {
        const isActive = val <= level;
        
        let bgClass = "bg-muted/70 text-dim/50 border-ink/20 hover:border-ink";
        if (isActive) {
          if (level === 1) bgClass = "bg-accent-orange text-surface border-ink shadow-[1px_1px_0px_#161616]";
          else if (level >= 2 && level <= 4) bgClass = "bg-ink text-surface border-ink shadow-[1px_1px_0px_#161616]";
          else if (level === 5) bgClass = "bg-accent-lime text-ink border-ink shadow-[1px_1px_0px_#161616]";
        }

        if (readOnly) {
          return (
            <div
              key={val}
              className={`${sizeClasses} rounded-md border-2 font-bold font-[family-name:var(--font-oswald)] flex items-center justify-center select-none ${bgClass}`}
            >
              {val}
            </div>
          );
        }

        return (
          <motion.button
            key={val}
            type="button"
            title={levelDescriptions[val - 1]}
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(val);
            }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.92 }}
            className={`${sizeClasses} rounded-md border-2 font-bold font-[family-name:var(--font-oswald)] flex items-center justify-center transition-all cursor-pointer ${bgClass}`}
          >
            <span>{val}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

