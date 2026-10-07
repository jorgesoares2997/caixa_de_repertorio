"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Check, Plus, KeyRound } from "lucide-react";
import { StickerPillButton } from "./StickerPillButton";
import { Representative, RepresentativeSong } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

interface AddIntersectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: RepresentativeSong | null;
  currentRepresentativeId: string;
  allRepresentatives: Representative[];
  onSuccess: () => Promise<void>;
}

const COMMON_KEYS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
  "Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "Abm", "Am", "Bbm", "Bm"
];

export function AddIntersectionModal({
  isOpen,
  onClose,
  song,
  currentRepresentativeId,
  allRepresentatives,
  onSuccess,
}: AddIntersectionModalProps) {
  const [selectedRepId, setSelectedRepId] = useState("");
  const [performanceKey, setPerformanceKey] = useState("");
  const [specificNotes, setSpecificNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const availableReps = allRepresentatives.filter((r) => r.id !== currentRepresentativeId);

  // Initialize key with song's key when opened
  const handleOpen = () => {
    if (song) {
      setPerformanceKey(song.performanceKey || "C");
      if (availableReps.length > 0 && !selectedRepId) {
        setSelectedRepId(availableReps[0].id);
      }
    }
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song || !selectedRepId) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const API_URL = getApiBaseUrl();
      const params = new URLSearchParams();
      if (performanceKey) params.append("performanceKey", performanceKey);
      if (specificNotes) params.append("specificNotes", specificNotes);

      const res = await fetch(
        `${API_URL}/api/representatives/${selectedRepId}/songs/${song.songId}?${params.toString()}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao vincular artista à música.");
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao salvar intersecção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !song) return null;

  return (
    <AnimatePresence onExitComplete={() => { setSelectedRepId(""); setSpecificNotes(""); }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface w-full max-w-lg rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-canvas border-b-2 border-ink flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lavender border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                <Users className="w-5 h-5 text-ink" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  Vincular Outro Artista
                </h3>
                <p className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Adicionar intersecção para "{song.title}"
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-canvas">
            {errorMsg && (
              <div className="p-3 bg-accent-cherry/10 border-2 border-accent-cherry text-accent-cherry rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Select Artist */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Selecione o Artista / Projeto <span className="text-accent-cherry">*</span>
              </label>
              <select
                required
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-3 font-black text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none"
              >
                <option value="" disabled>Escolha um artista...</option>
                {availableReps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Key */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Tom de Execução
                </label>
                <select
                  value={performanceKey || song.performanceKey || "C"}
                  onChange={(e) => setPerformanceKey(e.target.value)}
                  className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-3 font-black text-accent-cherry text-sm shadow-[2px_2px_0px_#161616] focus:outline-none font-[family-name:var(--font-oswald)]"
                >
                  {COMMON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  Tom Original da Obra
                </label>
                <div className="w-full bg-muted border-2 border-ink rounded-xl py-2.5 px-3 font-black text-ink text-sm shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-oswald)] select-none">
                  {song.performanceKey || "C"}
                </div>
              </div>
            </div>

            {/* Specific Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Observações de Arranjo (Opcional)
              </label>
              <input
                type="text"
                value={specificNotes}
                onChange={(e) => setSpecificNotes(e.target.value)}
                placeholder="Ex: 1 tom abaixo, voz solo, capotraste 2..."
                className="w-full bg-surface border-2 border-ink rounded-xl py-2.5 px-3.5 text-xs font-semibold text-ink shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-ink/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-ink bg-surface font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Cancelar
              </button>

              <StickerPillButton
                type="submit"
                variant="lime"
                disabled={isSubmitting || !selectedRepId}
                icon={<Check className="w-4 h-4 text-surface" />}
              >
                {isSubmitting ? "Vinculando..." : "Salvar Intersecção"}
              </StickerPillButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
