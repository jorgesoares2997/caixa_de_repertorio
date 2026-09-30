"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { StickerPillButton } from "./StickerPillButton";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemDescription?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemDescription,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-surface w-full max-w-md rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10 p-6 space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-cherry/20 border-2 border-ink flex items-center justify-center text-accent-cherry shrink-0 shadow-[2px_2px_0px_#161616]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-1.5 border-2 border-ink rounded-xl bg-surface hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
              {title}
            </h3>
            <p className="text-sm font-medium text-dim mt-2 leading-relaxed">
              {itemDescription || "Esta ação removerá a música do acervo central e de todos os vínculos. Deseja continuar?"}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-ink/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-ink bg-surface font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-ink bg-accent-cherry text-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Excluindo..." : "Sim, Excluir"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
