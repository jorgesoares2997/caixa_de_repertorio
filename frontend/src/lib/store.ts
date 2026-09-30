import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type Song = {
  id: string;
  title: string;
  composer?: string;
  genre?: string;
  originalKey?: string;
  masteryLevel: number;
  tempoBpm?: number;
  notes?: string;
  lastPracticedAt?: string;
};

export type Representative = {
  id: string;
  name: string;
  type: string;
  active?: boolean;
};

export type GigItem = {
  songTitle: string;
  performanceKey: string;
  blockNumber: number;
};

export type Gig = {
  id: string;
  title: string;
  eventDate?: string;
  venue?: string;
  representativeName?: string;
  items: GigItem[];
};

export type Stats = {
  totalSongs: number;
  level5Songs: number;
  upcomingGigs: number;
  nextGigTitle: string | null;
  nextGigDate: string | null;
  nextGigVenue: string | null;
};

interface AppState {
  // State
  songs: Song[];
  representatives: Representative[];
  gigs: Gig[];
  stats: Stats | null;
  
  // Cache Timestamps (ms)
  lastFetchedSongs: number | null;
  lastFetchedRepresentatives: number | null;
  lastFetchedGigs: number | null;
  lastFetchedStats: number | null;

  // Loading flags
  isLoadingSongs: boolean;
  isLoadingRepresentatives: boolean;
  isLoadingGigs: boolean;
  isLoadingStats: boolean;

  // Actions - Songs
  fetchSongs: (force?: boolean) => Promise<Song[]>;
  addSong: (songData: Omit<Song, "id">, repIds?: string[]) => Promise<Song>;
  updateSong: (id: string, songData: Partial<Song>) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
  updateMastery: (id: string, level: number) => Promise<void>;

  // Actions - Representatives
  fetchRepresentatives: (force?: boolean) => Promise<Representative[]>;

  // Actions - Gigs
  fetchGigs: (force?: boolean) => Promise<Gig[]>;

  // Actions - Stats
  fetchStats: (force?: boolean) => Promise<Stats | null>;

  // Cache Invalidation
  invalidateCache: (key?: "songs" | "representatives" | "gigs" | "stats") => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      songs: [],
      representatives: [],
      gigs: [],
      stats: null,

      lastFetchedSongs: null,
      lastFetchedRepresentatives: null,
      lastFetchedGigs: null,
      lastFetchedStats: null,

      isLoadingSongs: false,
      isLoadingRepresentatives: false,
      isLoadingGigs: false,
      isLoadingStats: false,

      // --- SONGS ---
      fetchSongs: async (force = false) => {
        const { songs, lastFetchedSongs, isLoadingSongs } = get();
        const now = Date.now();
        const isFresh = lastFetchedSongs && now - lastFetchedSongs < CACHE_TTL;

        if (!force && isFresh && songs.length > 0) {
          return songs;
        }

        if (isLoadingSongs) return songs;

        set({ isLoadingSongs: true });
        try {
          const res = await fetch(`${API_URL}/api/songs`);
          if (res.ok) {
            const data: Song[] = await res.json();
            set({
              songs: data,
              lastFetchedSongs: Date.now(),
              isLoadingSongs: false,
            });
            return data;
          }
        } catch (error) {
          console.error("[useAppStore] Error fetching songs:", error);
        } finally {
          set({ isLoadingSongs: false });
        }
        return get().songs;
      },

      addSong: async (songData, repIds) => {
        const res = await fetch(`${API_URL}/api/songs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(songData),
        });

        if (!res.ok) throw new Error("Falha ao cadastrar música no servidor.");
        const created: Song = await res.json();

        // Optimistically update local songs cache
        set((state) => ({
          songs: [created, ...state.songs],
          lastFetchedSongs: Date.now(),
          stats: state.stats
            ? {
                ...state.stats,
                totalSongs: state.stats.totalSongs + 1,
                level5Songs:
                  created.masteryLevel === 5
                    ? state.stats.level5Songs + 1
                    : state.stats.level5Songs,
              }
            : null,
        }));

        return created;
      },

      updateSong: async (id, songData) => {
        const res = await fetch(`${API_URL}/api/songs/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(songData),
        });

        if (!res.ok) throw new Error("Falha ao atualizar música no servidor.");
        const updated: Song = await res.json();

        set((state) => ({
          songs: state.songs.map((s) => (s.id === id ? updated : s)),
          lastFetchedSongs: Date.now(),
        }));

