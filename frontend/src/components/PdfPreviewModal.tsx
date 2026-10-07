"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileDown, Eye, RefreshCw, Printer, ExternalLink, Sparkles } from "lucide-react";
import { StickerPillButton } from "./StickerPillButton";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  pdfBlobUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
  fileName: string;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  pdfBlobUrl,
  isLoading,
  onDownload,
  fileName,
}: PdfPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-canvas border-b-2 border-ink flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent-lavender border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616] shrink-0">
                <Eye className="w-5 h-5 text-ink" />
              </div>
              <div className="truncate">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)] truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pdfBlobUrl && (
                <button
                  type="button"
                  onClick={() => window.open(pdfBlobUrl, "_blank")}
                  title="Abrir em nova aba"
                  className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616]"
                >
                  <ExternalLink className="w-4 h-4 text-ink" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body / PDF Viewer Frame */}
          <div className="flex-1 bg-muted/40 relative overflow-hidden flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center text-dim">
                <RefreshCw className="w-10 h-10 animate-spin text-ink" />
                <span className="font-bold uppercase tracking-wider text-sm font-[family-name:var(--font-dm-sans)]">
                  Renderizando documento PDF com tipografia iText...
                </span>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0 bg-white"
                title="Pré-visualização do PDF"
              />
            ) : (
              <div className="text-center p-8 text-dim font-bold uppercase text-sm">
                Não foi possível carregar o documento PDF.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-surface border-t-2 border-ink flex items-center justify-between gap-4 shrink-0">
            <span className="text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] truncate hidden sm:inline">
              Documento: <span className="text-ink">{fileName}</span>
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-ink bg-canvas font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Fechar
              </button>

              <StickerPillButton
                variant="lime"
                onClick={onDownload}
                disabled={isLoading || !pdfBlobUrl}
                icon={<FileDown className="w-4 h-4 text-surface" />}
              >
                Baixar Arquivo PDF
              </StickerPillButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
