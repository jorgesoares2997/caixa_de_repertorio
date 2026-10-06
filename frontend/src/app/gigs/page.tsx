"use client";

import { useEffect, useState } from "react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { motion } from "framer-motion";
import { Calendar, MapPin, Mic2, FileDown, Send, Plus } from "lucide-react";
import Link from "next/link";
import { useAppStore, Gig } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

const API_URL = getApiBaseUrl();

export default function GigsPage() {
  const gigs = useAppStore((state) => state.gigs);
  const fetchGigs = useAppStore((state) => state.fetchGigs);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const sendWhatsApp = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`${API_URL}/api/gigs/${id}/send-whatsapp`, { method: "POST" });
      if (res.ok) alert("✅ Escala enviada no WhatsApp!");
      else alert("❌ Erro ao enviar. Verifique a Evolution API.");
    } catch {
      alert("❌ Falha de conexão.");
    } finally {
      setSendingId(null);
    }
  };

  const downloadPdf = (id: string, title: string) => {
    const a = document.createElement("a");
    a.href = `${API_URL}/api/gigs/${id}/pdf`;
    a.download = `setlist_${title.replace(/\s+/g, "_")}.pdf`;
    a.click();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">
            Shows & Gigs
          </h1>
          <p className="text-dim font-medium mt-2">Setlists agendados. Exporte em PDF ou envie a escala direto no WhatsApp.</p>
        </div>
        <StickerPillButton onClick={() => window.location.href = "/gigs/new"}>
          <Plus className="w-4 h-4 mr-1 inline" /> Novo Show
        </StickerPillButton>
      </div>

      {gigs.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-ink/20 rounded-3xl p-16 text-center">
          <p className="text-dim text-lg font-medium mb-6">Nenhum show cadastrado ainda.</p>
          <Link href="/gigs/new">
            <StickerPillButton>Criar Primeiro Show</StickerPillButton>
          </Link>
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
                      <Mic2 className="w-3 h-3" /> {gig.representativeName}
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

              <div className="flex gap-3 p-4 bg-surface">
                <button
                  onClick={() => downloadPdf(gig.id, gig.title)}
                  className="flex-1 flex items-center justify-center gap-2 bg-muted border-2 border-ink py-3 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform shadow-[3px_3px_0px_#161616] hover:shadow-[0px_0px_0px_#161616] font-[family-name:var(--font-dm-sans)]"
                >
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => sendWhatsApp(gig.id)}
                  disabled={sendingId === gig.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent-lime border-2 border-ink py-3 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform shadow-[3px_3px_0px_#161616] hover:shadow-[0px_0px_0px_#161616] disabled:opacity-60 font-[family-name:var(--font-dm-sans)]"
                >
                  <Send className="w-4 h-4" />
                  {sendingId === gig.id ? "Enviando..." : "WhatsApp"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
