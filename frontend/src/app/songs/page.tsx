"use client";

import { useEffect, useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Search, SlidersHorizontal, Download } from "lucide-react";
import { MasteryRating } from "@/components/MasteryRating";
import { StickerPillButton } from "@/components/StickerPillButton";

type Song = {
  id: string;
  title: string;
  composer: string;
  genre: string;
  originalKey: string;
  masteryLevel: number;
};

const columnHelper = createColumnHelper<Song>();

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to load songs", err));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateMasteryOptimistic = (id: string, level: number) => {
    setSongs((prev) =>
      prev.map((song) => (song.id === id ? { ...song, masteryLevel: level } : song))
    );
    fetch(`http://localhost:8080/api/songs/${id}/mastery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level })
    }).catch(err => console.error("Failed to update mastery level", err));
  };

  const columns = [
    columnHelper.accessor("title", {
      header: "Título",
      cell: (info) => (
        <span className="font-black text-lg text-ink font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("composer", {
      header: "Compositor",
      cell: (info) => <span className="text-dim font-medium">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("genre", {
      header: "Gênero",
      cell: (info) => (
        <span className="px-3 py-1 bg-muted border-2 border-ink rounded-full text-[11px] font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "keys",
      header: "Tons Conhecidos",
      cell: (info) => {
        // Mocking colored badges per singer
        const key = info.row.original.originalKey || "C";
        return (
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-accent-lavender border-2 border-ink rounded-md text-xs font-bold font-[family-name:var(--font-dm-sans)]">
              {key} <span className="opacity-50 ml-1">LUIZA</span>
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("masteryLevel", {
      header: "Domínio",
      cell: (info) => (
        <MasteryRating 
          level={info.getValue() || 0} 
          onChange={(level) => updateMasteryOptimistic(info.row.original.id, level)} 
        />
      ),
    }),
  ];

  const filteredData = useMemo(() => {
    if (!activeTag) return songs;
    return songs.filter(s => s.genre?.toLowerCase().includes(activeTag.toLowerCase()));
  }, [songs, activeTag]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const tags = ["Bossa Nova", "Jazz Standards", "MPB", "Soul", "Pop"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
            Acervo de Repertório
          </h1>
          <p className="text-dim font-medium mt-2">Busque por '/', filtre e avalie seu domínio instantaneamente.</p>
        </div>
        
        <StickerPillButton onClick={() => window.open('http://localhost:8080/api/songs/portfolio/pdf', '_blank')}>
          Exportar Acervo Completo
        </StickerPillButton>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
          <input 
            id="search-input"
            value={globalFilter ?? ""}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Buscar música, compositor... (/ para focar)"
            className="w-full bg-surface border-2 border-ink rounded-2xl py-3 pl-12 pr-4 shadow-neo font-medium focus:outline-none focus:ring-4 focus:ring-accent-lime/50 transition-all placeholder:text-dim/60"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-muted border-2 border-ink rounded-xl mr-2">
            <SlidersHorizontal className="w-5 h-5 text-ink" />
          </div>
          {tags.map(tag => (
            <button 
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-4 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${activeTag === tag ? 'bg-ink text-surface' : 'bg-surface text-ink hover:bg-muted'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-3xl border-2 border-ink shadow-neo overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-muted border-b-2 border-ink">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-ink cursor-pointer hover:bg-ink/5 transition-colors font-[family-name:var(--font-dm-sans)]"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y-2 divide-muted">
              {table.getRowModel().rows.map((row, i) => (
                <tr key={row.id} className={`hover:bg-accent-lime/10 transition-colors ${i % 2 === 0 ? 'bg-surface' : 'bg-canvas/50'}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4 px-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
            <div className="p-12 text-center text-dim font-medium">
              Nenhuma música encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
