"use client";

import { useState, useRef, useEffect } from "react";
import { Edit3, Check, Plus, Tag, X } from "lucide-react";

const SUGGESTED_GENRES = [
  "MPB",
  "Bossa Nova",
  "Samba",
  "Jazz Standards",
  "Soul",
  "Pop",
  "Forró",
  "Choro",
  "Samba-Rock",
  "Blues",
  "Rock",
  "Geral",
];

interface GenreBadgePickerProps {
  genre?: string | null;
  onUpdate: (newGenre: string) => Promise<void> | void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function GenreBadgePicker({
  genre,
  onUpdate,
  size = "md",
  className = "",
  disabled = false,
}: GenreBadgePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayGenre = genre?.trim() || "Geral";

  // Handle outside click to close popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = async (selected: string) => {
    const valueToSave = selected === "Geral" ? "" : selected.trim();
    if (valueToSave === (genre?.trim() || "")) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(valueToSave);
      setIsOpen(false);
      setCustomGenre("");
    } catch (err) {
      console.error("Erro ao salvar gênero:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customGenre.trim()) return;
    handleSelect(customGenre);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button / Badge */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setCustomGenre("");
          setIsOpen(!isOpen);
        }}
        title="Clique para alterar o gênero"
        className={`group/gb inline-flex items-center gap-1.5 border-2 border-ink rounded-full font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] whitespace-nowrap transition-all select-none shadow-[1px_1px_0px_#161616] hover:shadow-[2px_2px_0px_#161616] hover:-translate-y-0.5 ${
          isOpen
            ? "bg-accent-lime text-ink ring-2 ring-ink"
            : "bg-muted text-ink hover:bg-accent-lime"
        } ${
          size === "sm"
            ? "px-2 py-0.5 text-[10px]"
            : "px-2.5 sm:px-3 py-1 text-[11px]"
        }`}
      >
        <span className="truncate max-w-[120px] sm:max-w-[150px]">
          {displayGenre}
        </span>
        <Edit3 className="w-2.5 h-2.5 opacity-40 group-hover/gb:opacity-100 group-hover/gb:text-ink transition-opacity shrink-0" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 bg-surface border-2 border-ink rounded-2xl shadow-[6px_6px_0px_#161616] p-3.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-ink/10">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-ink font-[family-name:var(--font-oswald)]">
              <Tag className="w-3.5 h-3.5 text-accent-cherry" />
              <span>Editar Gênero</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-muted text-dim hover:text-ink transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="space-y-1.5 mb-3">
            <span className="text-[10px] font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block">
              Gêneros Frequentes:
            </span>
            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
              {SUGGESTED_GENRES.map((g) => {
                const isCurrent =
                  (g === "Geral" && !genre) ||
                  genre?.toLowerCase() === g.toLowerCase();

                return (
                  <button
                    key={g}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSelect(g)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-ink text-[10px] font-bold uppercase transition-all ${
                      isCurrent
                        ? "bg-accent-lime text-ink shadow-[1px_1px_0px_#161616] font-black"
                        : "bg-canvas text-ink hover:bg-muted"
                    }`}
                  >
                    {isCurrent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Genre Input */}
          <form onSubmit={handleCustomSubmit} className="pt-2 border-t-2 border-ink/10">
            <span className="text-[10px] font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-1">
              Outro gênero personalizado:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Ex: Jazz Manouche, Reggae..."
                className="flex-1 bg-canvas border-2 border-ink rounded-xl px-2.5 py-1 text-xs font-semibold text-ink shadow-[1px_1px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
              />
              <button
                type="submit"
                disabled={isSaving || !customGenre.trim()}
                className="px-2.5 py-1 bg-ink text-surface hover:bg-accent-lime hover:text-ink disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-surface border-2 border-ink rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[1px_1px_0px_#161616]"
              >
                {isSaving ? "..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
