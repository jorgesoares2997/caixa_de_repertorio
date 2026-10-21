"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Award,
  Music,
  Users,
  Calendar,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  ChevronRight,
  X,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { useAppStore, DashboardData, GenreItem } from "@/lib/store";
import { getMaskedArtistName } from "@/lib/artistPrivacy";
import { StickerPillButton } from "@/components/StickerPillButton";

type PeriodOption = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  week: "Última Semana",
  month: "Último Mês",
  year: "Último Ano",
  all: "Histórico Completo",
};

const COLOR_OPTIONS = [
  { name: "Lima Elétrico", value: "#CCFF00", class: "bg-[#CCFF00]" },
  { name: "Lavanda Neo", value: "#D8B4FE", class: "bg-[#D8B4FE]" },
  { name: "Laranja Groove", value: "#FB923C", class: "bg-[#FB923C]" },
  { name: "Cereja Pop", value: "#FDA4AF", class: "bg-[#FDA4AF]" },
  { name: "Azul Céu", value: "#38BDF8", class: "bg-[#38BDF8]" },
  { name: "Amarelo Sun", value: "#FDE047", class: "bg-[#FDE047]" },
  { name: "Esmeralda", value: "#34D399", class: "bg-[#34D399]" },
];

export default function DashboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === "ADMIN";
  const fetchDashboardData = useAppStore((state) => state.fetchDashboardData);
  const addCustomGenre = useAppStore((state) => state.addCustomGenre);
  const deleteCustomGenre = useAppStore((state) => state.deleteCustomGenre);
  const fetchGenres = useAppStore((state) => state.fetchGenres);

  const [period, setPeriod] = useState<PeriodOption>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for adding new style
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreColor, setNewGenreColor] = useState(COLOR_OPTIONS[0].value);
  const [isSubmittingGenre, setIsSubmittingGenre] = useState(false);
  const [genreError, setGenreError] = useState("");

  const loadData = async (selectedPeriod: PeriodOption) => {
    setIsLoading(true);
    try {
      const res = await fetchDashboardData(selectedPeriod);
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
  };

  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) {
      setGenreError("Informe o nome do estilo musical.");
      return;
    }
    setGenreError("");
    setIsSubmittingGenre(true);

    try {
      await addCustomGenre(newGenreName.trim(), newGenreColor);
      setIsAddGenreOpen(false);
      setNewGenreName("");
      // Reload dashboard data and genres
      await fetchGenres(true);
      await loadData(period);
    } catch (err: any) {
      setGenreError(err.message || "Erro ao salvar estilo musical.");
    } finally {
      setIsSubmittingGenre(false);
    }
  };

  const handleDeleteGenre = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Deseja realmente remover o estilo customizado "${name}"?`)) {
      try {
        await deleteCustomGenre(id);
        await fetchGenres(true);
        await loadData(period);
      } catch (err) {
        console.error("Erro ao remover estilo:", err);
      }
    }
  };

  // Find most active artist
  const mostActiveArtist = useMemo(() => {
    if (!data?.artistStats || data.artistStats.length === 0) return null;
    return [...data.artistStats].sort((a, b) => b.totalSongs - a.totalSongs)[0];
  }, [data]);

  return (
    <div className="flex flex-col gap-10 md:gap-14 font-sans animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20 max-w-6xl mx-auto px-4 w-full">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 border-b-2 border-ink/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-accent-lime text-ink font-black uppercase tracking-wider text-xs px-3.5 py-1 rounded-full mb-3 border-2 border-ink shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]">
            <BarChart3 className="w-3.5 h-3.5" /> Métricas & Análises de Repertório
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
            Dashboard de Performance
          </h1>
          <p className="text-sm md:text-base text-dim mt-1 font-[family-name:var(--font-inter)] max-w-2xl">
            Acompanhe a distribuição por artistas, balanço do estilo que você mais domina e o ritmo de evolução técnica do seu acervo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => setIsAddGenreOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-orange text-surface font-black uppercase tracking-wider text-xs rounded-xl border-2 border-ink shadow-[3px_3px_0px_#161616] hover:bg-accent-orange/90 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_#161616] transition-all font-[family-name:var(--font-dm-sans)]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Estilo Musical</span>
            </button>
          )}

          <Link
            href="/songs"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface text-ink font-bold uppercase tracking-wider text-xs rounded-xl border-2 border-ink shadow-[3px_3px_0px_#161616] hover:bg-muted transition-all font-[family-name:var(--font-dm-sans)]"
          >
            <Music className="w-4 h-4 text-accent-cherry" />
            <span>Ver Acervo</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Estilo Mais Dominado (Core User Feature) */}
        <div className="bg-surface border-2 border-ink p-5 rounded-2xl shadow-[4px_4px_0px_#161616] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Estilo Mais Dominado
            </span>
            <div className="p-1.5 rounded-lg bg-accent-lime border border-ink text-ink shadow-[1px_1px_0px_#161616]">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl md:text-4xl font-black text-ink font-[family-name:var(--font-oswald)] uppercase truncate">
                {data?.topMasteredGenre ? (data.topMasteredGenre.name || data.topMasteredGenre.genre) : "Carregando..."}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink/80 font-[family-name:var(--font-dm-sans)]">
              <span className="inline-block px-2 py-0.5 bg-accent-lime/40 border border-ink/20 rounded-md font-black">
                ★ {data?.topMasteredGenre?.averageMastery ? Number(data.topMasteredGenre.averageMastery).toFixed(1) : "0.0"} / 5.0
              </span>
              <span>
                {data?.topMasteredGenre
                  ? `${data.topMasteredGenre.level5Count} de ${data.topMasteredGenre.totalSongs} em Nível 5`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] font-bold text-accent-orange">
            <span>
              {data?.topMasteredGenre?.percentageOfGenreLevel5 ?? (
                data?.topMasteredGenre?.totalSongs
                  ? Math.round(((data.topMasteredGenre.level5Count || 0) / data.topMasteredGenre.totalSongs) * 100)
                  : 0
              )}% de Prontidão
            </span>
            <span className="text-[10px] text-dim uppercase">Maior Consistência</span>
          </div>
        </div>

        {/* KPI 2: Projeto Mais Ativo */}
        <div className="bg-surface border-2 border-ink p-5 rounded-2xl shadow-[4px_4px_0px_#161616] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Projeto com Mais Músicas
            </span>
            <div className="p-1.5 rounded-lg bg-accent-lavender border border-ink text-ink shadow-[1px_1px_0px_#161616]">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-black text-ink font-[family-name:var(--font-oswald)] uppercase truncate mb-1">
              {mostActiveArtist
                ? getMaskedArtistName(
                    {
                      name: (mostActiveArtist as any).artistName || (mostActiveArtist as any).representativeName || "Artista",
                      type: (mostActiveArtist as any).artistType || (mostActiveArtist as any).type || "OTHER",
                    },
                    0,
                    isAdmin
                  )
                : "—"}
            </div>
            <div className="text-xs font-bold text-ink/80 font-[family-name:var(--font-dm-sans)]">
              {mostActiveArtist ? `${mostActiveArtist.totalSongs || 0} músicas no repertório` : "Sem dados"}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] font-bold text-ink/70">
            <span>Domínio Médio: ★ {mostActiveArtist?.averageMastery ? Number(mostActiveArtist.averageMastery).toFixed(1) : "0.0"}</span>
            <span className="text-[10px] text-dim uppercase">{mostActiveArtist?.masteredCount ?? 0} Prontas</span>
          </div>
        </div>

        {/* KPI 3: Músicas que Evoluíram no Período */}
        <div className="bg-surface border-2 border-ink p-5 rounded-2xl shadow-[4px_4px_0px_#161616] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Evoluções no Período
            </span>
            <div className="p-1.5 rounded-lg bg-accent-orange border border-ink text-surface shadow-[1px_1px_0px_#161616]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-black text-ink font-[family-name:var(--font-oswald)] mb-1">
              {data?.evolutionStats?.totalEvolutions ?? data?.evolutionStats?.totalEvolved ?? 0}
            </div>
            <div className="text-xs font-bold text-ink/80 font-[family-name:var(--font-dm-sans)]">
              {data?.evolutionStats?.evolvedSongsCount ?? data?.evolutionStats?.evolvedSongs?.length ?? 0} músicas subiram de nível
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] font-bold text-accent-cherry">
            <span>Filtro: {PERIOD_LABELS[period]}</span>
            <span className="text-[10px] text-dim uppercase">Histórico Ativo</span>
          </div>
        </div>

        {/* KPI 4: Prontidão Geral */}
        <div className="bg-surface border-2 border-ink p-5 rounded-2xl shadow-[4px_4px_0px_#161616] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Prontidão para Shows
            </span>
            <div className="p-1.5 rounded-lg bg-accent-cherry border border-ink text-surface shadow-[1px_1px_0px_#161616]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-black text-ink font-[family-name:var(--font-oswald)] mb-1">
              {data?.overallReadiness?.readinessPercentage ?? data?.overallReadiness?.readyPercentage ?? 0}%
            </div>
            <div className="text-xs font-bold text-ink/80 font-[family-name:var(--font-dm-sans)]">
              {data?.overallReadiness?.level5Songs ?? data?.overallReadiness?.readyForStageCount ?? 0} de {data?.overallReadiness?.totalSongs ?? 0} faixas prontas
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] font-bold text-emerald-600">
            <span>Prontas para o Palco</span>
            <span className="text-[10px] text-dim uppercase">100% Afiadas</span>
          </div>
        </div>

      </section>

      {/* Main Grid: Graph 1 (Artists) and Graph 2 (Genres) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* GRAPH 1: Artistas & Projetos (quantas músicas eu sei de cada um) - 7 cols */}
        <section className="lg:col-span-7 bg-surface border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[5px_5px_0px_#161616] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-lavender border-2 border-ink flex items-center justify-center shadow-[1.5px_1.5px_0px_#161616]">
                  <Users className="w-4 h-4 text-ink" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  Músicas por Artista & Projeto
                </h2>
              </div>
              <span className="text-xs font-black uppercase text-dim tracking-wider font-[family-name:var(--font-dm-sans)] hidden sm:inline">
                {data?.artistStats?.length ?? 0} Projetos
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-dim mb-6 font-[family-name:var(--font-inter)]">
              Volume total de repertório dominado para cada cantor e banda, com detalhamento de maturidade técnica.
            </p>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-dim">
                <div className="w-8 h-8 border-4 border-ink border-t-accent-lime rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase">Carregando estatísticas...</span>
              </div>
            ) : !data?.artistStats || data.artistStats.length === 0 ? (
              <div className="py-12 text-center text-dim font-bold text-sm">
                Nenhum projeto cadastrado no momento.
              </div>
            ) : (
              <div className="space-y-5">
                {data.artistStats.map((artist: any, idx) => {
                  const rawName = artist.artistName || artist.representativeName || "Artista";
                  const rawType = artist.artistType || artist.type || "OTHER";
                  const displayName = getMaskedArtistName(
                    { name: rawName, type: rawType },
                    idx,
                    isAdmin
                  );
                  const total = Number(artist.totalSongs) || 1;
                  const maxSongs = Math.max(...data.artistStats.map((a: any) => Number(a.totalSongs) || 0), 1);
                  const widthPercent = Math.max(12, Math.round((total / maxSongs) * 100));

                  const lvl5 = Number(artist.level5Count ?? artist.levelBreakdown?.["5"] ?? 0);
                  const lvl4 = Number(artist.level4Count ?? artist.levelBreakdown?.["4"] ?? 0);
                  const lvl3 = Number(artist.level3Count ?? artist.levelBreakdown?.["3"] ?? 0);
                  const lvl2 = Number(artist.level2Count ?? artist.levelBreakdown?.["2"] ?? 0);
                  const lvl1 = Number(artist.level1Count ?? artist.levelBreakdown?.["1"] ?? 0);

                  const readyCount = Number(artist.masteredCount ?? (lvl5 + lvl4));
                  const readyPct = Number(artist.masteredPercentage ?? (total > 0 ? Math.round((readyCount * 100) / total) : 0));
                  const avgMastery = artist.averageMastery ? Number(artist.averageMastery).toFixed(1) : "0.0";

                  return (
                    <div
                      key={artist.artistId || artist.representativeId || idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-canvas border-2 border-ink shadow-[2px_2px_0px_#161616] hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-ink text-surface text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm sm:text-base text-ink uppercase tracking-tight truncate font-[family-name:var(--font-oswald)]">
                            {displayName}
                          </span>
                          <span className="text-[10px] font-bold text-dim uppercase px-2 py-0.5 bg-surface border border-ink/20 rounded-md hidden sm:inline">
                            {rawType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-ink font-[family-name:var(--font-dm-sans)]">
                            {total} {total === 1 ? "música" : "músicas"}
                          </span>
                          <span className="text-[11px] font-bold text-accent-cherry bg-accent-cherry/10 border border-accent-cherry/30 px-1.5 py-0.5 rounded">
                            ★ {avgMastery}
                          </span>
                        </div>
                      </div>

                      {/* Neo-Brutalist Visual Progress Bar */}
                      <div className="h-4 w-full bg-surface border-2 border-ink rounded-lg overflow-hidden flex shadow-[1px_1px_0px_#161616]">
                        {/* Level 5 Ready (Lime) */}
                        <div
                          style={{
                            width: `${Math.min(100, Math.round((lvl5 / total) * 100))}%`,
                          }}
                          className="bg-accent-lime h-full border-r border-ink/40 transition-all duration-500"
                          title={`Nível 5: ${lvl5} músicas`}
                        />
                        {/* Level 3-4 Consolidating (Lavender) */}
                        <div
                          style={{
                            width: `${Math.min(100, Math.round(((lvl4 + lvl3) / total) * 100))}%`,
                          }}
                          className="bg-accent-lavender h-full border-r border-ink/40 transition-all duration-500"
                          title={`Nível 3 e 4: ${lvl4 + lvl3} músicas`}
                        />
                        {/* Level 1-2 Learning (Orange) */}
                        <div
                          style={{
                            width: `${Math.min(100, Math.round(((lvl2 + lvl1) / total) * 100))}%`,
                          }}
                          className="bg-accent-orange h-full transition-all duration-500"
                          title={`Nível 1 e 2: ${lvl2 + lvl1} músicas`}
                        />
                      </div>

                      {/* Mini Breakdown Legend */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-dim mt-2 font-[family-name:var(--font-dm-sans)]">
                        <span className="text-emerald-700">
                          {readyCount} prontas ({readyPct}%)
                        </span>
                        <span>
                          {lvl3 + lvl4} em consolidação · {lvl1 + lvl2} inicial
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bar Legend */}
          <div className="mt-6 pt-4 border-t-2 border-ink/10 flex flex-wrap items-center gap-4 text-xs font-bold font-[family-name:var(--font-dm-sans)]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-accent-lime border border-ink" />
              <span>Nível 5 (Palco / Pronta)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-accent-lavender border border-ink" />
              <span>Nível 3-4 (Consolidando)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-accent-orange border border-ink" />
              <span>Nível 1-2 (Aprendendo)</span>
            </div>
          </div>
        </section>

        {/* GRAPH 2: Estilos Musicais & Gêneros - 5 cols */}
        <section className="lg:col-span-5 bg-surface border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[5px_5px_0px_#161616] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-orange border-2 border-ink flex items-center justify-center shadow-[1.5px_1.5px_0px_#161616]">
                  <Layers className="w-4 h-4 text-surface" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  Estilos Musicais
                </h2>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsAddGenreOpen(true)}
                  className="p-1.5 rounded-lg border-2 border-ink bg-accent-lime hover:bg-accent-lime/80 text-ink shadow-[1.5px_1.5px_0px_#161616] transition-transform active:translate-y-0.5"
                  title="Cadastrar novo estilo musical"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>

            <p className="text-xs md:text-sm text-dim mb-6 font-[family-name:var(--font-inter)]">
              Distribuição do seu acervo por gênero e nível de especialização técnica.
            </p>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-dim">
                <div className="w-8 h-8 border-4 border-ink border-t-accent-orange rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase">Carregando estilos...</span>
              </div>
            ) : !data?.genreStats || data.genreStats.length === 0 ? (
              <div className="py-12 text-center text-dim font-bold text-sm">
                Nenhum estilo registrado.
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {data.genreStats.map((genre) => {
                  const gName = genre.name || genre.genre || "Geral";
                  const pct = genre.percentage ?? genre.percentageOfRepertoire ?? 0;

                  return (
                    <div
                      key={gName}
                      className="p-3.5 rounded-2xl bg-canvas border-2 border-ink shadow-[2px_2px_0px_#161616] hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-ink shrink-0 shadow-[1px_1px_0px_#161616]"
                            style={{ backgroundColor: genre.color || "#CCFF00" }}
                          />
                          <span className="font-black text-sm text-ink uppercase tracking-tight truncate font-[family-name:var(--font-oswald)]">
                            {gName}
                          </span>
                          {genre.isCustom && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-accent-lavender text-ink border border-ink rounded">
                              Custom
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-ink font-[family-name:var(--font-dm-sans)]">
                            {genre.count} ({pct}%)
                          </span>
                          {genre.isCustom && isAdmin && (
                            <button
                              onClick={() => handleDeleteGenre(gName, gName)}
                              className="text-dim hover:text-accent-cherry transition-colors p-0.5"
                              title="Remover estilo customizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="h-2.5 w-full bg-surface border border-ink rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: genre.color || "#CCFF00",
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-dim mt-2 font-[family-name:var(--font-dm-sans)]">
                        <span>Domínio Médio: ★ {genre.averageMastery ? Number(genre.averageMastery).toFixed(1) : "0.0"}</span>
                        <span>{genre.level5Count} em Nível 5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-ink/10 flex items-center justify-between">
            <div className="text-xs font-bold text-dim font-[family-name:var(--font-dm-sans)]">
              Total de Gêneros: <strong className="text-ink">{data?.genreStats?.length ?? 0}</strong>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAddGenreOpen(true)}
                className="text-xs font-black uppercase text-ink hover:text-accent-orange underline tracking-wider font-[family-name:var(--font-dm-sans)]"
              >
                + Adicionar Estilo
              </button>
            )}
          </div>
        </section>

      </div>

      {/* GRAPH 3: Evolução de Domínio (Semana / Mês / Ano) */}
      <section className="bg-surface border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_#161616]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-accent-cherry border-2 border-ink flex items-center justify-center shadow-[1.5px_1.5px_0px_#161616]">
                <TrendingUp className="w-4 h-4 text-surface" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                Evolução Técnica & Músicas Aprimoradas
              </h2>
            </div>
            <p className="text-xs md:text-sm text-dim font-[family-name:var(--font-inter)]">
              Histórico de progressão de domínio técnico das músicas no intervalo selecionado.
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-canvas border-2 border-ink p-1 rounded-2xl shadow-[2px_2px_0px_#161616] self-start sm:self-auto overflow-x-auto max-w-full">
            {(["week", "month", "year", "all"] as PeriodOption[]).map((opt) => {
              const isSelected = period === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePeriodChange(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap font-[family-name:var(--font-dm-sans)] ${
                    isSelected
                      ? "bg-accent-lime text-ink border-2 border-ink shadow-[1.5px_1.5px_0px_#161616]"
                      : "text-dim hover:text-ink hover:bg-muted"
                  }`}
                >
                  {opt === "week"
                    ? "Semana"
                    : opt === "month"
                    ? "Mês"
                    : opt === "year"
                    ? "Ano"
                    : "Tudo"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline activity distribution bar chart */}
        {data?.evolutionStats?.timeline && data.evolutionStats.timeline.length > 0 && (
          <div className="mb-8 p-5 bg-canvas border-2 border-ink rounded-2xl shadow-[2px_2px_0px_#161616]">
            <span className="text-[10px] font-black uppercase tracking-wider text-dim block mb-3 font-[family-name:var(--font-dm-sans)]">
              Distribuição no tempo ({PERIOD_LABELS[period]}):
            </span>
            <div className="flex items-end justify-between gap-2 h-24 pt-2">
              {data.evolutionStats.timeline.map((point, i) => {
                const maxCount = Math.max(
                  ...data.evolutionStats.timeline.map((p) => p.count),
                  1
                );
                const heightPercent = Math.max(12, Math.round((point.count / maxCount) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-black text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[40px] rounded-t-lg border-2 border-ink transition-all duration-300 group-hover:scale-105 shadow-[1px_1px_0px_#161616] ${
                        point.count > 0 ? "bg-accent-lime" : "bg-muted opacity-40"
                      }`}
                    />
                    <span className="text-[9px] font-bold text-dim truncate max-w-[50px] font-[family-name:var(--font-dm-sans)]">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed List of Evolved Songs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Músicas que Subiram de Nível ({data?.evolutionStats?.evolvedSongs?.length ?? 0}):
            </span>
          </div>

          {!data?.evolutionStats?.evolvedSongs || data.evolutionStats.evolvedSongs.length === 0 ? (
            <div className="p-8 text-center bg-canvas border-2 border-ink rounded-2xl text-dim font-bold text-sm">
              Nenhuma alteração de nível registrada para este período ({PERIOD_LABELS[period]}).
              <p className="text-xs font-normal mt-1">
                Ao praticar e ajustar as estrelas no Acervo, a evolução aparecerá aqui automaticamente!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
              {data.evolutionStats.evolvedSongs.map((ev, i) => {
                const isMaxLevel = ev.newLevel === 5;
                let formattedDate = ev.changedAt || "";
                if ((ev as any).rawDate) {
                  try {
                    const parsed = new Date((ev as any).rawDate);
                    if (!isNaN(parsed.getTime())) {
                      formattedDate = parsed.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      });
                    }
                  } catch (e) {
                    // Fall back to original changedAt string
                  }
                }

                return (
                  <div
                    key={`${ev.songId}-${i}`}
                    className="p-3.5 bg-canvas border-2 border-ink rounded-2xl shadow-[2px_2px_0px_#161616] flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-black text-sm text-ink uppercase tracking-tight truncate font-[family-name:var(--font-oswald)]">
                          {ev.title}
                        </h4>
                        <span className="text-[10px] font-bold text-dim shrink-0">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-xs text-dim font-medium truncate mb-2">
                        {ev.artistName ? (isAdmin ? ev.artistName : "Projeto Confidencial") : "Acervo Geral"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-muted border border-ink/20 text-[10px] font-bold text-dim">
                          ★ {ev.previousLevel}
                        </span>
                        <ChevronRight className="w-3 h-3 text-ink" />
                        <span
                          className={`px-1.5 py-0.5 rounded border border-ink text-[10px] font-black ${
                            isMaxLevel
                              ? "bg-accent-lime text-ink shadow-[1px_1px_0px_#161616]"
                              : "bg-accent-orange text-surface"
                          }`}
                        >
                          ★ {ev.newLevel}
                        </span>
                      </div>

                      {isMaxLevel && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          Pronta p/ Show
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* MODAL: Adicionar Novo Estilo Musical */}
      {isAddGenreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border-4 border-ink rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_#161616] relative">
            <button
              onClick={() => setIsAddGenreOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl border-2 border-ink bg-muted hover:bg-accent-cherry hover:text-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-accent-orange border-2 border-ink flex items-center justify-center shadow-[1.5px_1.5px_0px_#161616]">
                <Plus className="w-4 h-4 text-surface" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                Novo Estilo Musical
              </h3>
            </div>
            <p className="text-xs text-dim mb-5 font-[family-name:var(--font-inter)]">
              Cadastre um gênero para categorizar músicas e acompanhar seu domínio no dashboard.
            </p>

            <form onSubmit={handleCreateGenre} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Nome do Estilo:
                </label>
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="Ex: Neo Soul, Frevo, Reggae..."
                  className="w-full bg-canvas border-2 border-ink rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Cor de Destaque:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((col) => {
                    const isSelected = newGenreColor === col.value;
                    return (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setNewGenreColor(col.value)}
                        className={`flex items-center gap-2 p-2 rounded-xl border-2 border-ink transition-all ${
                          isSelected
                            ? "ring-2 ring-ink shadow-[2px_2px_0px_#161616] scale-105"
                            : "opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: col.value }}
                      >
                        <span className="text-[10px] font-black text-ink uppercase truncate">
                          {col.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {genreError && (
                <div className="p-2.5 rounded-xl bg-accent-cherry/20 border-2 border-accent-cherry text-xs font-bold text-accent-cherry">
                  {genreError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddGenreOpen(false)}
                  className="px-4 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGenre || !newGenreName.trim()}
                  className="px-5 py-2.5 bg-accent-lime text-ink font-black uppercase tracking-wider text-xs rounded-xl border-2 border-ink shadow-[3px_3px_0px_#161616] hover:bg-accent-lime/90 active:translate-y-0.5 disabled:opacity-40"
                >
                  {isSubmittingGenre ? "Salvando..." : "Salvar Estilo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
