"use client";

import { useEffect, useState } from "react";
import { Search, Plus, GripVertical, X, Save, Send } from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { useRouter } from "next/navigation";
import { useAppStore, Song, Representative } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

const API_URL = getApiBaseUrl();

type SetlistItem = Song & {
  uid: string;
  performanceKey: string;
};

type Block = {
  id: string;
  blockNumber: number;
  title: string;
  items: SetlistItem[];
};

export default function GigConstructor() {
  const router = useRouter();
  const availableSongs = useAppStore((state) => state.songs);
  const representatives = useAppStore((state) => state.representatives);
  const fetchSongs = useAppStore((state) => state.fetchSongs);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);
  const invalidateCache = useAppStore((state) => state.invalidateCache);

  const [search, setSearch] = useState("");
  const [gigTitle, setGigTitle] = useState("");
  const [gigVenue, setGigVenue] = useState("");
  const [gigDate, setGigDate] = useState("");
  const [selectedRepId, setSelectedRepId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedGigId, setSavedGigId] = useState<string | null>(null);
  const [isSendingWA, setIsSendingWA] = useState(false);

  const [blocks, setBlocks] = useState<Block[]>([
    { id: "b1", blockNumber: 1, title: "Bloco 1", items: [] },
    { id: "b2", blockNumber: 2, title: "Bloco 2", items: [] },
    { id: "b3", blockNumber: 99, title: "Bis", items: [] },
  ]);

  useEffect(() => {
    fetchSongs();
    fetchRepresentatives();
  }, [fetchSongs, fetchRepresentatives]);

  const filteredSongs = availableSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.composer?.toLowerCase().includes(search.toLowerCase())
  );

  const addToBlock = (blockId: string, song: Song) => {
    setBlocks(blocks.map((b) => {
      if (b.id !== blockId) return b;
      const alreadyIn = b.items.some((i) => i.id === song.id);
      if (alreadyIn) return b;
      return {
        ...b,
        items: [...b.items, { ...song, uid: Math.random().toString(36).slice(2), performanceKey: song.originalKey || "C" }],
      };
    }));
    setSavedGigId(null); // reset saved state if user modifies
  };

  const removeFromBlock = (blockId: string, uid: string) => {
    setBlocks(blocks.map((b) =>
      b.id === blockId ? { ...b, items: b.items.filter((i) => i.uid !== uid) } : b
    ));
    setSavedGigId(null);
  };

  const updateKey = (blockId: string, uid: string, newKey: string) => {
    setBlocks(blocks.map((b) =>
      b.id === blockId ? { ...b, items: b.items.map((i) => i.uid === uid ? { ...i, performanceKey: newKey } : i) } : b
    ));
  };

  const saveGig = async () => {
    if (!gigTitle.trim()) { alert("Adicione um título para o show."); return; }

    setIsSaving(true);
    try {
      let orderCounter = 0;
      const items = blocks.flatMap((block) =>
        block.items.map((item) => ({
          songId: item.id,
          blockNumber: block.blockNumber,
          orderIndex: orderCounter++,
          performanceKey: item.performanceKey,
        }))
      );

      const body = {
        title: gigTitle,
        venue: gigVenue || null,
        eventDate: gigDate ? new Date(gigDate).toISOString().slice(0, 19) : null,
        representativeId: selectedRepId || null,
        items,
      };

      const res = await fetch(`${API_URL}/api/gigs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Falha ao salvar");
      const data = await res.json();
      setSavedGigId(data.id);
      invalidateCache("gigs");
      invalidateCache("stats");
      alert("✅ Show salvo com sucesso!");
    } catch (e) {
      alert("❌ Erro ao salvar o show.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendWhatsApp = async () => {
    if (!savedGigId) { alert("Salve o show antes de enviar."); return; }
    setIsSendingWA(true);
    try {
      const res = await fetch(`${API_URL}/api/gigs/${savedGigId}/send-whatsapp`, { method: "POST" });
      if (res.ok) alert("✅ Escala enviada no WhatsApp!");
      else alert("❌ Erro ao enviar. Verifique a Evolution API.");
    } catch {
      alert("❌ Falha de conexão.");
    } finally {
      setIsSendingWA(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4 min-h-[85vh]">

      {/* Left: Acervo */}
      <div className="w-full lg:w-1/3 flex flex-col bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden h-[800px]">
        <div className="p-5 bg-muted border-b-2 border-ink">
          <h2 className="text-2xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)] mb-3">Acervo</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar música..."
              className="w-full bg-canvas border-2 border-ink rounded-xl py-2 pl-10 pr-3 text-sm font-medium focus:outline-none shadow-[2px_2px_0px_#161616]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-canvas">
          {filteredSongs.map((song) => (
            <div key={song.id} className="bg-surface border-2 border-ink p-3 rounded-xl shadow-[3px_3px_0px_#161616]">
              <p className="font-bold text-sm uppercase font-[family-name:var(--font-oswald)] leading-tight">{song.title}</p>
              <p className="text-xs text-dim mb-2">{song.composer}</p>
              <div className="flex gap-1.5 flex-wrap">
                {blocks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => addToBlock(b.id, song)}
                    className="flex-1 flex items-center justify-center gap-0.5 bg-muted border border-ink py-1 rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-accent-lime transition-colors font-[family-name:var(--font-dm-sans)]"
                  >
                    <Plus className="w-2.5 h-2.5" /> {b.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredSongs.length === 0 && (
            <p className="text-center text-dim text-sm mt-8">Nenhuma música encontrada.</p>
          )}
        </div>
      </div>

      {/* Right: Setlist */}
      <div className="w-full lg:w-2/3 flex flex-col gap-5">
        {/* Show Info */}
        <div className="bg-surface border-2 border-ink rounded-3xl shadow-neo p-6 space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">Novo Show</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Título *</label>
              <input value={gigTitle} onChange={(e) => setGigTitle(e.target.value)}
                placeholder="Show Blue Note SP"
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Local</label>
              <input value={gigVenue} onChange={(e) => setGigVenue(e.target.value)}
                placeholder="Blue Note São Paulo"
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Data & Hora</label>
              <input type="datetime-local" value={gigDate} onChange={(e) => setGigDate(e.target.value)}
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-dim block mb-1">Artista / Projeto</label>
              <select value={selectedRepId} onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full border-2 border-ink rounded-xl py-2.5 px-4 font-medium shadow-[2px_2px_0px_#161616] focus:outline-none bg-surface">
                <option value="">Selecionar...</option>
                {representatives.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2 flex-wrap">
            <StickerPillButton onClick={saveGig} className={isSaving ? "opacity-60" : ""}>
              <Save className="w-4 h-4 mr-1 inline" />{isSaving ? "Salvando..." : "Salvar Show"}
            </StickerPillButton>
            {savedGigId && (
              <button onClick={sendWhatsApp} disabled={isSendingWA}
                className="flex items-center gap-2 bg-ink text-surface border-2 border-ink px-5 py-2.5 rounded-xl font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-60">
                <Send className="w-4 h-4" /> {isSendingWA ? "Enviando..." : "Enviar no WhatsApp"}
              </button>
            )}
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          {blocks.map((block) => (
            <div key={block.id} className="bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden">
              <div className="bg-ink text-surface px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest font-[family-name:var(--font-oswald)]">{block.title}</h3>
                <span className="text-accent-lime font-bold text-sm font-[family-name:var(--font-dm-sans)]">{block.items.length} faixas</span>
              </div>
              <div className="p-4 bg-canvas min-h-[100px]">
                {block.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-ink/20 rounded-xl p-6 text-dim text-sm font-medium text-center">
                    Adicione músicas para este bloco
                  </div>
                ) : (
                  <div className="space-y-2">
                    {block.items.map((item, idx) => (
                      <div key={item.uid} className="flex items-center gap-3 bg-surface border-2 border-ink p-3 rounded-xl shadow-[3px_3px_0px_#161616]">
                        <span className="text-dim cursor-grab"><GripVertical className="w-4 h-4" /></span>
                        <span className="text-dim font-bold w-5 text-sm">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm uppercase font-[family-name:var(--font-oswald)] truncate">{item.title}</p>
                          <p className="text-xs text-dim">{item.genre}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-muted border border-ink rounded-lg px-2 py-1">
                          <span className="text-[10px] font-bold text-dim">TOM</span>
                          <input type="text" value={item.performanceKey}
                            onChange={(e) => updateKey(block.id, item.uid, e.target.value)}
                            className="w-9 bg-surface border border-ink rounded px-1 text-center font-black text-accent-cherry text-sm focus:outline-none" />
                        </div>
                        <button onClick={() => removeFromBlock(block.id, item.uid)}
                          className="p-1.5 bg-surface border-2 border-ink rounded-lg hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
