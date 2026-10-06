"use client";

import { useEffect, useState } from "react";
import { X, User, Music } from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";
import { MasteryRating } from "@/components/MasteryRating";
import { useAppStore, Representative } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

type Intersection = {
  representativeName: string;
  performanceKey: string;
};

type Song = {
  songId: string;
  title: string;
  composer: string;
  genre: string;
  masteryLevel: number;
  performanceKey: string;
  intersections: Intersection[];
};

export default function RepresentativesPage() {
  const representatives = useAppStore((state) => state.representatives);
  const fetchRepresentatives = useAppStore((state) => state.fetchRepresentatives);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchRepresentatives();
  }, [fetchRepresentatives]);

  const openModal = async (rep: Representative) => {
    setSelectedRep(rep);
    setIsLoadingSongs(true);
    try {
      const API_URL = getApiBaseUrl();
      const res = await fetch(`${API_URL}/api/representatives/${rep.id}/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedRep) return;
    setIsExporting(true);
    try {
      const API_URL = getApiBaseUrl();
      const response = await fetch(`${API_URL}/api/representatives/${selectedRep.id}/export-pdf?groupBy=COMPOSER&sortBy=TITLE`);
      if (!response.ok) throw new Error("Falha ao exportar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repertorio_${selectedRep.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 mt-4">
      <div>
        <h1 className="text-5xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
          Projetos & Artistas
        </h1>
        <p className="text-dim font-medium mt-2 text-lg">Selecione um cantor ou grupo para visualizar seu repertório exclusivo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {representatives.map((rep, idx) => {
          // Add some random rotation to give a Polaroid feel
          const rotation = idx % 2 === 0 ? "rotate-2" : "-rotate-2";
          return (
            <div 
              key={rep.id} 
              onClick={() => openModal(rep)}
              className={`relative bg-surface border-2 border-ink rounded-xl p-6 shadow-neo cursor-pointer transition-all hover:scale-105 hover:z-10 group ${rotation}`}
            >
              {/* Badge Pill */}
              <div className="absolute -top-4 right-4 bg-accent-lavender border-2 border-ink px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]">
                {rep.type}
              </div>

              {/* Scalloped top edge illusion (using simple dash border logic for neo-brutalism) */}
              <div className="w-full h-32 bg-canvas border-2 border-ink rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                <div className="w-16 h-16 bg-ink rounded-full flex items-center justify-center text-surface group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-3xl font-black text-ink uppercase tracking-tight font-[family-name:var(--font-oswald)]">{rep.name}</h3>
              <p className="text-dim font-medium mt-2 text-sm">Visualizar Setlists & Intersecções &rarr;</p>
            </div>
          );
        })}
      </div>

      {selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSelectedRep(null)} />
          <div className="relative bg-surface w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl border-2 border-ink shadow-[8px_8px_0px_#161616] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-8 py-6 border-b-2 border-ink flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-canvas">
              <div>
                <h3 className="text-4xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">{selectedRep.name}</h3>
                <p className="text-sm font-bold uppercase tracking-wider text-dim mt-1 font-[family-name:var(--font-dm-sans)]">Repertório Oficial</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <StickerPillButton onClick={handleExportPdf} className="flex-1 justify-center">
                  {isExporting ? "Gerando..." : "Exportar PDF"}
                </StickerPillButton>
                <button onClick={() => setSelectedRep(null)} className="p-3 border-2 border-ink rounded-xl bg-surface hover:bg-accent-orange hover:text-surface transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-surface">
              {isLoadingSongs ? (
                <div className="flex h-full items-center justify-center font-bold uppercase tracking-widest text-dim animate-pulse">
                  Carregando faixas...
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted border-b-2 border-ink">
                    <tr>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">Tom</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">Música</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">Domínio</th>
                      <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs font-[family-name:var(--font-dm-sans)]">Intersecções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-muted">
                    {songs.map(song => (
                      <tr key={song.songId} className="hover:bg-accent-lime/10">
                        <td className="py-4 px-4">
                          <span className="font-black text-2xl text-accent-cherry font-[family-name:var(--font-oswald)]">
                            {song.performanceKey}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-lg text-ink font-[family-name:var(--font-oswald)] uppercase">{song.title}</p>
                          <p className="text-sm text-dim">{song.composer}</p>
                        </td>
                        <td className="py-4 px-4">
                          <MasteryRating level={song.masteryLevel} onChange={() => {}} />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {song.intersections.length > 0 ? (
                              song.intersections.map((inter, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-muted border border-ink text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md font-[family-name:var(--font-dm-sans)]">
                                  {inter.representativeName} <span className="text-accent-cherry">({inter.performanceKey})</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-dim italic">Exclusiva</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
