"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function StickerPillButton({ 
  children, 
  onClick, 
  className,
  type = "button"
}: { 
  children: ReactNode; 
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={twMerge(
        "relative flex items-center gap-4 bg-accent-lime border-2 border-ink rounded-xl p-1.5 pl-5 pr-1.5 shadow-neo cursor-pointer overflow-hidden group hover:-translate-y-0.5 active:translate-y-0 transition-transform",
        className
      )}
      whileHover="hover"
      initial="initial"
    >
      <div className="relative z-10 flex-1 overflow-hidden h-5 flex items-center">
        <motion.div 
          className="absolute inset-0 flex items-center font-bold text-ink uppercase tracking-wider text-sm font-[family-name:var(--font-dm-sans)]"
          variants={{
            initial: { y: 0 },
            hover: { y: "-100%" }
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 flex items-center font-bold text-ink uppercase tracking-wider text-sm font-[family-name:var(--font-dm-sans)]"
          variants={{
            initial: { y: "100%" },
            hover: { y: 0 }
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>

      <div className="relative z-10 w-8 h-8 rounded-full bg-ink flex items-center justify-center text-surface shrink-0">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
