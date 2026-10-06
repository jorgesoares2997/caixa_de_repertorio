"use client";

import { useEffect, useState } from "react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { DailyPracticeModal } from "@/components/DailyPracticeModal";
import { Calendar, Flame, Users, Music2, Mail, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function Dashboard() {
  const stats = useAppStore((state) => state.stats);
  const fetchStats = useAppStore((state) => state.fetchStats);
  const fetchSongs = useAppStore((state) => state.fetchSongs);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);
  const representatives = useAppStore((state) => state.representatives);

  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSongs();
    fetchRepresentatives();
  }, [fetchStats, fetchSongs, fetchRepresentatives]);

  return (
    <div className="flex flex-col gap-14 md:gap-20 font-sans animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16">

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-4">
        <div className="inline-flex items-center gap-2 bg-accent-orange text-surface font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-6 border-2 border-ink -rotate-2 shadow-neo font-[family-name:var(--font-dm-sans)]">
          <Sparkles className="w-3.5 h-3.5" /> Sistema Central de Gigs & Repertório
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.2rem] font-black uppercase tracking-tight text-ink mb-6 leading-[0.95] font-[family-name:var(--font-oswald)]">
          Seu repertório na <br className="hidden md:block" /> ponta dos dedos, <br className="hidden md:block" /> sem perder nenhum tom.
        </h1>

        <p className="text-lg md:text-xl text-dim max-w-2xl mb-10 font-[family-name:var(--font-inter)] leading-relaxed">
          Gerencie acervos, vincule repertório exclusivo a cada cantor, estude diariamente com rotinas inteligentes e gere setlists prontas.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <StickerPillButton
            variant="lime"
            onClick={() => window.location.href = "/songs"}
            icon={<Music2 className="w-4 h-4 text-surface" />}
          >
            Acessar o Acervo Completo
          </StickerPillButton>

          <StickerPillButton
            variant="orange"
            onClick={() => setIsPracticeOpen(true)}
            icon={<Flame className="w-4 h-4 text-surface fill-surface" />}
          >
            Estudo Diário de Hoje
          </StickerPillButton>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto w-full">
        <MetricCard
          title="Obras Únicas"
          value={stats ? String(stats.totalSongs) : "—"}
          suffix="Músicas no Acervo"
          rotate="-rotate-2"
        />
        <MetricCard
          title="Artistas & Projetos"
          value={representatives.length > 0 ? String(representatives.length) : "6"}
          suffix="Projetos Ativos"
          rotate="rotate-2"
        />
        <MetricCard
          title="Domínio Nível 5"
          value={stats ? String(stats.level5Songs) : "—"}
          suffix="Faixas Prontas"
          rotate="-rotate-1"
        />
        <MetricCard
          title="Próximo Show"
          value={stats?.nextGigTitle ? stats.nextGigTitle.split(" ").slice(0, 2).join(" ") : "Nenhum"}
          suffix={stats?.nextGigDate ?? "—"}
          rotate="rotate-1"
        />
      </section>

      {/* Daily Study Routine Callout Banner */}
      <section className="px-4 max-w-6xl mx-auto w-full">
        <div className="bg-accent-lime rounded-3xl p-6 md:p-8 border-2 border-ink shadow-neo flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ink text-accent-lime border-2 border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#161616]">
              <Flame className="w-8 h-8 fill-accent-lime" />
            </div>
            <div>
              <div className="inline-block bg-ink text-surface px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 font-[family-name:var(--font-dm-sans)]">
                Algoritmo de Retenção
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                Rotina de Estudo Diário por E-mail
              </h3>
              <p className="text-xs md:text-sm text-ink/80 font-semibold mt-0.5">
                Receba automaticamente 5 músicas selecionadas para praticar (2 aprendizado, 2 consolidação, 1 manutenção).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <StickerPillButton
              variant="cherry"
              onClick={() => setIsPracticeOpen(true)}
              className="w-full md:w-auto justify-center"
              icon={<Mail className="w-4 h-4 text-surface" />}
            >
              Ver Sessão & Disparar
            </StickerPillButton>
          </div>
        </div>
      </section>

      {/* Special Gig Banner */}
      <section className="px-4 max-w-6xl mx-auto w-full">
        <div className="bg-ink rounded-3xl p-8 md:p-12 text-surface flex flex-col lg:flex-row items-center justify-between border-2 border-ink shadow-neo relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-cherry rounded-full blur-[80px] opacity-60 pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-lavender rounded-full blur-[100px] opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-lg mb-10 lg:mb-0">
            <div className="inline-block bg-accent-lavender text-ink font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full mb-6 font-[family-name:var(--font-dm-sans)]">
              {stats?.nextGigTitle ? "Próximo Show" : "Audição do Dia"}
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 font-[family-name:var(--font-oswald)]">
              {stats?.nextGigTitle ?? "Sessão Soul & MPB"}
            </h2>
            <p className="text-surface/80 text-lg leading-relaxed">
              {stats?.nextGigVenue
                ? `📍 ${stats.nextGigVenue}${stats.nextGigDate ? ` · ${stats.nextGigDate}` : ""}`
                : "Revise o repertório de Stevie Wonder e Djavan para o próximo show. Mantenha os grooves afiados!"}
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-4 w-full lg:w-auto min-w-[280px]">
            <div className="bg-surface text-ink px-6 py-5 rounded-2xl border-2 border-ink flex items-center justify-between gap-8 font-[family-name:var(--font-inter)] shadow-neo rotate-1 hover:-translate-y-1 transition-transform">
              <div>
                <p className="font-black text-xl mb-1">Superstition</p>
                <p className="text-sm text-dim font-medium">Stevie Wonder</p>
              </div>
              <div className="font-bold text-accent-cherry bg-accent-cherry/10 border border-accent-cherry/20 px-3 py-1.5 rounded-lg text-lg font-[family-name:var(--font-oswald)]">Ebm</div>
            </div>
            <div className="bg-surface text-ink px-6 py-5 rounded-2xl border-2 border-ink flex items-center justify-between gap-8 font-[family-name:var(--font-inter)] shadow-neo lg:ml-8 -rotate-2 hover:-translate-y-1 transition-transform">
              <div>
                <p className="font-black text-xl mb-1">Sina</p>
                <p className="text-sm text-dim font-medium">Djavan</p>
              </div>
              <div className="font-bold text-accent-orange bg-accent-orange/10 border border-accent-orange/20 px-3 py-1.5 rounded-lg text-lg font-[family-name:var(--font-oswald)]">G</div>
            </div>
            <StickerPillButton onClick={() => window.location.href = "/gigs/new"}>
              <Calendar className="w-4 h-4 mr-1 inline" /> Criar Novo Show
            </StickerPillButton>
          </div>
        </div>
      </section>

      {/* Modal: Estudo Diário */}
      <DailyPracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
      />
    </div>
  );
}

function MetricCard({ title, value, suffix, rotate }: { title: string; value: string; suffix: string; rotate: string }) {
  return (
    <div className={`bg-surface border-2 border-ink p-6 rounded-2xl shadow-neo flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 ${rotate}`}>
      <h3 className="text-xs font-bold uppercase tracking-widest text-dim font-[family-name:var(--font-dm-sans)] mb-3">{title}</h3>
      <div className="text-5xl font-black text-ink font-[family-name:var(--font-oswald)] mb-1 truncate max-w-full">{value}</div>
      <div className="text-xs font-bold text-accent-orange uppercase tracking-wider font-[family-name:var(--font-dm-sans)] truncate max-w-full">{suffix}</div>
    </div>
  );
}
