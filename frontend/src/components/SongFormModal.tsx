"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Check, UserCheck, Plus, Trash2, KeyRound, FileText } from "lucide-react";
import { MasteryRating } from "./MasteryRating";
import { StickerPillButton } from "./StickerPillButton";
import { useAppStore, Representative, RepresentativeLink } from "@/lib/store";

export type SongData = {
  id?: string;
  title: string;
  composer?: string;
  genre?: string;
  originalKey?: string;
  masteryLevel?: number;
  tempoBpm?: number;
  notes?: string;
  representativeLinks?: RepresentativeLink[];
};

interface SongFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: SongData, repIds?: string[]) => Promise<void>;
  initialData?: SongData | null;
  mode: "create" | "edit";
}

const COMMON_GENRES = [
  "MPB",
  "Bossa Nova",
  "Samba",
  "Jazz",
  "Soul",
  "Pop",
  "Forró",
  "Choro",
  "Samba-Rock",
  "Blues"
];

const COMMON_KEYS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
  "Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "Abm", "Am", "Bbm", "Bm"
];

export function SongFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}: SongFormModalProps) {
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [genre, setGenre] = useState("");
  const [originalKey, setOriginalKey] = useState("C");
  const [masteryLevel, setMasteryLevel] = useState(3);
  const [tempoBpm, setTempoBpm] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Representative links state: Map of repId -> { performanceKey, specificNotes }
  const [repLinksMap, setRepLinksMap] = useState<
    Record<string, { performanceKey: string; specificNotes: string }>
  >({});

  // Representatives from Zustand cache
  const representatives = useAppStore((state) => state.representatives);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);

  useEffect(() => {
    if (isOpen) {
      fetchRepresentatives();
    }
  }, [isOpen, fetchRepresentatives]);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setTitle(initialData.title || "");
      setComposer(initialData.composer || "");
      setGenre(initialData.genre || "");
      setOriginalKey(initialData.originalKey || "C");
      setMasteryLevel(initialData.masteryLevel || 3);
      setTempoBpm(initialData.tempoBpm || "");
      setNotes(initialData.notes || "");

      // Populate existing representative links
      const initialMap: Record<string, { performanceKey: string; specificNotes: string }> = {};
      if (initialData.representativeLinks && Array.isArray(initialData.representativeLinks)) {
        initialData.representativeLinks.forEach((link) => {
          initialMap[link.representativeId] = {
            performanceKey: link.performanceKey || initialData.originalKey || "C",
            specificNotes: link.specificNotes || "",
          };
        });
      }
      setRepLinksMap(initialMap);
    } else {
      setTitle("");
      setComposer("");
      setGenre("MPB");
      setOriginalKey("C");
      setMasteryLevel(3);
      setTempoBpm("");
      setNotes("");
      setRepLinksMap({});
    }
    setErrorMsg("");
  }, [initialData, mode, isOpen]);

  const toggleRepresentative = (repId: string) => {
    setRepLinksMap((prev) => {
      const next = { ...prev };
      if (next[repId]) {
        delete next[repId];
      } else {
        next[repId] = {
          performanceKey: originalKey || "C",
          specificNotes: "",
        };
      }
      return next;
    });
  };

  const handleUpdateRepKey = (repId: string, newKey: string) => {
    setRepLinksMap((prev) => ({
      ...prev,
      [repId]: {
        ...prev[repId],
        performanceKey: newKey,
      },
    }));
  };

  const handleUpdateRepNotes = (repId: string, repNotes: string) => {
    setRepLinksMap((prev) => ({
      ...prev,
      [repId]: {
        ...prev[repId],
        specificNotes: repNotes,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("O título da música é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const linksPayload: RepresentativeLink[] = Object.entries(repLinksMap).map(
        ([repId, linkData]) => {
          const rep = representatives.find((r) => r.id === repId);
          return {
            representativeId: repId,
            representativeName: rep?.name,
            performanceKey: linkData.performanceKey || originalKey || "C",
            specificNotes: linkData.specificNotes || undefined,
          };
        }
      );

      const songPayload: SongData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        title: title.trim(),
        composer: composer.trim() || undefined,
        genre: genre.trim() || undefined,
        originalKey: originalKey.trim() || "C",
        masteryLevel,
        tempoBpm: tempoBpm ? Number(tempoBpm) : undefined,
        notes: notes.trim() || undefined,
        representativeLinks: linksPayload,
      };

      const selectedIds = Object.keys(repLinksMap);
      await onSave(songPayload, selectedIds);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar a música. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-canvas border-b-2 border-ink flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lime border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                <Music className="w-5 h-5 text-ink" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  {mode === "create" ? "Adicionar Nova Música" : "Revisar / Editar Música"}
                </h3>
                <p className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  {mode === "create" ? "Cadastre no acervo central e vincule artistas" : "Atualize tom, domínio e cantores vinculados"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-accent-cherry/10 border-2 border-accent-cherry text-accent-cherry rounded-xl text-xs font-bold font-[family-name:var(--font-dm-sans)]">
                {errorMsg}
              </div>
            )}

            {/* Row 1: Title & Composer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Título da Obra <span className="text-accent-cherry">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Flor de Lis, Wave, As Rosas Não Falam"
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Compositor / Artista
                </label>
                <input
                  type="text"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Ex: Djavan, Tom Jobim, Cartola"
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>
            </div>

            {/* Row 2: Genre & Quick Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Gênero Musical
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ex: MPB, Bossa Nova, Samba, Jazz Standards"
                className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={`px-2.5 py-1 rounded-lg border border-ink text-[11px] font-bold uppercase tracking-wide transition-all ${
                      genre.toLowerCase() === g.toLowerCase()
                        ? "bg-ink text-surface shadow-[1px_1px_0px_#161616]"
                        : "bg-canvas text-ink hover:bg-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Key, BPM, Mastery */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Key */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Tom Original
                </label>
                <select
                  value={originalKey}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    setOriginalKey(newKey);
                  }}
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-3 font-black text-accent-cherry text-sm shadow-[2px_2px_0px_#161616] focus:outline-none font-[family-name:var(--font-oswald)]"
                >
                  {COMMON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* BPM */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Andamento (BPM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={tempoBpm}
                    onChange={(e) => setTempoBpm(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Ex: 120"
                    className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 pl-4 pr-12 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-dim font-[family-name:var(--font-dm-sans)]">
                    BPM
                  </span>
                </div>
              </div>

              {/* Mastery */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Nível de Domínio
                </label>
                <div className="pt-1">
                  <MasteryRating level={masteryLevel} onChange={(lvl) => setMasteryLevel(lvl)} />
                </div>
              </div>
            </div>

            {/* Representative Linking Section */}
            {representatives.length > 0 && (
              <div className="bg-canvas border-2 border-ink rounded-2xl p-4 shadow-[2px_2px_0px_#161616] space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-wider text-ink font-[family-name:var(--font-dm-sans)]">
                      Vincular a Artistas & Projetos
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
                      {Object.keys(repLinksMap).length} selecionado(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-dim font-medium mt-0.5">
                    Vincule a música a um ou mais representantes e ajuste o tom individual de execução.
                  </p>
                </div>

                {/* Quick Toggle Pills */}
                <div className="flex flex-wrap gap-2">
                  {representatives.map((rep) => {
                    const isSelected = !!repLinksMap[rep.id];
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => toggleRepresentative(rep.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink text-xs font-bold uppercase tracking-wider transition-all font-[family-name:var(--font-dm-sans)] ${
                          isSelected
                            ? "bg-accent-lavender text-ink shadow-[2px_2px_0px_#161616] -translate-y-0.5"
                            : "bg-surface text-dim hover:text-ink hover:bg-muted"
                        }`}
                      >
                        <UserCheck className={`w-3.5 h-3.5 ${isSelected ? "text-ink" : "text-dim"}`} />
                        {rep.name}
                        {isSelected && <span className="ml-1 text-[10px] bg-ink text-surface rounded px-1">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Per-Representative Key & Notes Customizer */}
                {Object.keys(repLinksMap).length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-ink/20">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-dim block font-[family-name:var(--font-dm-sans)]">
                      Configuração de Tom por Representante:
                    </span>

                    {Object.entries(repLinksMap).map(([repId, linkData]) => {
                      const rep = representatives.find((r) => r.id === repId);
                      if (!rep) return null;

                      return (
                        <div
                          key={repId}
                          className="bg-surface border-2 border-ink rounded-xl p-3 shadow-[2px_2px_0px_#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-accent-lavender border border-ink flex items-center justify-center font-bold text-xs">
                              {rep.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-black text-sm uppercase text-ink font-[family-name:var(--font-oswald)]">
                                {rep.name}
                              </span>
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
                                {rep.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                                Tom:
                              </span>
                              <select
                                value={linkData.performanceKey}
                                onChange={(e) => handleUpdateRepKey(repId, e.target.value)}
                                className="bg-canvas border-2 border-ink rounded-lg py-1 px-2.5 font-black text-accent-cherry text-xs shadow-[1px_1px_0px_#161616] focus:outline-none font-[family-name:var(--font-oswald)]"
                              >
                                {COMMON_KEYS.map((k) => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <input
                              type="text"
                              value={linkData.specificNotes}
                              onChange={(e) => handleUpdateRepNotes(repId, e.target.value)}
                              placeholder="Obs/Arranjo..."
                              className="w-32 sm:w-40 bg-canvas border-2 border-ink rounded-lg py-1 px-2 text-xs font-semibold text-ink shadow-[1px_1px_0px_#161616] focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => toggleRepresentative(repId)}
                              title="Remover vínculo"
                              className="p-1 text-dim hover:text-accent-cherry transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notes / Cifra / Chords */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Observações Gerais, Estrutura ou Cifra
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Introdução em 2/4, solo de sax no meio, final em fade out. Links do Cifra Club ou YouTube..."
                className="w-full bg-surface border-2 border-ink rounded-xl p-3 font-medium text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime placeholder:text-dim/50"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-ink/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border-2 border-ink bg-surface font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Cancelar
              </button>

              <StickerPillButton
                type="submit"
                variant="lime"
                className={isSubmitting ? "opacity-60 pointer-events-none" : ""}
                icon={<Check className="w-4 h-4 text-surface" />}
              >
                {isSubmitting
                  ? "Salvando..."
                  : mode === "create"
                  ? "Cadastrar Música"
                  : "Salvar Alterações"}
              </StickerPillButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
