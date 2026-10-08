import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiBaseUrl } from "./utils";

const API_URL = getApiBaseUrl();

export type RepresentativeLink = {
  representativeId: string;
  representativeName?: string;
  performanceKey: string;
  specificNotes?: string;
};

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
  representativeLinks?: RepresentativeLink[];
};

export type Representative = {
  id: string;
  name: string;
  type: string;
  contactInfo?: string;
  active?: boolean;
};

export type Intersection = {
  representativeName: string;
  performanceKey: string;
};

export type RepresentativeSong = {
  songId: string;
  title: string;
  composer: string;
  genre: string;
  masteryLevel: number;
  performanceKey: string;
  intersections: Intersection[];
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
  // Hydration state
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Cached data
  songs: Song[];
  representatives: Representative[];
  representativeSongsCache: Record<string, RepresentativeSong[]>;
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
  addSong: (songData: Partial<Song>) => Promise<Song>;
  updateSong: (id: string, songData: Partial<Song>) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
  updateMastery: (id: string, level: number) => Promise<void>;
  updateGenre: (id: string, genre: string) => Promise<void>;

  // Actions - Representatives & Exclusive Songs
  fetchRepresentatives: (force?: boolean) => Promise<Representative[]>;
  fetchRepresentativeSongs: (representativeId: string, force?: boolean) => Promise<RepresentativeSong[]>;
  addRepresentative: (repData: Partial<Representative>) => Promise<Representative>;
  updateRepresentative: (id: string, repData: Partial<Representative>) => Promise<Representative>;
  deleteRepresentative: (id: string) => Promise<void>;

  // Actions - Gigs
  fetchGigs: (force?: boolean) => Promise<Gig[]>;

  // Actions - Stats
  fetchStats: (force?: boolean) => Promise<Stats | null>;

  // Cache Invalidation & Manual Reset
  invalidateCache: (key?: "songs" | "representatives" | "gigs" | "stats" | "all") => void;
  clearAllCache: () => void;
}

