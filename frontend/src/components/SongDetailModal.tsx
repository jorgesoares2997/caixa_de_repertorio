"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Music, UserCheck, Clock, FileText, Edit3, Trash2, Tag, KeyRound, ExternalLink, Users } from "lucide-react";
import { MasteryRating } from "./MasteryRating";
import { SongData } from "./SongFormModal";
import { RepresentativeLink } from "@/lib/store";
import { GenreBadgePicker } from "./GenreBadgePicker";

interface SongDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: (SongData & { lastPracticedAt?: string }) | null;
  onEdit: (song: SongData) => void;
  onDelete: (song: SongData) => void;
  onUpdateGenre?: (newGenre: string) => Promise<void> | void;
}

export function SongDetailModal({
  isOpen,
  onClose,
  song,
  onEdit,
  onDelete,
  onUpdateGenre,
}: SongDetailModalProps) {
  if (!isOpen || !song) return null;

  const repLinks = song.representativeLinks || [];

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
          className="relative bg-surface w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-canvas border-b-2 border-ink flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="mb-2">
                {onUpdateGenre ? (
                  <GenreBadgePicker
                    genre={song.genre}
                    onUpdate={onUpdateGenre}
                  />
                ) : (
                  <span className="inline-block px-3 py-1 bg-accent-lavender border-2 border-ink rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                    {song.genre || "Repertório Geral"}
                  </span>
                )}
              </div>
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                {song.title}
              </h3>
              <p className="text-sm font-semibold text-dim mt-0.5">
                {song.composer ? `Compositor: ${song.composer}` : "Compositor não informado"}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-canvas border-2 border-ink rounded-2xl p-3 text-center shadow-[2px_2px_0px_#161616]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dim block font-[family-name:var(--font-dm-sans)]">
                  Tom Original
                </span>
                <span className="text-2xl font-black text-accent-cherry font-[family-name:var(--font-oswald)]">
                  {song.originalKey || "C"}
                </span>
              </div>

              <div className="bg-canvas border-2 border-ink rounded-2xl p-3 text-center shadow-[2px_2px_0px_#161616]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dim block font-[family-name:var(--font-dm-sans)]">
                  Andamento
                </span>
                <span className="text-2xl font-black text-ink font-[family-name:var(--font-oswald)]">
                  {song.tempoBpm ? `${song.tempoBpm} BPM` : "—"}
                </span>
              </div>

              <div className="bg-canvas border-2 border-ink rounded-2xl p-3 text-center shadow-[2px_2px_0px_#161616]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dim block font-[family-name:var(--font-dm-sans)]">
                  Domínio
                </span>
                <div className="flex justify-center mt-1">
                  <MasteryRating level={song.masteryLevel || 0} size="sm" readOnly />
                </div>
              </div>
            </div>

            {/* Linked Representatives Section */}
            <div className="bg-canvas border-2 border-ink rounded-2xl p-4 shadow-[2px_2px_0px_#161616]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dim mb-3 font-[family-name:var(--font-dm-sans)]">
                <Users className="w-4 h-4 text-ink" /> Artistas & Projetos Vinculados
              </div>

              {repLinks.length > 0 ? (
                <div className="space-y-2">
                  {repLinks.map((link, idx) => (
                    <div
                      key={link.representativeId || idx}
                      className="bg-surface border-2 border-ink rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-[1px_1px_0px_#161616]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-accent-lavender border border-ink flex items-center justify-center font-bold text-xs">
                          {link.representativeName?.charAt(0) || "A"}
                        </div>
                        <span className="font-black text-sm uppercase text-ink font-[family-name:var(--font-oswald)]">
                          {link.representativeName || "Artista"}
                        </span>
                        {link.specificNotes && (
                          <span className="text-[11px] text-dim font-medium ml-1">
                            ({link.specificNotes})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
                          Tom:
                        </span>
                        <span className="px-2 py-0.5 bg-accent-lime border border-ink rounded-md text-xs font-black font-[family-name:var(--font-oswald)] text-ink">
                          {link.performanceKey || song.originalKey || "C"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dim font-medium italic">
                  Esta música ainda não foi vinculada a nenhum projeto ou cantor específico.
                </p>
              )}
            </div>

            {/* Notes / Cifra */}
            <div className="bg-canvas border-2 border-ink rounded-2xl p-4 shadow-[2px_2px_0px_#161616]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dim mb-2 font-[family-name:var(--font-dm-sans)]">
                <FileText className="w-4 h-4 text-ink" /> Observações & Cifra
              </div>
              <p className="text-sm font-medium text-ink whitespace-pre-wrap leading-relaxed">
                {song.notes || "Nenhuma observação ou anotação cadastrada para esta música."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-canvas border-t-2 border-ink flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(song);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-accent-cherry text-accent-cherry bg-surface font-bold text-xs uppercase tracking-wider hover:bg-accent-cherry hover:text-surface transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-ink bg-surface font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(song);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-ink bg-accent-lime text-ink font-bold text-xs uppercase tracking-wider hover:translate-y-[-1px] transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                <Edit3 className="w-4 h-4" /> Editar / Revisar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
