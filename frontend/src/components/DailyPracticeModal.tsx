"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flame,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
} from "lucide-react";
import { MasteryRating } from "./MasteryRating";
import { StickerPillButton } from "./StickerPillButton";
import { getApiBaseUrl } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { getMaskedArtistName, REP_TYPE_LABELS } from "@/lib/artistPrivacy";

export type PracticeSong = {
  id: string;
  title: string;
  composer?: string;
  genre?: string;
  originalKey?: string;
  performanceKey?: string;
  artistName?: string;
  masteryLevel: number;
  tempoBpm?: number;
  notes?: string;
  drill?: string;
};

export type ActiveFocus = {
  isWeeklyActive: boolean;
  expiresAt: string | null;
  representativeIds: string[];
  representativeNames: string[];
};

export type PracticePlanResponse = {
  total: number;
  songs: PracticeSong[];
  activeFocus?: ActiveFocus;
};

interface DailyPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyPracticeModal({ isOpen, onClose }: DailyPracticeModalProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === "ADMIN";

  const representatives = useAppStore((state) => state.representatives);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);

  const [practicePlan, setPracticePlan] = useState<PracticePlanResponse | null>(null);
  const [selectedRepIds, setSelectedRepIds] = useState<string[]>([]);
  const [activeFocus, setActiveFocus] = useState<ActiveFocus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSavingFocus, setIsSavingFocus] = useState(false);
  const [targetEmail, setTargetEmail] = useState("jorgesoares2997@gmail.com");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const API_URL = getApiBaseUrl();

  // Load representatives on modal open
  useEffect(() => {
    if (isOpen) {
      if (representatives.length === 0) {
        fetchRepresentatives();
      }
      fetchPracticePlan();
    }
  }, [isOpen]);

  const fetchPracticePlan = async (repIdsToFilter?: string[]) => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const ids = repIdsToFilter !== undefined ? repIdsToFilter : selectedRepIds;
      const params = new URLSearchParams();
      if (ids.length > 0) {
        params.set("representativeIds", ids.join(","));
      }

      const url = `${API_URL}/api/practice/today${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao carregar sugestões de estudo");
      const data: PracticePlanResponse = await res.json();
      setPracticePlan(data);

      if (data.activeFocus) {
        setActiveFocus(data.activeFocus);
        // If initial load and no local override set, initialize selectedRepIds with activeFocus
        if (repIdsToFilter === undefined && data.activeFocus.isWeeklyActive) {
          setSelectedRepIds(data.activeFocus.representativeIds || []);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Não foi possível gerar as sugestões de hoje.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRepresentative = (repId: string) => {
    let nextIds: string[];
    if (selectedRepIds.includes(repId)) {
      nextIds = selectedRepIds.filter((id) => id !== repId);
    } else {
      nextIds = [...selectedRepIds, repId];
    }
    setSelectedRepIds(nextIds);
    fetchPracticePlan(nextIds);
  };

  const handleSetGeneral = () => {
    setSelectedRepIds([]);
    fetchPracticePlan([]);
  };

  const handleSaveWeeklyFocus = async (idsToSave: string[]) => {
    if (!isAdmin) return;
    setIsSavingFocus(true);
    setFeedback(null);
    try {
      const token = useAppStore.getState().currentUser?.token;
      const res = await fetch(`${API_URL}/api/practice/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ representativeIds: idsToSave }),
      });
      const data: ActiveFocus = await res.json();
      setActiveFocus(data);

      if (data.isWeeklyActive) {
        const formattedExp = data.expiresAt
          ? new Date(data.expiresAt + "T00:00:00").toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })
          : "domingo";
        setFeedback({
          type: "success",
          message: `Foco semanal salvo! Válido até domingo (${formattedExp}), após o qual retornará automaticamente ao modo Geral.`,
        });
      } else {
        setFeedback({
          type: "success",
          message: "Foco resetado para o repertório Geral com sucesso!",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Erro ao salvar foco semanal.",
      });
    } finally {
      setIsSavingFocus(false);
    }
  };

  const handleSendEmail = async () => {
    if (!isAdmin) return;
    setIsSendingEmail(true);
    setFeedback(null);
    try {
      const token = useAppStore.getState().currentUser?.token;
      const res = await fetch(`${API_URL}/api/practice/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: targetEmail.trim() || undefined,
          representativeIds: selectedRepIds.length > 0 ? selectedRepIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Erro ao disparar e-mail.");
      }
      setFeedback({
        type: "success",
        message: `E-mail enviado com sucesso para ${targetEmail}! (Verifique a Caixa de Entrada ou aba Spam/Atualizações).`,
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

  // Format expiration date for UI
  const formattedExpirationSunday = useMemo(() => {
    if (activeFocus?.expiresAt) {
      return new Date(activeFocus.expiresAt + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
    // Calculate upcoming Sunday
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }, [activeFocus]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
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
          className="relative bg-surface w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-5 md:px-7 py-4 md:py-5 bg-accent-lime border-b-2 border-ink flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                <Flame className="w-5 h-5 text-accent-cherry fill-accent-cherry" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
                  Rotina de Estudo Diário
                </h3>
                <p className="text-xs font-bold text-ink/80 uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Algoritmo inteligente de retenção e fluência musical
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-5 bg-canvas">
            {/* WEEKLY ARTIST FOCUS FILTER SECTION */}
            <div className="bg-surface border-2 border-ink rounded-2xl p-4 md:p-5 shadow-[3px_3px_0px_#161616] space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-accent-lavender border border-ink flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-ink font-[family-name:var(--font-dm-sans)]">
                    Foco Semanal de Shows & Artistas
                  </h4>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-lavender/40 border border-ink rounded-lg text-[10px] font-bold text-dim font-[family-name:var(--font-dm-sans)]">
                  <Calendar className="w-3 h-3 text-ink shrink-0" />
                  <span>Expira no domingo ({formattedExpirationSunday})</span>
                </div>
              </div>

              <p className="text-xs text-dim font-medium leading-relaxed font-[family-name:var(--font-dm-sans)]">
                Selecione um ou mais artistas para restringir o sorteio às músicas e tons das apresentações desta semana. Ao virar a semana (domingo), o sorteio retorna automaticamente para o modo Geral.
              </p>

              {/* Artist Chips (Multi-Select) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Option: Geral */}
                <button
                  type="button"
                  onClick={handleSetGeneral}
                  className={`px-3 py-1.5 rounded-xl border-2 border-ink text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
                    selectedRepIds.length === 0
                      ? "bg-ink text-surface scale-[1.02]"
                      : "bg-surface text-ink hover:bg-muted"
                  }`}
                >
                  Geral (Todos)
                </button>

                {/* Artists list */}
                {representatives
                  .filter((rep) => rep.name.toLowerCase() !== "geral")
                  .map((rep, idx) => {
                  const isSelected = selectedRepIds.includes(rep.id);
                  const displayName = getMaskedArtistName(rep, idx, isAdmin);

                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => handleToggleRepresentative(rep.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
                        isSelected
                          ? "bg-accent-lime text-ink scale-[1.02] shadow-[3px_3px_0px_#161616]"
                          : "bg-surface text-ink hover:bg-accent-lavender/40"
                      }`}
                    >
                      {!isAdmin && <Lock className="w-3 h-3 text-ink" />}
                      <span>{displayName}</span>
                      {isSelected && <span className="text-[10px] bg-ink text-surface px-1.5 py-0.2 rounded-full ml-0.5">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Admin Save/Reset Weekly Focus Buttons */}
              {isAdmin && (
                <div className="pt-2 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="text-[11px] font-bold text-dim font-[family-name:var(--font-dm-sans)]">
                    {selectedRepIds.length > 0 ? (
                      <span className="text-ink">
                        🎯 <strong>{selectedRepIds.length}</strong> artista(s) selecionado(s) para o shuffle.
                      </span>
                    ) : (
                      <span>Acervo Geral ativo (sem filtro de artista).</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFocus?.isWeeklyActive && (
                      <button
                        type="button"
                        onClick={() => handleSaveWeeklyFocus([])}
                        disabled={isSavingFocus}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink bg-surface hover:bg-accent-cherry/20 text-ink text-[11px] font-bold uppercase transition-all shadow-[1px_1px_0px_#161616]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Voltar p/ Geral</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveWeeklyFocus(selectedRepIds)}
                      disabled={isSavingFocus}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink bg-accent-lavender hover:bg-accent-lime text-ink text-[11px] font-black uppercase tracking-wider transition-all shadow-[1px_1px_0px_#161616] active:translate-y-0.5 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingFocus ? "Salvando..." : "Fixar como Foco da Semana"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Banner & Shuffle Trigger */}
            <div className="bg-surface border-2 border-ink rounded-2xl p-4 shadow-[2px_2px_0px_#161616] flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-dim uppercase tracking-wider block font-[family-name:var(--font-dm-sans)]">
                  Plano de Estudo Sugerido · 5 Músicas
                </span>
                <p className="text-xs text-ink font-semibold mt-0.5">
                  2 obras em aprendizado (nível 1-2), 2 em consolidação (3-4) e 1 de manutenção rápida (5).
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchPracticePlan(selectedRepIds)}
                disabled={isLoading}
                title="Sortear novas sugestões com base no filtro"
                className="inline-flex items-center gap-1.5 p-2.5 rounded-xl border-2 border-ink bg-muted hover:bg-accent-lavender text-ink transition-colors shadow-[2px_2px_0px_#161616] active:translate-y-0.5"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline font-[family-name:var(--font-dm-sans)]">
                  Sortear Novas
                </span>
              </button>
            </div>

            {/* Feedback Message Toast */}
            {feedback && (
              <div
                className={`p-4 border-2 border-ink rounded-2xl flex items-start gap-3 text-sm font-bold shadow-[2px_2px_0px_#161616] animate-in fade-in duration-200 ${
                  feedback.type === "success"
                    ? "bg-accent-lime/30 text-ink"
                    : "bg-accent-cherry/20 text-accent-cherry"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-ink shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-accent-cherry shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{feedback.message}</span>
              </div>
            )}

            {/* Song List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-dim">
                <RefreshCw className="w-8 h-8 animate-spin text-ink" />
                <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Sorteando repertório direcionado...
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

                  const displayKey = song.performanceKey || song.originalKey || "C";

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
                              Tom: {displayKey}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-dim flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{song.composer || "Autor desconhecido"}</span>
                            {song.genre && (
                              <>
                                <span>•</span>
                                <span>{song.genre}</span>
                              </>
                            )}
                            {song.artistName && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-canvas border border-ink/40 rounded text-[11px] font-bold text-ink">
                                  🎤 {isAdmin ? song.artistName : "Projeto Confidencial"}
                                </span>
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
              <div className="py-10 text-center text-dim font-bold uppercase text-xs border-2 border-dashed border-ink/20 rounded-2xl">
                Nenhuma música disponível para o plano com os artistas selecionados.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 md:px-7 py-4 bg-surface border-t-2 border-ink flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-dim font-[family-name:var(--font-dm-sans)] flex items-center gap-2 w-full md:w-auto">
              {isAdmin ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Mail className="w-4 h-4 text-ink shrink-0" />
                  <span className="text-dim shrink-0">Para:</span>
                  <input
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="bg-canvas border border-ink rounded-lg px-2 py-1 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-accent-lime max-w-[220px]"
                    title="E-mail de destino para envio da rotina diária"
                  />
                </div>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-dim italic">
                  <Lock className="w-3 h-3 text-ink" /> Modo Visitante: disparo de e-mail exclusivo para o Administrador.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border-2 border-ink bg-canvas font-bold text-xs uppercase tracking-wider text-ink hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
              >
                Fechar
              </button>

              {isAdmin && (
                <StickerPillButton
                  type="button"
                  variant="cherry"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || isLoading}
                  className={isSendingEmail ? "opacity-70 pointer-events-none" : ""}
                  icon={<Mail className="w-4 h-4 text-surface" />}
                >
                  {isSendingEmail ? "Disparando..." : "Disparar p/ Meu E-mail"}
                </StickerPillButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
