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
  PaginationState,
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
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Layers,
  Filter,
  Flame,
  Users,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from "lucide-react";
import { MasteryRating } from "@/components/MasteryRating";
import { StickerPillButton } from "@/components/StickerPillButton";
import { SongFormModal, SongData } from "@/components/SongFormModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { SongDetailModal } from "@/components/SongDetailModal";
import { DailyPracticeModal } from "@/components/DailyPracticeModal";
import { useAppStore, Song } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/utils";

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

  // Controlled pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = getApiBaseUrl();

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

  // Reset to page 1 only when filters explicitly change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, activeGenre, masteryFilter]);

  // Update mastery level without losing current page
  const handleUpdateMastery = async (id: string, level: number) => {
    await updateMastery(id, level);
  };

  // Create or Update Song
  const handleSaveSong = async (songData: SongData) => {
    if (editingSong) {
      await updateSong(editingSong.id, songData as any);
    } else {
      await addSong(songData as any);
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
        cell: (info) => {
          const song = info.row.original;
          const links = song.representativeLinks || [];
          return (
            <div
              className="cursor-pointer group flex flex-col"
              onClick={() => setViewingSong(song)}
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-ink font-[family-name:var(--font-oswald)] uppercase tracking-wide group-hover:text-accent-orange transition-colors">
                  {info.getValue()}
                </span>
                {links.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-lavender/60 border border-ink/30 rounded-md text-[10px] font-black uppercase font-[family-name:var(--font-dm-sans)] text-ink">
                    <Users className="w-2.5 h-2.5" />
                    {links.length === 1 ? links[0].representativeName : `${links.length} artistas`}
                  </span>
                )}
              </div>
              {song.notes && (
                <span className="text-[11px] text-dim/70 truncate max-w-xs font-medium">
                  {song.notes}
                </span>
              )}
            </div>
          );
        },
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
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    // CRITICAL: autoResetPageIndex: false ensures changing mastery rating or editing never jumps back to page 1
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const availableGenres = ["MPB", "Bossa Nova", "Samba", "Jazz Standards", "Soul", "Pop", "Forró"];

  // Calculate pagination window for numbered buttons
  const currentPage = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount() || 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : currentPage * pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pageSize, totalRows);

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(pageCount - 2, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < pageCount - 3) pages.push("...");
      pages.push(pageCount - 1);
    }
    return pages;
  }, [currentPage, pageCount]);

  const pagedRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-2 sm:mt-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-lime border-2 border-ink rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-[2px_2px_0px_#161616] mb-2 sm:mb-3 font-[family-name:var(--font-dm-sans)]">
            <Music2 className="w-3.5 h-3.5" /> Acervo Central
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)]">
            Acervo de Repertório
          </h1>
          <p className="text-dim font-medium mt-1 text-xs sm:text-sm md:text-base">
            Total de <span className="text-ink font-bold">{songs.length} músicas</span> cadastradas. Cadastre, revise tons e gerencie seu repertório.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => fetchSongs(true)}
            title="Atualizar lista"
            className="p-2.5 sm:p-3 bg-surface border-2 border-ink rounded-xl hover:bg-muted transition-colors shadow-[2px_2px_0px_#161616] hover:shadow-none hover:translate-y-0.5 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-ink ${isLoadingSongs ? "animate-spin" : ""}`} />
            <span className="sr-only">Atualizar</span>
          </button>

          <StickerPillButton
            variant="orange"
            onClick={() => setIsPracticeOpen(true)}
            className="flex-1 sm:flex-none justify-center"
            icon={<Flame className="w-4 h-4 text-surface fill-surface" />}
          >
            Estudo Diário
          </StickerPillButton>

          <StickerPillButton
            variant="lavender"
            onClick={() => {
              window.open(`${API_URL}/api/songs/portfolio/pdf`, "_blank");
            }}
            className="flex-1 sm:flex-none justify-center"
            icon={<FileDown className="w-4 h-4 text-surface" />}
          >
            Exportar PDF
          </StickerPillButton>

          <StickerPillButton
            variant="lime"
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto justify-center"
            icon={<Plus className="w-4 h-4 text-surface" />}
          >
            Nova Música
          </StickerPillButton>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            id="search-input"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por título, compositor, tom... (Pressione '/' para focar)"
            className="w-full bg-surface border-2 border-ink rounded-2xl py-2.5 sm:py-3 pl-10 pr-4 shadow-neo font-medium text-xs sm:text-sm text-ink focus:outline-none focus:ring-4 focus:ring-accent-lime/50 transition-all placeholder:text-dim/60"
          />
        </div>

        {/* Quick Genre Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => {
              setActiveGenre(null);
              setMasteryFilter(null);
            }}
            className={`px-3 py-1.5 sm:py-2 border-2 border-ink rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] whitespace-nowrap shrink-0 ${
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
                className={`px-3 py-1.5 sm:py-2 border-2 border-ink rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)] whitespace-nowrap shrink-0 ${
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

      {/* Main Content Container */}
      <div className="bg-surface rounded-3xl border-2 border-ink shadow-neo overflow-hidden">
        {/* DESKTOP / TABLET VIEW: TABLE (hidden on small mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-muted border-b-2 border-ink">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortState = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`py-4 px-6 font-bold uppercase tracking-wider text-xs text-ink transition-colors font-[family-name:var(--font-dm-sans)] select-none ${
                          canSort ? "cursor-pointer hover:bg-ink/5 group" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortState === "asc" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-accent-lime text-ink border border-ink shadow-[1px_1px_0px_#161616]">
                              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          )}
                          {sortState === "desc" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-accent-cherry text-surface border border-ink shadow-[1px_1px_0px_#161616]">
                              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          )}
                          {!sortState && canSort && (
                            <span className="opacity-0 group-hover:opacity-30 transition-opacity">
                              <ArrowUpDown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
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
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-dim font-medium">
                    <p className="text-lg font-bold text-ink mb-1">Nenhuma música encontrada</p>
                    <p className="text-sm">Tente ajustar a busca ou adicione uma nova obra ao acervo.</p>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, i) => (
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

        {/* MOBILE VIEW: RESPONSIVE CARDS (No horizontal scrollbar!) */}
        <div className="md:hidden p-3.5 space-y-3 bg-canvas">
          {isLoadingSongs && songs.length === 0 ? (
            <div className="py-12 text-center text-dim font-bold uppercase tracking-widest animate-pulse">
              Carregando acervo musical...
            </div>
          ) : pagedRows.length === 0 ? (
            <div className="py-10 text-center text-dim font-medium bg-surface rounded-2xl border-2 border-ink p-6">
              <p className="text-base font-bold text-ink mb-1">Nenhuma música encontrada</p>
              <p className="text-xs">Tente ajustar a busca ou adicionar uma nova obra.</p>
            </div>
          ) : (
            pagedRows.map((row) => {
              const song = row.original;
              const links = song.representativeLinks || [];

              return (
                <div
                  key={song.id}
                  className="bg-surface border-2 border-ink rounded-2xl p-4 shadow-[3px_3px_0px_#161616] flex flex-col gap-3 transition-transform active:scale-[0.99]"
                >
                  {/* Top Bar: Title & Key Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3
                        onClick={() => setViewingSong(song)}
                        className="font-black text-lg uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)] leading-tight cursor-pointer hover:text-accent-orange"
                      >
                        {song.title}
                      </h3>
                      <p className="text-xs font-semibold text-dim mt-0.5">
                        {song.composer || "Compositor não informado"}
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-accent-lavender border-2 border-ink rounded-xl text-sm font-black font-[family-name:var(--font-oswald)] text-ink shadow-[1px_1px_0px_#161616] shrink-0">
                      {song.originalKey || "C"}
                    </span>
                  </div>

                  {/* Badges: Genre & Linked Artists */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-muted border border-ink rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                      {song.genre || "Geral"}
                    </span>

                    {links.map((l, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-lime/30 border border-ink/40 rounded-full text-[10px] font-bold uppercase font-[family-name:var(--font-dm-sans)] text-ink"
                      >
                        <Users className="w-2.5 h-2.5" />
                        <span>{l.representativeName}</span>
                        <span className="font-black text-accent-cherry">({l.performanceKey})</span>
                      </span>
                    ))}
                  </div>

                  {/* Notes if present */}
                  {song.notes && (
                    <p className="text-xs text-dim bg-canvas p-2.5 rounded-xl border border-ink/20 line-clamp-2">
                      {song.notes}
                    </p>
                  )}

                  {/* Bottom Bar: Mastery Stars & Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/10">
                    <MasteryRating
                      level={song.masteryLevel || 0}
                      size="sm"
                      onChange={(lvl) => handleUpdateMastery(song.id, lvl)}
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingSong(song)}
                        title="Ver detalhes"
                        className="p-1.5 border border-ink rounded-lg bg-surface hover:bg-accent-lavender text-ink shadow-[1px_1px_0px_#161616]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingSong(song)}
                        title="Editar música"
                        className="p-1.5 border border-ink rounded-lg bg-surface hover:bg-accent-lime text-ink shadow-[1px_1px_0px_#161616]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingSong(song)}
                        title="Excluir música"
                        className="p-1.5 border border-ink rounded-lg bg-surface hover:bg-accent-cherry hover:text-surface text-ink shadow-[1px_1px_0px_#161616]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Structured Pagination Bar (Mobile and Desktop Friendly) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-canvas border-t-2 border-ink flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Summary & Page Size Selection */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full md:w-auto flex-wrap">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
              Exibindo <span className="text-ink font-black">{startRow}–{endRow}</span> de <span className="text-ink font-black">{totalRows}</span>
            </span>

            <div className="flex items-center gap-1.5 border-l-2 border-ink/20 pl-3">
              <span className="text-[10px] sm:text-xs font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                Pág:
              </span>
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => table.setPageSize(size)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-ink text-[11px] font-bold font-[family-name:var(--font-dm-sans)] transition-all ${
                    pageSize === size
                      ? "bg-ink text-surface shadow-[1px_1px_0px_#161616]"
                      : "bg-surface text-ink hover:bg-muted"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Numbered Page Buttons & Navigation */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
            {/* First Page */}
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="Primeira página"
              className="p-1.5 sm:p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink" />
              <span className="sr-only">Primeira Página</span>
            </button>

            {/* Prev Page */}
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Página anterior"
              className="p-1.5 sm:p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink" />
              <span className="sr-only">Anterior</span>
            </button>

            {/* Numbered Buttons */}
            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-dim font-bold select-none text-xs">
                    ...
                  </span>
                );
              }

              const isCurrent = currentPage === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => table.setPageIndex(p)}
                  className={`min-w-[30px] sm:min-w-[34px] h-[30px] sm:h-[34px] px-1.5 sm:px-2 rounded-xl border-2 border-ink text-xs font-black font-[family-name:var(--font-oswald)] transition-all shadow-[2px_2px_0px_#161616] ${
                    isCurrent
                      ? "bg-accent-lime text-ink -translate-y-0.5"
                      : "bg-surface text-ink hover:bg-muted hover:translate-y-0"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Próxima página"
              className="p-1.5 sm:p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink" />
              <span className="sr-only">Próxima</span>
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              title="Última página"
              className="p-1.5 sm:p-2 border-2 border-ink rounded-xl bg-surface hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[2px_2px_0px_#161616] hover:shadow-none"
            >
              <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink" />
              <span className="sr-only">Última Página</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Estudo Diário */}
      <DailyPracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
      />

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
