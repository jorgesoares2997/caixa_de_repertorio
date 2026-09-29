"use client";

import { useEffect, useState } from "react";
import { Search, Plus, GripVertical, Download, X } from "lucide-react";
import { StickerPillButton } from "@/components/StickerPillButton";

type Song = {
  id: string;
  title: string;
  composer: string;
  genre: string;
  originalKey: string;
};

type SetlistItem = Song & {
  uid: string; // unique for the setlist
  performanceKey: string;
};

type Block = {
  id: string;
  title: string;
  items: SetlistItem[];
};

export default function GigConstructor() {
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "b1", title: "Bloco 1", items: [] },
    { id: "b2", title: "Bloco 2", items: [] },
    { id: "b3", title: "Bis", items: [] },
  ]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/songs`)
      .then(res => res.json())
      .then(data => setAvailableSongs(data))
      .catch(err => console.error(err));
  }, []);

  const filteredSongs = availableSongs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.composer?.toLowerCase().includes(search.toLowerCase())
  );

  const addToBlock = (blockId: string, song: Song) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          items: [...b.items, { ...song, uid: Math.random().toString(36).substr(2, 9), performanceKey: song.originalKey }]
        };
      }
      return b;
    }));
  };

  const removeFromBlock = (blockId: string, uid: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, items: b.items.filter(i => i.uid !== uid) };
      }
      return b;
    }));
  };

  const updateKey = (blockId: string, uid: string, newKey: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          items: b.items.map(i => i.uid === uid ? { ...i, performanceKey: newKey } : i)
        };
      }
      return b;
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4 min-h-[85vh]">
      
      {/* Left Column: Acervo */}
      <div className="w-full lg:w-1/3 flex flex-col bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden h-[800px]">
        <div className="p-6 bg-muted border-b-2 border-ink">
          <h2 className="text-3xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)] mb-4">Acervo</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar música..."
              className="w-full bg-canvas border-2 border-ink rounded-xl py-2 pl-12 pr-4 shadow-[2px_2px_0px_#161616] font-medium focus:outline-none focus:translate-y-0.5 focus:shadow-[0px_0px_0px_#161616] transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas">
          {filteredSongs.map(song => (
            <div key={song.id} className="bg-surface border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0px_#161616] hover:-translate-y-1 transition-transform flex flex-col gap-3">
              <div>
                <p className="font-bold text-lg leading-tight uppercase font-[family-name:var(--font-oswald)]">{song.title}</p>
                <p className="text-sm text-dim">{song.composer}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {blocks.map(b => (
                  <button 
                    key={b.id}
                    onClick={() => addToBlock(b.id, song)}
                    className="flex-1 flex items-center justify-center gap-1 bg-muted border border-ink py-1 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-accent-lime transition-colors"
                  >
                    <Plus className="w-3 h-3" /> {b.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredSongs.length === 0 && (
            <p className="text-center text-dim mt-10">Nenhuma música encontrada.</p>
          )}
        </div>
      </div>

      {/* Right Column: Setlist Constructor */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-surface p-6 rounded-3xl border-2 border-ink shadow-neo">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight font-[family-name:var(--font-oswald)]">Construtor de Setlist</h1>
            <p className="text-dim font-medium mt-1">Monte e divida seu show em blocos. Exporte ao final.</p>
          </div>
          <StickerPillButton onClick={() => alert('Integração de PDF do construtor em breve!')}>
            Exportar Setlist
          </StickerPillButton>
        </div>

        <div className="flex-1 space-y-6">
          {blocks.map(block => (
            <div key={block.id} className="bg-surface border-2 border-ink rounded-3xl shadow-neo overflow-hidden">
              <div className="bg-ink text-surface px-6 py-4 flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase tracking-widest font-[family-name:var(--font-oswald)]">{block.title}</h3>
                <span className="text-accent-lime font-bold font-[family-name:var(--font-dm-sans)]">{block.items.length} faixas</span>
              </div>
              <div className="p-4 bg-canvas min-h-[150px]">
                {block.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-ink/20 rounded-xl p-8 text-dim font-medium text-center">
                    Arraste ou adicione músicas para este bloco
                  </div>
                ) : (
                  <div className="space-y-3">
                    {block.items.map((item, idx) => (
                      <div key={item.uid} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface border-2 border-ink p-3 rounded-xl shadow-[4px_4px_0px_#161616] group">
                        <div className="hidden sm:flex cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-lg text-dim">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 w-full">
                          <p className="font-bold text-lg uppercase font-[family-name:var(--font-oswald)]">{idx + 1}. {item.title}</p>
                          <p className="text-xs text-dim">{item.genre} &bull; {item.composer}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="flex items-center bg-muted border border-ink rounded-lg px-2 py-1">
                            <span className="text-xs font-bold mr-2">TOM:</span>
                            <input 
                              type="text" 
                              value={item.performanceKey} 
                              onChange={(e) => updateKey(block.id, item.uid, e.target.value)}
                              className="w-10 bg-surface border border-ink rounded px-1 text-center font-bold text-accent-cherry focus:outline-none"
                            />
                          </div>
                          <button 
                            onClick={() => removeFromBlock(block.id, item.uid)}
                            className="p-2 bg-surface border-2 border-ink rounded-lg text-ink hover:bg-accent-orange hover:text-surface transition-colors shadow-[2px_2px_0px_#161616] hover:translate-y-0.5 hover:shadow-none"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
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
