"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function StickerPillButton({ 
  children, 
  onClick, 
  className,
  type = "button",
  variant = "lime",
  icon
}: { 
  children: ReactNode; 
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: "lime" | "orange" | "lavender" | "cherry" | "white" | "dark";
  icon?: ReactNode;
}) {
  const variantStyles = {
    lime: "bg-accent-lime text-ink",
    orange: "bg-accent-orange text-surface",
    lavender: "bg-accent-lavender text-ink",
    cherry: "bg-accent-cherry text-surface",
    white: "bg-surface text-ink",
    dark: "bg-ink text-surface"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      className={twMerge(
        "relative inline-flex items-center justify-between gap-3 border-2 border-ink rounded-xl py-2 px-4 shadow-neo cursor-pointer transition-all font-[family-name:var(--font-dm-sans)] font-bold text-xs md:text-sm uppercase tracking-wider select-none",
        variantStyles[variant] || variantStyles.lime,
        className
      )}
    >
      <span className="flex items-center gap-2 leading-none whitespace-nowrap">
        {children}
      </span>

      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-ink text-surface flex items-center justify-center shrink-0 shadow-sm">
        {icon || <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-surface" />}
      </span>
    </motion.button>
  );
}

