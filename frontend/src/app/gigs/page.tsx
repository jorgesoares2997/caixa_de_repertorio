"use client";

import { useEffect, useState } from "react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Mic2, FileDown, FileText, Mail, Plus, X, Check, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAppStore, Gig } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";
import { getMaskedBadgeName } from "@/lib/artistPrivacy";

const API_URL = getApiBaseUrl();

export default function GigsPage() {
  const gigs = useAppStore((state) => state.gigs);
  const fetchGigs = useAppStore((state) => state.fetchGigs);
  const currentUser = useAppStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === "ADMIN";

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Email modal state
  const [selectedGigForEmail, setSelectedGigForEmail] = useState<Gig | null>(null);
  const [recipientEmail, setRecipientEmail] = useState(currentUser?.email || "jorgesoares2997@gmail.com");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const handleSendEmail = async () => {
    if (!selectedGigForEmail) return;
    if (!recipientEmail.trim()) {
      showToast("Por favor, digite o e-mail de destino.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = useAppStore.getState().currentUser?.token;
      const res = await fetch(`${API_URL}/api/gigs/${selectedGigForEmail.id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipientEmail: recipientEmail.trim() }),
      });

      if (res.ok) {
        setSelectedGigForEmail(null);
        showToast(`Escala e PDF enviados com sucesso para ${recipientEmail}!`, "success");
      } else {
        showToast("Erro ao enviar e-mail. Verifique a configuração.", "error");
      }
    } catch {
      showToast("Falha de conexão com o servidor.", "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const downloadPdf = async (id: string, title: string, type: "show" | "study" = "show") => {
    const key = `${id}-${type}`;
    if (downloadingKey) return;
    setDownloadingKey(key);
    showToast(`Gerando PDF de ${type === "study" ? "Estudo" : "Show"}...`, "success");

    try {
      const token = useAppStore.getState().currentUser?.token;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Try dedicated path (/api/gigs/{id}/pdf/{type})
      let res = await fetch(`${API_URL}/api/gigs/${id}/pdf/${type}`, { headers });

      // 2. Fallback to query param (/api/gigs/{id}/pdf?type={type}) if 404
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_URL}/api/gigs/${id}/pdf?type=${type}`, { headers });
      }

      // 3. Fallback to legacy endpoint if still 404
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_URL}/api/gigs/${id}/pdf`, { headers });
      }

      if (!res.ok) {
        throw new Error(`Servidor retornou status ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `setlist_${type === "study" ? "estudo" : "show"}_${title.trim().replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      showToast("PDF baixado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao baixar PDF:", err);
      showToast("Não foi possível baixar o PDF. Verifique se o servidor está ativo.", "error");
    } finally {
      setDownloadingKey(null);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#161616] font-[family-name:var(--font-dm-sans)] font-bold text-sm select-none ${
              toast.type === "success" 
                ? "bg-accent-lime text-ink" 
                : "bg-accent-cherry text-surface"
            }`}
          >
            {toast.type === "success" ? (
              <span className="w-6 h-6 rounded-full bg-ink text-accent-lime flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 font-black" />
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full bg-surface text-ink flex items-center justify-center shrink-0">
                <X className="w-4 h-4 font-black" />
              </span>
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">
            Shows & Gigs
          </h1>
          <p className="text-dim font-medium mt-2">
            Setlists agendados. Exporte em PDF diagramado ou envie a escala por e-mail com anexo.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchGigs(true)}
            title="Atualizar lista de shows do servidor"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted text-ink font-black uppercase tracking-wider text-xs rounded-xl border-2 border-ink shadow-[2.5px_2.5px_0px_#161616] hover:bg-surface hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#161616] transition-all font-[family-name:var(--font-dm-sans)]"
          >
            <RefreshCw className="w-4 h-4 text-ink" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {isAdmin && (
            <StickerPillButton onClick={() => window.location.href = "/gigs/new"}>
              <Plus className="w-4 h-4 mr-1 inline" /> Novo Show
            </StickerPillButton>
          )}
        </div>
      </div>

      {gigs.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-ink/20 rounded-3xl p-16 text-center">
          <p className="text-dim text-lg font-medium mb-6">Nenhum show cadastrado ainda.</p>
          {isAdmin && (
            <Link href="/gigs/new">
              <StickerPillButton>Criar Primeiro Show</StickerPillButton>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {gigs.map((gig, i) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden"
            >
              <div className="bg-ink text-surface px-6 py-5 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">
                    {gig.title}
                  </h3>
                  {gig.representativeName && (
                    <p className="text-accent-lime text-sm font-bold mt-0.5 flex items-center gap-1">
                      <Mic2 className="w-3 h-3" /> {getMaskedBadgeName(gig.representativeName, undefined, undefined, isAdmin)}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-surface/70 font-medium space-y-1">
                  {gig.eventDate && (
                    <p className="flex items-center gap-1 justify-end">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(gig.eventDate)}
                    </p>
                  )}
                  {gig.venue && (
                    <p className="flex items-center gap-1 justify-end">
                      <MapPin className="w-3.5 h-3.5" /> {gig.venue}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-5 bg-canvas border-b-2 border-ink min-h-[80px]">
                {gig.items.length === 0 ? (
                  <p className="text-dim italic text-sm">Nenhuma faixa adicionada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {gig.items.slice(0, 8).map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1 bg-surface border border-ink px-2 py-1 rounded-lg text-xs font-bold font-[family-name:var(--font-dm-sans)]">
                        <span className="text-accent-cherry font-black">{item.performanceKey}</span>
                        {item.songTitle}
                      </span>
                    ))}
                    {gig.items.length > 8 && (
                      <span className="px-2 py-1 bg-muted border border-ink rounded-lg text-xs font-bold">
                        +{gig.items.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 p-3 bg-surface border-t-2 border-ink">
                <button
                  disabled={downloadingKey !== null}
                  onClick={() => downloadPdf(gig.id, gig.title, "show")}
                  title="Baixar PDF de Show (1 página única para palco)"
                  className="flex-1 min-w-[105px] flex items-center justify-center gap-1.5 bg-accent-lime text-ink border-2 border-ink py-2.5 rounded-xl font-black text-xs uppercase hover:-translate-y-0.5 active:translate-y-0 transition-transform shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] disabled:opacity-60"
                >
                  {downloadingKey === `${gig.id}-show` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>PDF Show</span>
                </button>
                <button
                  disabled={downloadingKey !== null}
                  onClick={() => downloadPdf(gig.id, gig.title, "study")}
                  title="Baixar PDF de Estudo (com nível de domínio)"
                  className="flex-1 min-w-[105px] flex items-center justify-center gap-1.5 bg-surface text-ink border-2 border-ink py-2.5 rounded-xl font-bold text-xs uppercase hover:-translate-y-0.5 active:translate-y-0 transition-transform shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] disabled:opacity-60"
                >
                  {downloadingKey === `${gig.id}-study` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-lavender" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-accent-lavender" />
                  )}
                  <span>PDF Estudo</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedGigForEmail(gig);
                      setRecipientEmail(currentUser?.email || "jorgesoares2997@gmail.com");
                    }}
                    title="Enviar ambos os PDFs por e-mail"
                    className="flex-none px-3.5 flex items-center justify-center gap-1.5 bg-ink text-surface border-2 border-ink py-2.5 rounded-xl font-bold text-xs uppercase hover:-translate-y-0.5 active:translate-y-0 transition-transform shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
                  >
                    <Mail className="w-3.5 h-3.5 text-accent-lime" />
                    <span className="hidden sm:inline">E-mail</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Email Sender Modal */}
      <AnimatePresence>
        {selectedGigForEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border-3 border-ink rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[6px_6px_0px_#161616] space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent-lime border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_#161616]">
                    <Mail className="w-5 h-5 text-ink" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">
                      Enviar Escala por E-mail
                    </h3>
                    <p className="text-xs text-dim">Com o PDF diagramado em anexo</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGigForEmail(null)}
                  className="p-1.5 rounded-lg border border-ink hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-canvas border-2 border-ink rounded-xl text-xs space-y-1">
                <p className="font-bold text-ink">Show: <span className="font-medium">{selectedGigForEmail.title}</span></p>
                <p className="font-bold text-ink">Faixas: <span className="font-medium">{selectedGigForEmail.items.length} músicas</span></p>
                <p className="text-dim mt-1">
                  📎 O anexo conterá 2 arquivos: o <b>PDF de Show</b> (1 página para palco) e o <b>PDF de Estudo</b> (com nível de domínio).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1.5">
                  E-mail de Destino
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full border-2 border-ink rounded-xl py-2.5 px-3.5 font-medium text-sm shadow-[2px_2px_0px_#161616] focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGigForEmail(null)}
                  className="flex-1 py-2.5 border-2 border-ink rounded-xl font-bold text-xs uppercase hover:bg-muted transition-colors font-[family-name:var(--font-dm-sans)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmail}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-lime border-2 border-ink rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_#161616] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 font-[family-name:var(--font-dm-sans)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSendingEmail ? "Enviando..." : "Enviar Agora"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
