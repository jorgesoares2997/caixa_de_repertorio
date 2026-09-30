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
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Search,
  SlidersHorizontal,
  Plus,
  FileDown,
  Edit3,
  Trash2,
  Eye,
  Music2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Filter
} from "lucide-react";
import { MasteryRating } from "@/components/MasteryRating";
import { StickerPillButton } from "@/components/StickerPillButton";
import { SongFormModal, SongData } from "@/components/SongFormModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { SongDetailModal } from "@/components/SongDetailModal";
import { useAppStore, Song } from "@/lib/store";

const columnHelper = createColumnHelper<Song>();

export default function SongsPage() {
  const {
    songs,
    isLoadingSongs,
    fetchSongs,
    addSong,
    updateSong,
    deleteSong,
    updateMastery,
  } = useAppStore();

  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<number | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchSongs();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchSongs]);

  // Update mastery level
  const handleUpdateMastery = async (id: string, level: number) => {
    await updateMastery(id, level);
  };

  // Create or Update Song
  const handleSaveSong = async (songData: SongData, repIds?: string[]) => {
    if (editingSong) {
      await updateSong(editingSong.id, songData);
    } else {
      await addSong(songData as any, repIds);
    }
  };

  // Delete Song
  const handleDeleteConfirm = async () => {
    if (!deletingSong) return;
    setIsDeleting(true);
    try {
      await deleteSong(deletingSong.id);
      setDeletingSong(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir música.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Título da Obra",
        cell: (info) => (
          <div
            className="cursor-pointer group flex flex-col"
            onClick={() => setViewingSong(info.row.original)}
          >
            <span className="font-black text-lg text-ink font-[family-name:var(--font-oswald)] uppercase tracking-wide group-hover:text-accent-orange transition-colors">
              {info.getValue()}
            </span>
            {info.row.original.notes && (
              <span className="text-[11px] text-dim/70 truncate max-w-xs font-medium">
                {info.row.original.notes}
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("composer", {
        header: "Compositor",
        cell: (info) => (
          <span className="text-dim font-medium text-sm">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("genre", {
        header: "Gênero",
        cell: (info) => (
          <span className="inline-block px-3 py-1 bg-muted border-2 border-ink rounded-full text-[11px] font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] whitespace-nowrap shadow-[1px_1px_0px_#161616]">
            {info.getValue() || "Geral"}
          </span>
        ),
      }),
      columnHelper.accessor("originalKey", {
        header: "Tom",
        cell: (info) => {
          const key = info.getValue() || "C";
          return (
            <span className="inline-block px-2.5 py-1 bg-accent-lavender border-2 border-ink rounded-lg text-sm font-black font-[family-name:var(--font-oswald)] text-ink shadow-[1px_1px_0px_#161616]">
              {key}
            </span>
          );
        },
      }),
      columnHelper.accessor("masteryLevel", {
        header: "Domínio",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <MasteryRating
              level={info.getValue() || 0}
              onChange={(level) => handleUpdateMastery(info.row.original.id, level)}
            />
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Ações",
        cell: (info) => {
          const song = info.row.original;
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <button
                type="button"
                title="Visualizar detalhes"
                onClick={() => setViewingSong(song)}
                className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-lavender text-ink transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="sr-only">Visualizar</span>
              </button>

              <button
                type="button"
                title="Revisar e editar música"
                onClick={() => setEditingSong(song)}
                className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-ink rounded-xl bg-surface hover:bg-accent-lime text-ink text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5 font-[family-name:var(--font-dm-sans)]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Revisar</span>
              </button>

              <button
                type="button"
                title="Excluir música"
                onClick={() => setDeletingSong(song)}
                className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-accent-cherry hover:text-surface text-ink transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only">Excluir</span>
              </button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const filteredData = useMemo(() => {
    return songs.filter((s) => {
      const matchGenre = !activeGenre || s.genre?.toLowerCase().includes(activeGenre.toLowerCase());
      const matchMastery = !masteryFilter || s.masteryLevel === masteryFilter;
      return matchGenre && matchMastery;
    });
  }, [songs, activeGenre, masteryFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 30,
      },
    },
  });

  const availableGenres = ["MPB", "Bossa Nova", "Samba", "Jazz Standards", "Soul", "Pop", "Forró"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-lime border-2 border-ink rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-[2px_2px_0px_#161616] mb-3 font-[family-name:var(--font-dm-sans)]">
            <Music2 className="w-3.5 h-3.5" /> Acervo Central
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
            Acervo de Repertório
          </h1>
          <p className="text-dim font-medium mt-1 text-sm md:text-base">
            Total de <span className="text-ink font-bold">{songs.length} músicas</span> cadastradas. Cadastre, revise tons e gerencie seu repertório.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchSongs(true)}
            title="Atualizar lista"
            className="p-3 bg-surface border-2 border-ink rounded-xl hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 text-ink ${isLoadingSongs ? "animate-spin" : ""}`} />
            <span className="sr-only">Atualizar</span>
          </button>

          <StickerPillButton
            variant="lavender"
            onClick={() => {
              window.open(`${API_URL}/api/songs/portfolio/pdf`, "_blank");
            }}
            icon={<FileDown className="w-4 h-4 text-surface" />}
          >
            Exportar PDF
          </StickerPillButton>

          <StickerPillButton
            variant="lime"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4 text-surface" />}
          >
            Nova Música
          </StickerPillButton>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            id="search-input"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por título, compositor, tom... (Pressione '/' para focar)"
            className="w-full bg-surface border-2 border-ink rounded-2xl py-3 pl-11 pr-4 shadow-neo font-medium text-sm text-ink focus:outline-none focus:ring-4 focus:ring-accent-lime/50 transition-all placeholder:text-dim/60"
          />
        </div>

        {/* Quick Genre Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveGenre(null);
              setMasteryFilter(null);
            }}
            className={`px-3.5 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
              !activeGenre && !masteryFilter
                ? "bg-ink text-surface"
                : "bg-surface text-ink hover:bg-muted"
            }`}
          >
            Todos ({songs.length})
          </button>

          {availableGenres.map((genre) => {
            const count = songs.filter((s) => s.genre?.toLowerCase().includes(genre.toLowerCase())).length;
            if (count === 0) return null;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
                className={`px-3 py-2 border-2 border-ink rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] ${
                  activeGenre === genre
                    ? "bg-accent-lime text-ink"
                    : "bg-surface text-ink hover:bg-muted"
                }`}
              >
                {genre} <span className="opacity-60 ml-0.5">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-3xl border-2 border-ink shadow-neo overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-muted border-b-2 border-ink">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-ink cursor-pointer hover:bg-ink/5 transition-colors font-[family-name:var(--font-dm-sans)] select-none"
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y-2 divide-muted">
              {isLoadingSongs && songs.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-dim font-bold uppercase tracking-widest animate-pulse">
                    Carregando acervo musical...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-dim font-medium">
                    <p className="text-lg font-bold text-ink mb-1">Nenhuma música encontrada</p>
                    <p className="text-sm">Tente ajustar a busca ou adicione uma nova obra ao acervo.</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-accent-lime/15 transition-colors ${
                      i % 2 === 0 ? "bg-surface" : "bg-canvas/50"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3.5 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-canvas border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
            Exibindo {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} músicas filtradas
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink mr-2 font-[family-name:var(--font-dm-sans)]">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>

            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronLeft className="w-4 h-4 text-ink" />
              <span className="sr-only">Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronRight className="w-4 h-4 text-ink" />
              <span className="sr-only">Próxima</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Música */}
      <SongFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveSong}
        mode="create"
      />

      {/* Modal: Editar / Revisar Música */}
      <SongFormModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onSave={handleSaveSong}
        initialData={editingSong}
        mode="edit"
      />

      {/* Modal: Detalhes da Música */}
      <SongDetailModal
        isOpen={!!viewingSong}
        onClose={() => setViewingSong(null)}
        song={viewingSong}
        onEdit={(song) => {
          setViewingSong(null);
          setEditingSong(song as Song);
        }}
        onDelete={(song) => {
          setViewingSong(null);
          setDeletingSong(song as Song);
        }}
      />

      {/* Modal: Confirmar Exclusão */}
      <DeleteConfirmModal
        isOpen={!!deletingSong}
        onClose={() => setDeletingSong(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title={deletingSong ? `Excluir "${deletingSong.title}"?` : "Excluir Música"}
        itemDescription={`Esta ação removerá "${deletingSong?.title}" definitivamente do acervo e de todas as grades de shows.`}
      />
    </div>
  );
}
