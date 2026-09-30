"use client";

import { useEffect } from "react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { Calendar } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Dashboard() {
  const stats = useAppStore((state) => state.stats);
  const fetchStats = useAppStore((state) => state.fetchStats);
  const fetchSongs = useAppStore((state) => state.fetchSongs);

  useEffect(() => {
    fetchStats();
    fetchSongs();
  }, [fetchStats, fetchSongs]);

  return (
    <div className="flex flex-col gap-16 md:gap-24 font-sans animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-4">
        <div className="inline-block bg-accent-orange text-surface font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-8 border-2 border-ink -rotate-2 shadow-neo font-[family-name:var(--font-dm-sans)]">
          Sistema Central de Gigs & Repertório
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tight text-ink mb-8 leading-[0.95] font-[family-name:var(--font-oswald)]">
          Seu repertório na <br className="hidden md:block" /> ponta dos dedos, <br className="hidden md:block" /> sem perder nenhum tom.
        </h1>

        <p className="text-lg md:text-xl text-dim max-w-2xl mb-12 font-[family-name:var(--font-inter)] leading-relaxed">
          Organize shows, repertório e estudos diários. Envie escalas direto no WhatsApp com 1 clique.
        </p>

        <StickerPillButton onClick={() => window.location.href = "/songs"}>
          Acessar o Acervo Completo
        </StickerPillButton>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-6xl mx-auto w-full">
        <MetricCard
          title="Obras Únicas"
          value={stats ? String(stats.totalSongs) : "—"}
          suffix="Músicas"
          rotate="-rotate-2"
        />
        <MetricCard
          title="Shows Futuros"
          value={stats ? String(stats.upcomingGigs) : "—"}
          suffix="Agendados"
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

      {/* Special Banner */}
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
              <div className="font-bold text-accent-cherry bg-accent-cherry/10 border border-accent-cherry/20 px-3 py-1.5 rounded-lg text-lg">Ebm</div>
            </div>
            <div className="bg-surface text-ink px-6 py-5 rounded-2xl border-2 border-ink flex items-center justify-between gap-8 font-[family-name:var(--font-inter)] shadow-neo lg:ml-8 -rotate-2 hover:-translate-y-1 transition-transform">
              <div>
                <p className="font-black text-xl mb-1">Sina</p>
                <p className="text-sm text-dim font-medium">Djavan</p>
              </div>
              <div className="font-bold text-accent-orange bg-accent-orange/10 border border-accent-orange/20 px-3 py-1.5 rounded-lg text-lg">G</div>
            </div>
            <StickerPillButton onClick={() => window.location.href = "/gigs/new"}>
              <Calendar className="w-4 h-4 mr-1 inline" /> Criar Novo Show
            </StickerPillButton>
          </div>
        </div>
      </section>
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
