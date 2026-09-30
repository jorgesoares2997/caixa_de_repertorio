"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Disc, ArrowLeft, Home, Calendar, Users, Sparkles } from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-12 relative overflow-hidden animate-in fade-in duration-700">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-orange/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-accent-lavender/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 bg-accent-cherry text-surface border-2 border-ink px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-neo mb-6 font-[family-name:var(--font-dm-sans)] -rotate-2"
      >
        <Sparkles className="w-3.5 h-3.5" /> Erro 404 • Faixa Não Encontrada
      </motion.div>

      {/* Main Illustration: Spinning Broken Vinyl Record */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Giant Number Behind */}
        <div className="text-[9rem] md:text-[14rem] font-black text-ink/10 select-none font-[family-name:var(--font-oswald)] leading-none -mb-28 md:-mb-44 tracking-tighter">
          404
        </div>

        {/* Neo-brutalist Vinyl Card */}
        <div className="relative z-10 bg-surface border-2 border-ink rounded-3xl p-6 md:p-8 shadow-neo max-w-sm mx-auto flex flex-col items-center rotate-1 hover:rotate-0 transition-transform">
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-ink border-4 border-surface shadow-[0_0_0_3px_#161616] flex items-center justify-center animate-[spin_12s_linear_infinite]">
            {/* Vinyl Grooves */}
            <div className="absolute inset-3 rounded-full border border-surface/20" />
            <div className="absolute inset-7 rounded-full border border-surface/20" />
            <div className="absolute inset-11 rounded-full border border-surface/20" />
            
            {/* Center Label */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent-orange border-2 border-ink flex items-center justify-center shadow-inner">
              <Disc className="w-6 h-6 text-surface animate-pulse" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs font-black uppercase tracking-wider text-accent-cherry bg-accent-cherry/10 border border-accent-cherry/20 px-2.5 py-1 rounded-md font-[family-name:var(--font-dm-sans)]">
              Tom Fora da Escala
            </span>
          </div>
        </div>
      </motion.div>

      {/* Text Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto space-y-3 mb-10"
      >
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
          Compasso Perdido!
        </h1>
        <p className="text-base md:text-lg text-dim font-medium leading-relaxed font-[family-name:var(--font-inter)]">
          A página ou faixa que você está procurando modulou para um tom desconhecido ou não faz parte do repertório cadastrado.
        </p>
      </motion.div>

      {/* Navigation Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-4 max-w-lg mx-auto"
      >
        <Link href="/songs">
          <StickerPillButton variant="lime" icon={<Music className="w-4 h-4 text-surface" />}>
            Ir para o Acervo
          </StickerPillButton>
        </Link>

        <Link href="/">
          <button
            type="button"
            className="flex items-center gap-2 bg-surface border-2 border-ink px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-neo font-[family-name:var(--font-dm-sans)]"
          >
            <Home className="w-4 h-4" /> Início
          </button>
        </Link>

        <Link href="/gigs">
          <button
            type="button"
            className="flex items-center gap-2 bg-surface border-2 border-ink px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-neo font-[family-name:var(--font-dm-sans)]"
          >
            <Calendar className="w-4 h-4" /> Shows
          </button>
        </Link>

        <Link href="/representatives">
          <button
            type="button"
            className="flex items-center gap-2 bg-surface border-2 border-ink px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-neo font-[family-name:var(--font-dm-sans)]"
          >
            <Users className="w-4 h-4" /> Artistas
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
