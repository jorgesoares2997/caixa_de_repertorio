"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Plus, 
  X, 
  Save, 
  Mail, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Sparkles,
  Music2,
  FileDown
} from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { useRouter } from "next/navigation";
import { useAppStore, Song } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = getApiBaseUrl();

type SetlistItem = Song & {
  uid: string;
  performanceKey: string;
};

export default function GigConstructor() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const availableSongs = useAppStore((state) => state.songs);
  const representatives = useAppStore((state) => state.representatives);
  const fetchSongs = useAppStore((state) => state.fetchSongs);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);
  const addGig = useAppStore((state) => state.addGig);
  const invalidateCache = useAppStore((state) => state.invalidateCache);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.replace("/gigs");
    }
  }, [currentUser, router]);

  const [search, setSearch] = useState("");
  const [gigTitle, setGigTitle] = useState("");
  const [gigVenue, setGigVenue] = useState("");
  const [gigDate, setGigDate] = useState("");
  const [selectedRepId, setSelectedRepId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedGigId, setSavedGigId] = useState<string | null>(null);

  // Single continuous Setlist (sem blocos)
  const [setlist, setSetlist] = useState<SetlistItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(currentUser?.email || "jorgesoares2997@gmail.com");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchSongs();
      fetchRepresentatives();
    }
  }, [currentUser, fetchSongs, fetchRepresentatives]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  const filteredSongs = availableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.composer?.toLowerCase().includes(search.toLowerCase())
  );

  const addToSetlist = (song: Song) => {
    const newItem: SetlistItem = {
      ...song,
      uid: Math.random().toString(36).slice(2) + Date.now().toString(36),
      performanceKey: song.originalKey || "C",
    };
    setSetlist((prev) => [...prev, newItem]);
    setSavedGigId(null);
    setLastAddedId(song.id);
    setTimeout(() => {
      setLastAddedId((current) => (current === song.id ? null : current));
    }, 1200);
  };

  const removeFromSetlist = (uid: string) => {
    setSetlist((prev) => prev.filter((i) => i.uid !== uid));
    setSavedGigId(null);
  };

  const updateKey = (uid: string, newKey: string) => {
    setSetlist((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, performanceKey: newKey } : i))
    );
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= setlist.length) return;
    const updated = [...setlist];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSetlist(updated);
    setSavedGigId(null);
  };

  const saveGig = async () => {
    if (!gigTitle.trim()) {
      showToast("Adicione um título para o show.", "error");
      return;
    }

    if (setlist.length === 0) {
      showToast("Adicione pelo menos uma música ao show.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const items = setlist.map((item, idx) => ({
        songId: item.id,
        blockNumber: 1, // Único bloco contínuo
        orderIndex: idx,
        performanceKey: item.performanceKey,
      }));

      const body = {
        title: gigTitle,
        venue: gigVenue || null,
        eventDate: gigDate ? new Date(gigDate).toISOString().slice(0, 19) : null,
        representativeId: selectedRepId || null,
        items,
      };

      const created = await addGig(body);
      setSavedGigId(created.id);
      showToast("Show salvo com sucesso!", "success");
    } catch {
      showToast("Erro ao salvar o show. Tente novamente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmailWithPdf = async () => {
    if (!savedGigId) {
      showToast("Salve o show antes de enviar o e-mail.", "error");
      return;
    }

    if (!emailInput.trim()) {
      showToast("Informe o e-mail de destino.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = useAppStore.getState().currentUser?.token;
      const res = await fetch(`${API_URL}/api/gigs/${savedGigId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipientEmail: emailInput.trim() }),
      });

      if (res.ok) {
        setIsEmailModalOpen(false);
        showToast(`Escala enviada com PDF em anexo para ${emailInput}!`, "success");
      } else {
        showToast("Erro ao enviar e-mail. Verifique a configuração.", "error");
      }
    } catch {
      showToast("Falha de conexão ao enviar e-mail.", "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const downloadPdf = () => {
    if (!savedGigId) return;
    const a = document.createElement("a");
    a.href = `${API_URL}/api/gigs/${savedGigId}/pdf`;
    a.download = `setlist_${gigTitle.replace(/\s+/g, "_")}.pdf`;
    a.click();
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4 min-h-[85vh]">
      
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

      {/* Left Column: Acervo de Músicas */}
      <div className="w-full lg:w-1/3 flex flex-col bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden h-[800px]">
        <div className="p-5 bg-muted border-b-2 border-ink">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">Acervo</h2>
            <span className="text-xs font-bold text-dim bg-surface border border-ink px-2 py-0.5 rounded-md">
              {availableSongs.length} obras
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar música ou compositor..."
              className="w-full bg-canvas border-2 border-ink rounded-xl py-2 pl-10 pr-3 text-sm font-medium focus:outline-none shadow-[2px_2px_0px_#161616]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-canvas">
          {filteredSongs.map((song) => {
            const isJustAdded = lastAddedId === song.id;
            const inSetlistCount = setlist.filter((item) => item.id === song.id).length;

            return (
              <motion.div
                key={song.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`bg-surface border-2 border-ink p-3 rounded-xl shadow-[3px_3px_0px_#161616] transition-colors ${
                  isJustAdded ? "bg-accent-lime/20" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="font-bold text-sm uppercase font-[family-name:var(--font-oswald)] leading-tight truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-dim truncate">
                      {song.composer || "Compositor não informado"} {song.genre ? `• ${song.genre}` : ""}
                    </p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-muted border border-ink rounded text-[11px] font-black text-ink shrink-0">
                    {song.originalKey || "C"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-ink/10">
                  {inSetlistCount > 0 ? (
                    <span className="text-[10px] font-bold text-dim uppercase">
                      No show ({inSetlistCount}x)
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-dim">Disponível</span>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => addToSetlist(song)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border-2 border-ink shadow-[2px_2px_0px_#161616] transition-all font-[family-name:var(--font-dm-sans)] ${
                      isJustAdded
                        ? "bg-accent-lime text-ink"
                        : "bg-surface hover:bg-accent-lime text-ink active:translate-y-0.5 active:shadow-none"
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Sparkles className="w-3 h-3 text-ink animate-spin" />
                        <span>Adicionada!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-ink font-black" />
                        <span>Adicionar</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}

          {filteredSongs.length === 0 && (
            <div className="p-8 text-center text-dim text-sm">
              <Music2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhuma música encontrada no acervo.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Show Info & Continuous Setlist */}
      <div className="w-full lg:w-2/3 flex flex-col gap-5">
        
        {/* Show Metadata Card */}
        <div className="bg-surface border-2 border-ink rounded-3xl shadow-neo p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">
                Novo Show
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider text-dim mt-0.5">
                Bloco único contínuo • Repertório sob medida
              </p>
            </div>

            {savedGigId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-ink bg-accent-lime text-ink text-xs font-black uppercase shadow-[2px_2px_0px_#161616] self-start sm:self-auto">
                <Check className="w-3.5 h-3.5" /> Salvo
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Título do Show *</label>
              <input 
                value={gigTitle} 
                onChange={(e) => setGigTitle(e.target.value)}
                placeholder="Show Blue Note SP"
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all" 
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Local / Casa de Show</label>
              <input 
                value={gigVenue} 
                onChange={(e) => setGigVenue(e.target.value)}
                placeholder="Blue Note São Paulo"
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all" 
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Data & Hora</label>
              <input 
                type="datetime-local" 
                value={gigDate} 
                onChange={(e) => setGigDate(e.target.value)}
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Artista / Projeto Vinculado</label>
              <select 
                value={selectedRepId} 
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none bg-surface"
              >
                <option value="">Repertório Geral (Sem projeto específico)</option>
                {representatives.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2 flex-wrap items-center">
            <StickerPillButton onClick={saveGig} disabled={isSaving}>
              <Save className="w-4 h-4 mr-1 inline" />
              {isSaving ? "Salvando..." : "Salvar Show"}
            </StickerPillButton>

            {savedGigId && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center gap-2 bg-ink text-surface border-2 border-ink px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:-translate-y-0.5 transition-transform shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
                >
                  <Mail className="w-4 h-4 text-accent-lime" />
                  <span>Enviar por E-mail</span>
                </button>

                <button
                  type="button"
                  onClick={downloadPdf}
                  className="flex items-center gap-2 bg-muted text-ink border-2 border-ink px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:-translate-y-0.5 transition-transform shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Single Continuous Setlist (Sem Divisão de Blocos) */}
        <div className="bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden">
          <div className="bg-ink text-surface px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest font-[family-name:var(--font-oswald)]">
                Setlist do Show
              </h3>
              <p className="text-[11px] text-surface/70 font-medium">Ordem corrida contínua de execução</p>
            </div>
            <span className="bg-accent-lime text-ink font-black text-xs px-3 py-1 rounded-full border border-ink font-[family-name:var(--font-dm-sans)]">
              {setlist.length} {setlist.length === 1 ? "faixa" : "faixas"}
            </span>
          </div>

          <div className="p-4 bg-canvas min-h-[300px]">
            {setlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-ink/20 rounded-2xl p-12 text-center">
                <Music2 className="w-10 h-10 text-dim/50 mb-3" />
                <p className="text-ink font-bold text-base mb-1">Nenhuma música adicionada ainda</p>
                <p className="text-dim text-xs max-w-sm">
                  Selecione as músicas na lista do acervo à esquerda clicando no botão &quot;Adicionar&quot; para montar a sequência do seu show.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence>
                  {setlist.map((item, idx) => (
                    <motion.div
                      key={item.uid}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2.5 sm:gap-3 bg-surface border-2 border-ink p-3 rounded-xl shadow-[3px_3px_0px_#161616]"
                    >
                      {/* Order Controls */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveItem(idx, "up")}
                          title="Subir ordem"
                          className="p-1 rounded bg-muted hover:bg-accent-lime border border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowUp className="w-3 h-3 text-ink" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === setlist.length - 1}
                          onClick={() => moveItem(idx, "down")}
                          title="Descer ordem"
                          className="p-1 rounded bg-muted hover:bg-accent-lime border border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowDown className="w-3 h-3 text-ink" />
                        </button>
                      </div>

                      {/* Number Index */}
                      <span className="font-black text-ink text-sm w-6 text-center shrink-0">
                        {idx + 1}.
                      </span>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm uppercase font-[family-name:var(--font-oswald)] truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-dim truncate">
                          {item.composer || "Compositor não informado"} {item.genre ? `• ${item.genre}` : ""}
                        </p>
                      </div>

                      {/* Performance Key Input */}
                      <div className="flex items-center gap-1.5 bg-accent-lavender border-2 border-ink rounded-lg px-2 py-1 shrink-0">
                        <span className="text-[10px] font-black text-ink uppercase tracking-wider">Tom</span>
                        <input
                          type="text"
                          value={item.performanceKey}
                          onChange={(e) => updateKey(item.uid, e.target.value)}
                          className="w-10 bg-surface border border-ink rounded text-center font-black text-ink text-xs uppercase focus:outline-none"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromSetlist(item.uid)}
                        title="Remover música do show"
                        className="p-1.5 bg-surface border-2 border-ink rounded-lg hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Sender Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
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
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-1.5 rounded-lg border border-ink hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-canvas border-2 border-ink rounded-xl text-xs space-y-1">
                <p className="font-bold text-ink">Show: <span className="font-medium">{gigTitle}</span></p>
                <p className="font-bold text-ink">Faixas: <span className="font-medium">{setlist.length} músicas em bloco único</span></p>
                <p className="text-dim mt-1">
                  📎 O anexo conterá o arquivo <b>setlist_{gigTitle.replace(/\s+/g, "_")}.pdf</b> com a identidade visual do projeto.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1.5">
                  E-mail de Destino
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full border-2 border-ink rounded-xl py-2.5 px-3.5 font-medium text-sm shadow-[2px_2px_0px_#161616] focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex-1 py-2.5 border-2 border-ink rounded-xl font-bold text-xs uppercase hover:bg-muted transition-colors font-[family-name:var(--font-dm-sans)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={sendEmailWithPdf}
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
