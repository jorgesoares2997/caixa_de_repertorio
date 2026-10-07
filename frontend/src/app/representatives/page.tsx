"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  User,
  Music,
  Plus,
  Edit3,
  Trash2,
  FileDown,
  Search,
  Phone,
  Layers,
  Sparkles,
  Music2,
  Users,
  Mic,
  CheckCircle2,
  Check,
  Eye,
  Filter,
  UserPlus
} from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { MasteryRating } from "@/components/MasteryRating";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { AddIntersectionModal } from "@/components/AddIntersectionModal";
import { useAppStore, Representative, RepresentativeSong } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

const REP_TYPE_LABELS: Record<string, string> = {
  SINGER: "Cantor(a) Solo",
  SOLO_SINGER: "Vocal Solo",
  ACOUSTIC: "Voz & Violão",
  TRIO: "Trio Acústico / Jazz",
  BAND: "Banda Completa",
  OTHER: "Projeto Especial",
};

export default function RepresentativesPage() {
  const representatives = useAppStore((state) => state.representatives);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);
  const fetchRepresentativeSongs = useAppStore((state) => state.fetchRepresentativeSongs);
  const representativeSongsCache = useAppStore((state) => state.representativeSongsCache);
  const addRepresentative = useAppStore((state) => state.addRepresentative);
  const updateRepresentative = useAppStore((state) => state.updateRepresentative);
  const deleteRepresentative = useAppStore((state) => state.deleteRepresentative);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Selected for viewing repertoire
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [songs, setSongs] = useState<RepresentativeSong[]>([]);
  const [songSearch, setSongSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  // PDF Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Intersection Linking State
  const [linkingSong, setLinkingSong] = useState<RepresentativeSong | null>(null);

  // Modals for CRUD
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [deletingRep, setDeletingRep] = useState<Representative | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "SINGER",
    contactInfo: "",
  });

  useEffect(() => {
    fetchRepresentatives();
  }, [fetchRepresentatives]);

  const openModal = async (rep: Representative) => {
    setSelectedRep(rep);
    setSongSearch("");
    setSelectedGenres([]);
    const cached = representativeSongsCache[rep.id];
    if (cached && cached.length > 0) {
      setSongs(cached);
      setIsLoadingSongs(false);
    } else {
      setIsLoadingSongs(true);
    }

    try {
      const data = await fetchRepresentativeSongs(rep.id);
      setSongs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  // Reload songs after adding an intersection
  const reloadRepresentativeSongs = async () => {
    if (!selectedRep) return;
    try {
      const data = await fetchRepresentativeSongs(selectedRep.id, true);
      setSongs(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Open PDF Preview with multiple genre filters
  const handleOpenPdfPreview = async () => {
    if (!selectedRep) return;
    setIsGeneratingPdf(true);
    setIsPreviewOpen(true);
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }

    try {
      const API_URL = getApiBaseUrl();
      const params = new URLSearchParams({
        groupBy: "COMPOSER",
        sortBy: "TITLE",
      });
      if (selectedGenres.length > 0) {
        params.append("genres", selectedGenres.join(","));
      }

      const response = await fetch(
        `${API_URL}/api/representatives/${selectedRep.id}/export-pdf?${params.toString()}`
      );
      if (!response.ok) throw new Error("Falha ao gerar pré-visualização do PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar pré-visualização do PDF");
      setIsPreviewOpen(false);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedRep || !previewPdfUrl) return;
    const a = document.createElement("a");
    a.href = previewPdfUrl;
    const genreSuffix =
      selectedGenres.length > 0
        ? `_${selectedGenres.map((g) => g.replace(/\s+/g, "_")).join("-")}`
        : "";
    a.download = `repertorio_${selectedRep.name.replace(/\s+/g, "_")}${genreSuffix}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingRep) {
        await updateRepresentative(editingRep.id, {
          name: formData.name.trim(),
          type: formData.type,
          contactInfo: formData.contactInfo.trim() || undefined,
        });
        setEditingRep(null);
      } else {
        await addRepresentative({
          name: formData.name.trim(),
          type: formData.type,
          contactInfo: formData.contactInfo.trim() || undefined,
        });
        setIsCreateOpen(false);
      }
      setFormData({ name: "", type: "SINGER", contactInfo: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar projeto/artista.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRep) return;
    setIsDeleting(true);
    try {
      await deleteRepresentative(deletingRep.id);
      setDeletingRep(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir artista.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRepresentatives = useMemo(() => {
    return representatives.filter((rep) => {
      const matchName =
        rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.contactInfo?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = !typeFilter || rep.type === typeFilter;
      return matchName && matchType;
    });
  }, [representatives, searchQuery, typeFilter]);

  // Extract unique genres for the selected representative
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      if (s.genre && s.genre.trim()) {
        set.add(s.genre.trim());
      }
    });
    return Array.from(set).sort();
  }, [songs]);

  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const q = songSearch.toLowerCase();
      const matchSearch =
        !songSearch ||
        s.title.toLowerCase().includes(q) ||
        s.composer?.toLowerCase().includes(q) ||
        s.genre?.toLowerCase().includes(q) ||
        s.performanceKey?.toLowerCase().includes(q);

      const matchGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => s.genre?.toLowerCase().includes(g.toLowerCase()));

      return matchSearch && matchGenre;
    });
  }, [songs, songSearch, selectedGenres]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 mt-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-lavender border-2 border-ink rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-[2px_2px_0px_#161616] mb-3 font-[family-name:var(--font-dm-sans)]">
            <Users className="w-3.5 h-3.5" /> Elenco & Projetos
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
            Projetos & Artistas
          </h1>
          <p className="text-dim font-medium mt-1 text-sm md:text-base">
            Gerencie repertórios exclusivos, tons personalizados e intersecções de faixas para cada cantor ou banda.
          </p>
        </div>

        <StickerPillButton
          variant="lime"
          onClick={() => {
            setFormData({ name: "", type: "SINGER", contactInfo: "" });
            setIsCreateOpen(true);
          }}
          icon={<Plus className="w-4 h-4 text-surface" />}
        >
          Novo Artista / Projeto
        </StickerPillButton>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artista por nome ou contato..."
            className="w-full bg-surface border-2 border-ink rounded-2xl py-3 pl-11 pr-4 shadow-neo font-medium text-sm text-ink focus:outline-none focus:ring-4 focus:ring-accent-lime/50 transition-all placeholder:text-dim/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`px-3.5 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
              !typeFilter ? "bg-ink text-surface" : "bg-surface text-ink hover:bg-muted"
            }`}
          >
            Todos ({representatives.length})
          </button>
          {["SINGER", "BAND", "TRIO", "ACOUSTIC"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`px-3 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
                typeFilter === t ? "bg-accent-lavender text-ink" : "bg-surface text-ink hover:bg-muted"
              }`}
            >
              {REP_TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Artists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRepresentatives.map((rep, idx) => {
          const rotation = idx % 3 === 0 ? "rotate-1" : idx % 3 === 1 ? "-rotate-1" : "rotate-0";
          const typeLabel = REP_TYPE_LABELS[rep.type] || rep.type;

          return (
            <div
              key={rep.id}
              className={`relative bg-surface border-2 border-ink rounded-2xl p-6 shadow-neo transition-all hover:scale-[1.02] hover:z-10 flex flex-col justify-between group ${rotation}`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="bg-accent-lavender border-2 border-ink px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] text-ink truncate">
                  {typeLabel}
                </span>

                {/* Edit & Delete Quick Actions */}
                <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Editar Artista"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({
                        name: rep.name,
                        type: rep.type,
                        contactInfo: rep.contactInfo || "",
                      });
                      setEditingRep(rep);
                    }}
                    className="p-1.5 border border-ink rounded-lg bg-surface hover:bg-accent-lime text-ink shadow-[1px_1px_0px_#161616]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Excluir Artista"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingRep(rep);
                    }}
                    className="p-1.5 border border-ink rounded-lg bg-surface hover:bg-accent-cherry hover:text-surface text-ink shadow-[1px_1px_0px_#161616]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Avatar Box */}
              <div
                onClick={() => openModal(rep)}
                className="w-full h-28 bg-canvas border-2 border-ink rounded-xl mb-4 flex items-center justify-center cursor-pointer group-hover:bg-accent-lime/20 transition-colors"
              >
                <div className="w-14 h-14 bg-ink rounded-full flex items-center justify-center text-surface group-hover:scale-110 transition-transform shadow-[2px_2px_0px_#161616]">
                  <User className="w-7 h-7 text-accent-lime" />
                </div>
              </div>

              {/* Name & Contact */}
              <div onClick={() => openModal(rep)} className="cursor-pointer">
                <h3 className="text-3xl font-black text-ink uppercase tracking-tight font-[family-name:var(--font-oswald)] group-hover:text-accent-orange transition-colors">
                  {rep.name}
                </h3>
                {rep.contactInfo ? (
                  <p className="text-xs font-bold text-dim mt-1 truncate font-[family-name:var(--font-dm-sans)] flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-ink shrink-0" />
                    {rep.contactInfo}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-dim/60 mt-1 italic font-[family-name:var(--font-dm-sans)]">
                    Contato não cadastrado
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t-2 border-ink/10">
                <button
                  type="button"
                  onClick={() => openModal(rep)}
                  className="w-full py-2 px-3 rounded-xl border-2 border-ink bg-surface hover:bg-accent-lime font-black text-xs uppercase tracking-wider text-ink transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] text-center block"
                >
                  Abrir Repertório &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: View Representative Repertory */}
      {selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setSelectedRep(null)}
          />
          <div className="relative bg-surface w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 md:px-8 py-5 border-b-2 border-ink flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-canvas">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                    {selectedRep.name}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-accent-lavender border-2 border-ink rounded-lg text-xs font-bold uppercase font-[family-name:var(--font-dm-sans)]">
                    {REP_TYPE_LABELS[selectedRep.type] || selectedRep.type}
                  </span>
                </div>
                <p className="text-xs md:text-sm font-semibold text-dim mt-0.5 font-[family-name:var(--font-dm-sans)]">
                  {selectedRep.contactInfo ? `Contato: ${selectedRep.contactInfo} · ` : ""}
                  Total de {songs.length} músicas no repertório
                </p>
              </div>

              {/* PDF Preview Trigger & Close */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <StickerPillButton
                  variant="lavender"
                  onClick={handleOpenPdfPreview}
                  className="flex-1 md:flex-none justify-center"
                  icon={<Eye className="w-4 h-4 text-surface" />}
                >
                  Visualizar & Exportar PDF
                </StickerPillButton>

                <button
                  onClick={() => setSelectedRep(null)}
                  className="p-2.5 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Controls: Search & Genre Selector */}
            <div className="px-6 md:px-8 py-3 bg-muted/40 border-b-2 border-ink flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder="Filtrar músicas por título, tom ou compositor..."
                  className="w-full bg-surface border-2 border-ink rounded-xl py-1.5 pl-9 pr-3 text-xs font-semibold text-ink shadow-[2px_2px_0px_#161616] focus:outline-none"
                />
              </div>

              {/* Genre Filter Pills (Multi-Select) */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
                <span className="text-[11px] font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] shrink-0 mr-1">
                  Filtrar Gêneros:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGenres([])}
                  className={`px-2.5 py-1 rounded-lg border-2 border-ink text-[11px] font-bold uppercase transition-all whitespace-nowrap ${
                    selectedGenres.length === 0
                      ? "bg-ink text-surface shadow-[2px_2px_0px_#161616]"
                      : "bg-surface text-ink hover:bg-muted"
                  }`}
                >
                  Todos ({songs.length})
                </button>
                {availableGenres.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  const count = songs.filter((s) => s.genre?.toLowerCase() === g.toLowerCase()).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-ink text-[11px] font-bold uppercase transition-all whitespace-nowrap ${
                        isSelected
                          ? "bg-accent-lime text-ink shadow-[2px_2px_0px_#161616]"
                          : "bg-surface text-ink hover:bg-muted opacity-80 hover:opacity-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{g}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-surface">
              {isLoadingSongs ? (
                <div className="flex h-full items-center justify-center font-bold uppercase tracking-widest text-dim animate-pulse py-16">
                  Carregando faixas do artista...
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="py-16 text-center text-dim font-bold uppercase text-sm">
                  Nenhuma música encontrada com os filtros selecionados.
                </div>
              ) : (
                <>
                  {/* DESKTOP VIEW: TABLE */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted border-b-2 border-ink">
                        <tr>
                          <th className="py-3.5 px-4 font-black uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">
                            Tom de Execução
                          </th>
                          <th className="py-3.5 px-4 font-black uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">
                            Música & Compositor
                          </th>
                          <th className="py-3.5 px-4 font-black uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">
                            Domínio
                          </th>
                          <th className="py-3.5 px-4 font-black uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">
                            Intersecções & Outros Artistas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-muted">
                        {filteredSongs.map((song, i) => (
                          <tr
                            key={song.songId || i}
                            className={`hover:bg-accent-lime/15 transition-colors ${
                              i % 2 === 0 ? "bg-surface" : "bg-canvas/50"
                            }`}
                          >
                            <td className="py-3 px-4">
                              <span className="inline-block px-3 py-1 bg-accent-lavender border-2 border-ink rounded-lg text-sm font-black font-[family-name:var(--font-oswald)] text-ink shadow-[1px_1px_0px_#161616]">
                                {song.performanceKey}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-black text-base uppercase text-ink font-[family-name:var(--font-oswald)] block">
                                {song.title}
                              </span>
                              <span className="text-xs text-dim font-semibold">
                                {song.composer || "—"} {song.genre ? `• ${song.genre}` : ""}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <MasteryRating level={song.masteryLevel} size="sm" readOnly />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                {song.intersections && song.intersections.length > 0 ? (
                                  song.intersections.map((inter, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-ink text-[10px] font-bold uppercase bg-canvas font-[family-name:var(--font-dm-sans)] shadow-[1px_1px_0px_#161616]"
                                    >
                                      <span>{inter.representativeName}</span>
                                      <span className="font-black text-accent-cherry">({inter.performanceKey})</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-dim/60 font-medium italic mr-1">
                                    Exclusiva deste projeto
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setLinkingSong(song)}
                                  title="Adicionar outro artista a esta música"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-ink bg-surface hover:bg-accent-lime text-[10px] font-black uppercase tracking-wider font-[family-name:var(--font-dm-sans)] transition-colors text-ink shadow-sm"
                                >
                                  <UserPlus className="w-3 h-3 text-ink" />
                                  <span>+ Vincular</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE VIEW: RESPONSIVE CARDS (No horizontal scroll!) */}
                  <div className="md:hidden space-y-3">
                    {filteredSongs.map((song, i) => (
                      <div
                        key={song.songId || i}
                        className="bg-canvas border-2 border-ink rounded-2xl p-3.5 shadow-[3px_3px_0px_#161616] flex flex-col gap-2.5"
                      >
                        {/* Header: Title & Key */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-black text-base uppercase text-ink font-[family-name:var(--font-oswald)] leading-tight">
                              {song.title}
                            </h4>
                            <p className="text-xs text-dim font-semibold mt-0.5">
                              {song.composer || "Autor desconhecido"} {song.genre ? `• ${song.genre}` : ""}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-0.5 bg-accent-lavender border-2 border-ink rounded-lg text-xs font-black font-[family-name:var(--font-oswald)] text-ink shadow-[1px_1px_0px_#161616]">
                              {song.performanceKey}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Mastery Stars */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
                            Domínio:
                          </span>
                          <MasteryRating level={song.masteryLevel} size="sm" readOnly />
                        </div>

                        {/* Bottom: Intersections & Link Button */}
                        <div className="pt-2 border-t border-ink/15 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {song.intersections && song.intersections.length > 0 ? (
                              song.intersections.map((inter, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-ink text-[10px] font-bold uppercase bg-surface font-[family-name:var(--font-dm-sans)] shadow-sm"
                                >
                                  <span>{inter.representativeName}</span>
                                  <span className="font-black text-accent-cherry">({inter.performanceKey})</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-dim/70 italic">
                                Exclusiva deste projeto
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setLinkingSong(song)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-ink bg-surface hover:bg-accent-lime text-[10px] font-black uppercase font-[family-name:var(--font-dm-sans)] text-ink shrink-0"
                          >
                            <UserPlus className="w-3 h-3 text-ink" />
                            <span>+ Vincular</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: PDF In-Browser Previewer */}
      {selectedRep && (
        <PdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Repertório • ${selectedRep.name}`}
          subtitle={
            selectedGenres.length > 0
              ? `Filtro de Gêneros: ${selectedGenres.join(", ")} · ${filteredSongs.length} músicas`
              : `Repertório Completo · ${songs.length} músicas`
          }
          pdfBlobUrl={previewPdfUrl}
          isLoading={isGeneratingPdf}
          onDownload={handleDownloadPdf}
          fileName={`repertorio_${selectedRep.name.replace(/\s+/g, "_")}${
            selectedGenres.length > 0
              ? `_${selectedGenres.map((g) => g.replace(/\s+/g, "_")).join("-")}`
              : ""
          }.pdf`}
        />
      )}

      {/* Modal: Add Artist Intersection */}
      {selectedRep && (
        <AddIntersectionModal
          isOpen={!!linkingSong}
          onClose={() => setLinkingSong(null)}
          song={linkingSong}
          currentRepresentativeId={selectedRep.id}
          allRepresentatives={representatives}
          onSuccess={reloadRepresentativeSongs}
        />
      )}

      {/* Modal: Create or Edit Representative */}
      {(isCreateOpen || !!editingRep) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => {
              setIsCreateOpen(false);
              setEditingRep(null);
            }}
          />
          <div className="relative bg-surface w-full max-w-lg rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 bg-canvas border-b-2 border-ink flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-lime border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                  <Users className="w-5 h-5 text-ink" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                    {editingRep ? "Editar Artista / Projeto" : "Novo Artista / Projeto"}
                  </h3>
                  <p className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                    Cadastre bandas, cantores e parcerias
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingRep(null);
                }}
                className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepresentative} className="p-6 space-y-4 bg-canvas">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Nome do Artista ou Grupo <span className="text-accent-cherry">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rodrigo Santos, Trio Bossa Nova, Banda Soul Power"
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Formato / Categoria
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-3 font-black text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none font-[family-name:var(--font-dm-sans)]"
                >
                  <option value="SINGER">Cantor(a) Solo</option>
                  <option value="SOLO_SINGER">Vocal Solo</option>
                  <option value="ACOUSTIC">Voz & Violão</option>
                  <option value="TRIO">Trio Acústico / Jazz</option>
                  <option value="BAND">Banda Completa</option>
                  <option value="OTHER">Projeto Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Contato / Informações (Telefone, Instagram, Formato)
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="Ex: (11) 98765-4321 • @bandasoul • Formato Sexteto"
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-ink/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingRep(null);
                  }}
                  className="px-4 py-2 rounded-xl border-2 border-ink bg-surface font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
                >
                  Cancelar
                </button>

                <StickerPillButton type="submit" variant="lime" icon={<Check className="w-4 h-4 text-surface" />}>
                  {editingRep ? "Salvar Alterações" : "Cadastrar Artista"}
                </StickerPillButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Representative */}
      <DeleteConfirmModal
        isOpen={!!deletingRep}
        onClose={() => setDeletingRep(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title={deletingRep ? `Excluir "${deletingRep.name}"?` : "Excluir Artista"}
        itemDescription={`Esta ação removerá "${deletingRep?.name}" e desvinculará suas músicas associadas.`}
      />
    </div>
  );
}
