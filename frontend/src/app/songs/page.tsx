"use client";

import { useEffect, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Music2, Star, Search } from "lucide-react";

type Song = {
  id: string;
  title: string;
  composer: string;
  genre: string;
  originalKey: string;
  masteryLevel: number;
  tempoBpm: number;
};

const columnHelper = createColumnHelper<Song>();

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to load songs", err));
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

  const downloadPdf = () => {
    window.open('http://localhost:8080/api/songs/portfolio/pdf', '_blank');
  };

  const columns = [
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-300/10 text-brand-600 rounded-lg">
            <Music2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-brand-800">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("composer", {
      header: "Composer",
      cell: (info) => <span className="text-brand-600 font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("genre", {
      header: "Genre",
      cell: (info) => (
        <span className="px-3 py-1 bg-brand-400/10 text-brand-600 border border-brand-400/20 rounded-full text-xs font-semibold uppercase tracking-wider">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("originalKey", {
      header: "Key",
      cell: (info) => (
        <span className="font-bold text-brand-800 bg-brand-300/20 px-2 py-1 rounded-md">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("masteryLevel", {
      header: "Mastery (1-5)",
      cell: (info) => {
        const level = info.getValue();
        return (
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => updateMasteryOptimistic(info.row.original.id, val)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-300 shadow-sm ${
                  val <= level
                    ? "bg-gradient-to-br from-brand-300 to-brand-400 text-brand-800 shadow-brand-300/30"
                    : "bg-white border border-brand-300/30 text-brand-600/50 hover:bg-brand-100 hover:border-brand-400 hover:text-brand-600"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: songs,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-brand-300/20 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-600 mb-2">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-semibold tracking-wide uppercase text-sm">Dashboard</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-brand-800">Repertoire Studio</h2>
          <p className="text-brand-600/80 mt-2 font-medium">Manage your complete song database and track your mastery.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-600/50" />
            <input 
              type="text" 
              placeholder="Search songs..." 
              className="pl-9 pr-4 py-2.5 rounded-xl border border-brand-300/30 bg-white/80 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all w-64 text-brand-800 placeholder:text-brand-600/40"
            />
          </div>
          <button 
            onClick={downloadPdf}
            className="group flex items-center gap-2 bg-brand-800 text-brand-100 px-5 py-2.5 rounded-xl hover:bg-brand-600 transition-all duration-300 shadow-lg shadow-brand-800/20 font-medium border border-brand-600"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-brand-800/5 border border-brand-300/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-brand-100/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-brand-300/20 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className="cursor-pointer py-4 px-6 text-brand-800/60 font-bold uppercase tracking-wider text-xs"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-brand-300/10 hover:bg-brand-300/5 transition-colors group">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4 px-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
