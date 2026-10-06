"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Mail, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Music2 } from "lucide-react";
import { MasteryRating } from "./MasteryRating";
import { StickerPillButton } from "./StickerPillButton";
import { getApiBaseUrl } from "@/lib/utils";

export type PracticeSong = {
  id: string;
  title: string;
  composer?: string;
  genre?: string;
  originalKey?: string;
  masteryLevel: number;
  tempoBpm?: number;
  notes?: string;
};

export type PracticePlanResponse = {
  date: string;
  totalSongs: number;
  songs: PracticeSong[];
};

interface DailyPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyPracticeModal({ isOpen, onClose }: DailyPracticeModalProps) {
  const [practicePlan, setPracticePlan] = useState<PracticePlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const API_URL = getApiBaseUrl();

  const fetchPracticePlan = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/practice/today`);
      if (!res.ok) throw new Error("Erro ao carregar sugestões de estudo");
      const data: PracticePlanResponse = await res.json();
      setPracticePlan(data);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Não foi possível gerar as sugestões de hoje.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPracticePlan();
    }
  }, [isOpen]);

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/practice/send-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Erro ao disparar e-mail.");
      }
      setFeedback({
        type: "success",
        message: data.message || "E-mail de estudo diário enviado com sucesso!",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Falha ao enviar e-mail. Verifique o servidor SMTP.",
      });
    } finally {
      setIsSendingEmail(false);
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
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-accent-lime border-b-2 border-ink flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                <Flame className="w-5 h-5 text-accent-cherry fill-accent-cherry" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  Rotina de Estudo Diário
                </h3>
                <p className="text-xs font-bold text-ink/80 uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Algoritmo inteligente de retenção e fluência
                </p>
              </div>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas">
            {/* Explanatory Banner */}
            <div className="bg-surface border-2 border-ink rounded-2xl p-4 shadow-[2px_2px_0px_#161616] flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-dim uppercase tracking-wider block font-[family-name:var(--font-dm-sans)]">
                  Plano do Dia · 5 Músicas
                </span>
                <p className="text-xs text-ink font-semibold mt-0.5">
                  2 obras em aprendizado (nível 1-2), 2 em consolidação (3-4) e 1 de manutenção rápida (5).
                </p>
              </div>
              <button
                type="button"
                onClick={fetchPracticePlan}
                disabled={isLoading}
                title="Sortear novas sugestões"
                className="p-2.5 rounded-xl border-2 border-ink bg-muted hover:bg-accent-lavender text-ink transition-colors shadow-[2px_2px_0px_#161616]"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Feedback message */}
            {feedback && (
              <div
                className={`p-4 border-2 border-ink rounded-2xl flex items-center gap-3 text-sm font-bold shadow-[2px_2px_0px_#161616] ${
                  feedback.type === "success"
                    ? "bg-accent-lime/30 text-ink"
                    : "bg-accent-cherry/20 text-accent-cherry"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-ink shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-accent-cherry shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Song List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-dim">
                <RefreshCw className="w-8 h-8 animate-spin text-ink" />
                <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Selecionando repertório do dia...
                </span>
              </div>
            ) : practicePlan && practicePlan.songs.length > 0 ? (
              <div className="space-y-3">
                {practicePlan.songs.map((song, index) => {
                  let drillLabel = "Consolidação";
                  let drillColor = "bg-accent-lavender";
                  if (song.masteryLevel <= 2) {
                    drillLabel = "Estrutura & Harmonia";
                    drillColor = "bg-accent-orange/20 text-accent-orange";
                  } else if (song.masteryLevel === 5) {
                    drillLabel = "Fluência & Dinâmica";
                    drillColor = "bg-accent-lime/30 text-ink";
                  }

                  return (
                    <div
                      key={song.id || index}
                      className="bg-surface border-2 border-ink rounded-2xl p-4 shadow-[3px_3px_0px_#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:translate-x-1 transition-transform"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-ink text-surface font-black text-sm flex items-center justify-center font-[family-name:var(--font-oswald)]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base uppercase text-ink font-[family-name:var(--font-oswald)]">
                              {song.title}
                            </span>
                            <span className="px-2 py-0.5 bg-accent-lavender border border-ink rounded-md text-xs font-black font-[family-name:var(--font-oswald)] text-ink">
                              {song.originalKey || "C"}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-dim flex items-center gap-2 mt-0.5">
                            <span>{song.composer || "Autor desconhecido"}</span>
                            {song.genre && (
                              <>
                                <span>•</span>
                                <span>{song.genre}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/10">
                        <span className={`px-2.5 py-1 rounded-lg border border-ink text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] ${drillColor}`}>
                          {drillLabel}
                        </span>
                        <MasteryRating level={song.masteryLevel} size="sm" readOnly />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-dim font-bold uppercase text-xs">
                Nenhuma música disponível para o plano de estudo.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-dim font-[family-name:var(--font-dm-sans)]">
              Receba diariamente às 08:00 no seu e-mail
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border-2 border-ink bg-canvas font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Fechar
              </button>

              <StickerPillButton
                type="button"
                variant="cherry"
                onClick={handleSendEmail}
                disabled={isSendingEmail || isLoading}
                className={isSendingEmail ? "opacity-70 pointer-events-none" : ""}
                icon={<Mail className="w-4 h-4 text-surface" />}
              >
                {isSendingEmail ? "Enviando E-mail..." : "Disparar p/ Meu E-mail"}
              </StickerPillButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