// 1 hour cache TTL: avoids repeated database hits while keeping data fresh
const CACHE_TTL = 60 * 60 * 1000;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      songs: [],
      representatives: [],
      representativeSongsCache: {},
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
        const isFresh = lastFetchedSongs && (now - lastFetchedSongs < CACHE_TTL);

        if (!force && songs.length > 0 && isFresh) {
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

      addSong: async (songData) => {
        const res = await fetch(`${API_URL}/api/songs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(songData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao cadastrar música no servidor.");
        }
        const created: Song = await res.json();

        // Immediately update LocalStorage cache
        set((state) => ({
          songs: [created, ...state.songs],
          lastFetchedSongs: Date.now(),
          representativeSongsCache: {}, // invalidate rep songs cache to reflect new links
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

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao atualizar música no servidor.");
        }
        const updated: Song = await res.json();

        set((state) => ({
          songs: state.songs.map((s) => (s.id === id ? updated : s)),
          lastFetchedSongs: Date.now(),
          representativeSongsCache: {}, // invalidate rep songs cache
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
          representativeSongsCache: {},
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

        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === id ? { ...s, masteryLevel: level } : s
          ),
          representativeSongsCache: Object.fromEntries(
            Object.entries(state.representativeSongsCache).map(([repId, repSongs]) => [
              repId,
              repSongs.map((rs) =>
                rs.songId === id ? { ...rs, masteryLevel: level } : rs
              ),
            ])
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
          set({ songs: prevSongs });
        }
      },

      updateGenre: async (id, genre) => {
        const prevSongs = get().songs;
        const cleanGenre = genre ? genre.trim() : "";

        // Optimistic update
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === id ? { ...s, genre: cleanGenre } : s
          ),
          representativeSongsCache: {}, // Invalidate cache so representative lists also update
        }));

        try {
          const res = await fetch(`${API_URL}/api/songs/${id}/genre`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ genre: cleanGenre }),
          });
          if (!res.ok) {
            throw new Error("Falha ao atualizar gênero da música.");
          }
          const updated: Song = await res.json();
          set((state) => ({
            songs: state.songs.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (err) {
          console.error("[useAppStore] Failed to update genre:", err);
          set({ songs: prevSongs });
          throw err;
        }
      },

      // --- REPRESENTATIVES ---
      fetchRepresentatives: async (force = false) => {
        const { representatives, lastFetchedRepresentatives } = get();
        const now = Date.now();
        const isFresh =
          lastFetchedRepresentatives && now - lastFetchedRepresentatives < CACHE_TTL;

        if (!force && representatives.length > 0 && isFresh) {
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

      fetchRepresentativeSongs: async (representativeId: string, force = false) => {
        const { representativeSongsCache } = get();
        const cached = representativeSongsCache[representativeId];

        if (!force && cached && cached.length > 0) {
          return cached;
        }

        try {
          const res = await fetch(`${API_URL}/api/representatives/${representativeId}/songs`);
          if (res.ok) {
            const data: RepresentativeSong[] = await res.json();
            set((state) => ({
              representativeSongsCache: {
                ...state.representativeSongsCache,
                [representativeId]: data,
              },
            }));
            return data;
          }
        } catch (err) {
          console.error(`[useAppStore] Error fetching songs for representative ${representativeId}:`, err);
        }
        return cached || [];
      },

      addRepresentative: async (repData) => {
        const res = await fetch(`${API_URL}/api/representatives`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(repData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao criar artista/projeto.");
        }
        const created: Representative = await res.json();
        set((state) => ({
          representatives: [created, ...state.representatives.filter((r) => r.id !== created.id)],
          lastFetchedRepresentatives: Date.now(),
        }));
        return created;
      },

      updateRepresentative: async (id, repData) => {
        const res = await fetch(`${API_URL}/api/representatives/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(repData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao atualizar artista/projeto.");
        }
        const updated: Representative = await res.json();
        set((state) => ({
          representatives: state.representatives.map((r) => (r.id === id ? updated : r)),
          lastFetchedRepresentatives: Date.now(),
        }));
        return updated;
      },

      deleteRepresentative: async (id) => {
        const res = await fetch(`${API_URL}/api/representatives/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao excluir artista/projeto do servidor.");
        }
        set((state) => ({
          representatives: state.representatives.filter((r) => r.id !== id),
          songs: state.songs.map((s) => ({
            ...s,
            representativeLinks: (s.representativeLinks || []).filter(
              (l) => l.representativeId !== id
            ),
          })),
          lastFetchedRepresentatives: Date.now(),
          representativeSongsCache: {},
        }));
      },

      // --- GIGS ---
      fetchGigs: async (force = false) => {
        const { gigs, lastFetchedGigs } = get();
        const now = Date.now();
        const isFresh = lastFetchedGigs && now - lastFetchedGigs < CACHE_TTL;

        if (!force && gigs.length > 0 && isFresh) {
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

        if (!force && stats !== null && isFresh) {
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

      // --- CACHE MANAGEMENT ---
      invalidateCache: (key) => {
        if (!key || key === "all") {
          set({
            lastFetchedSongs: null,
            lastFetchedRepresentatives: null,
            representativeSongsCache: {},
            lastFetchedGigs: null,
            lastFetchedStats: null,
          });
        } else if (key === "songs") {
          set({ lastFetchedSongs: null, representativeSongsCache: {} });
        } else if (key === "representatives") {
          set({ lastFetchedRepresentatives: null, representativeSongsCache: {} });
        } else if (key === "gigs") {
          set({ lastFetchedGigs: null });
        } else if (key === "stats") {
          set({ lastFetchedStats: null });
        }
      },

      clearAllCache: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("caixa_repertorio_cache_v1");
        }
        set({
          songs: [],
          representatives: [],
          representativeSongsCache: {},
          gigs: [],
          stats: null,
          lastFetchedSongs: null,
          lastFetchedRepresentatives: null,
          lastFetchedGigs: null,
          lastFetchedStats: null,
        });
      },
    }),
    {
      name: "caixa_repertorio_cache_v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        songs: state.songs,
        representatives: state.representatives,
        representativeSongsCache: state.representativeSongsCache,
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