        return updated;
      },

      deleteSong: async (id) => {
        const target = get().songs.find((s) => s.id === id);
        const res = await fetch(`${API_URL}/api/songs/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Falha ao excluir música do servidor.");

        set((state) => ({
          songs: state.songs.filter((s) => s.id !== id),
          lastFetchedSongs: Date.now(),
          stats: state.stats
            ? {
                ...state.stats,
                totalSongs: Math.max(0, state.stats.totalSongs - 1),
                level5Songs:
                  target?.masteryLevel === 5
                    ? Math.max(0, state.stats.level5Songs - 1)
                    : state.stats.level5Songs,
              }
            : null,
        }));
      },

      updateMastery: async (id, level) => {
        const prevSongs = get().songs;
        const target = prevSongs.find((s) => s.id === id);
        const wasLevel5 = target?.masteryLevel === 5;
        const isLevel5 = level === 5;

        // Optimistic cache update
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === id ? { ...s, masteryLevel: level } : s
          ),
          stats: state.stats
            ? {
                ...state.stats,
                level5Songs:
                  state.stats.level5Songs +
                  (isLevel5 && !wasLevel5 ? 1 : !isLevel5 && wasLevel5 ? -1 : 0),
              }
            : null,
        }));

        try {
          await fetch(`${API_URL}/api/songs/${id}/mastery`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level }),
          });
        } catch (err) {
          console.error("[useAppStore] Failed to update mastery level:", err);
          // Rollback on failure
          set({ songs: prevSongs });
        }
      },

      // --- REPRESENTATIVES ---
      fetchRepresentatives: async (force = false) => {
        const { representatives, lastFetchedRepresentatives } = get();
        const now = Date.now();
        const isFresh =
          lastFetchedRepresentatives && now - lastFetchedRepresentatives < CACHE_TTL;

        if (!force && isFresh && representatives.length > 0) {
          return representatives;
        }

        set({ isLoadingRepresentatives: true });
        try {
          const res = await fetch(`${API_URL}/api/representatives`);
          if (res.ok) {
            const data: Representative[] = await res.json();
            set({
              representatives: data,
              lastFetchedRepresentatives: Date.now(),
              isLoadingRepresentatives: false,
            });
            return data;
          }
        } catch (err) {
          console.error("[useAppStore] Error fetching representatives:", err);
        } finally {
          set({ isLoadingRepresentatives: false });
        }
        return get().representatives;
      },

      // --- GIGS ---
      fetchGigs: async (force = false) => {
        const { gigs, lastFetchedGigs } = get();
        const now = Date.now();
        const isFresh = lastFetchedGigs && now - lastFetchedGigs < CACHE_TTL;

        if (!force && isFresh && gigs.length > 0) {
          return gigs;
        }

        set({ isLoadingGigs: true });
        try {
          const res = await fetch(`${API_URL}/api/gigs`);
          if (res.ok) {
            const data: Gig[] = await res.json();
            set({
              gigs: data,
              lastFetchedGigs: Date.now(),
              isLoadingGigs: false,
            });
            return data;
          }
        } catch (err) {
          console.error("[useAppStore] Error fetching gigs:", err);
        } finally {
          set({ isLoadingGigs: false });
        }
        return get().gigs;
      },

      // --- STATS ---
      fetchStats: async (force = false) => {
        const { stats, lastFetchedStats } = get();
        const now = Date.now();
        const isFresh = lastFetchedStats && now - lastFetchedStats < CACHE_TTL;

        if (!force && isFresh && stats !== null) {
          return stats;
        }

        set({ isLoadingStats: true });
        try {
          const res = await fetch(`${API_URL}/api/stats`);
          if (res.ok) {
            const data: Stats = await res.json();
            set({
              stats: data,
              lastFetchedStats: Date.now(),
              isLoadingStats: false,
            });
            return data;
          }
        } catch (err) {
          console.error("[useAppStore] Error fetching stats:", err);
        } finally {
          set({ isLoadingStats: false });
        }
        return get().stats;
      },

      // --- CACHE INVALIDATION ---
      invalidateCache: (key) => {
        if (!key) {
          set({
            lastFetchedSongs: null,
            lastFetchedRepresentatives: null,
            lastFetchedGigs: null,
            lastFetchedStats: null,
          });
        } else if (key === "songs") {
          set({ lastFetchedSongs: null });
        } else if (key === "representatives") {
          set({ lastFetchedRepresentatives: null });
        } else if (key === "gigs") {
          set({ lastFetchedGigs: null });
        } else if (key === "stats") {
          set({ lastFetchedStats: null });
        }
      },
    }),
    {
      name: "caixa_repertorio_cache_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        songs: state.songs,
        representatives: state.representatives,
        gigs: state.gigs,
        stats: state.stats,
        lastFetchedSongs: state.lastFetchedSongs,
        lastFetchedRepresentatives: state.lastFetchedRepresentatives,
        lastFetchedGigs: state.lastFetchedGigs,
        lastFetchedStats: state.lastFetchedStats,
      }),
    }
  )
);
