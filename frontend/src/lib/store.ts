import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiBaseUrl } from "./utils";

const API_URL = getApiBaseUrl();

export type UserRole = "ADMIN" | "VISITOR" | null;

export type AuthUser = {
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  token?: string;
};

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

export type GenreItem = {
  id?: string;
  name: string;
  count: number;
  averageMastery: number;
  level5Count: number;
  color: string;
  isCustom: boolean;
};

export type EvolutionSong = {
  historyId?: string;
  songId: string;
  title: string;
  composer?: string;
  artistName?: string;
  genre?: string;
  previousLevel: number;
  newLevel: number;
  levelGain?: number;
  changedAt: string;
  rawDate?: string;
};

export type DashboardData = {
  period: string;
  since?: string;
  overallReadiness: {
    totalSongs: number;
    level5Songs?: number;
    readyForStageCount?: number;
    readinessPercentage?: number;
    readyPercentage?: number;
  };
  topMasteredGenre: {
    name?: string;
    genre?: string;
    averageMastery: number;
    level5Count: number;
    totalSongs: number;
    percentageOfGenreLevel5?: number;
    color: string;
    isCustom?: boolean;
    summary?: string;
  } | null;
  artistStats: Array<{
    artistId: string;
    artistName: string;
    artistType: string;
    totalSongs: number;
    levelBreakdown: Record<string, number>;
    averageMastery: number;
    masteredCount: number;
    masteredPercentage: number;
  }>;
  genreStats: Array<{
    name?: string;
    genre?: string;
    count: number;
    percentage?: number;
    percentageOfRepertoire?: number;
    averageMastery: number;
    level5Count: number;
    color: string;
    isCustom?: boolean;
  }>;
  evolutionStats: {
    period: string;
    totalEvolutions?: number;
    totalEvolved?: number;
    evolvedSongsCount?: number;
    timeline: Array<{
      date?: string;
      label: string;
      count: number;
    }>;
    evolvedSongs: EvolutionSong[];
  };
};

interface AppState {
  // Auth state
  currentUser: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  loginAsVisitor: () => void;
  logout: () => void;
  isAdmin: () => boolean;

  // Hydration state
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Cached data
  songs: Song[];
  representatives: Representative[];
  representativeSongsCache: Record<string, RepresentativeSong[]>;
  gigs: Gig[];
  stats: Stats | null;
  genres: GenreItem[];
  dashboardDataCache: Record<string, { data: DashboardData; timestamp: number }>;

  // Cache Timestamps (ms)
  lastFetchedSongs: number | null;
  lastFetchedRepresentatives: number | null;
  lastFetchedGigs: number | null;
  lastFetchedStats: number | null;
  lastFetchedGenres: number | null;

  // Loading flags
  isLoadingSongs: boolean;
  isLoadingRepresentatives: boolean;
  isLoadingGigs: boolean;
  isLoadingStats: boolean;
  isLoadingGenres: boolean;

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
  addGig: (gigData: any) => Promise<Gig>;
  deleteGig: (id: string) => Promise<void>;

  // Actions - Stats & Dashboard
  fetchStats: (force?: boolean) => Promise<Stats | null>;
  fetchDashboardData: (period?: string, force?: boolean) => Promise<DashboardData | null>;

  // Actions - Genres
  fetchGenres: (force?: boolean) => Promise<GenreItem[]>;
  addCustomGenre: (name: string, color?: string) => Promise<GenreItem>;
  renameGenre: (oldName: string, newName: string, color?: string) => Promise<void>;
  deleteGenre: (idOrName: string) => Promise<void>;
  deleteCustomGenre: (id: string) => Promise<void>;

  // Cache Invalidation & Manual Reset
  invalidateCache: (key?: "songs" | "representatives" | "gigs" | "stats" | "genres" | "dashboard" | "all") => void;
  clearAllCache: () => void;
}

// 1 hour cache TTL: avoids repeated database hits while keeping data fresh
const CACHE_TTL = 60 * 60 * 1000;

const getAuthHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      login: async (username: string, password: string) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Usuário ou senha incorretos.");
        }
        const data: AuthUser = await res.json();
        set({ currentUser: data });
        return data;
      },

      loginAsVisitor: () => {
        const visitor: AuthUser = {
          username: "visitante",
          name: "Visitante",
          role: "VISITOR",
        };
        set({ currentUser: visitor });
      },

      logout: () => {
        set({ currentUser: null });
      },

      isAdmin: () => {
        return get().currentUser?.role === "ADMIN";
      },

      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      songs: [],
      representatives: [],
      representativeSongsCache: {},
      gigs: [],
      stats: null,
      genres: [],
      dashboardDataCache: {},

      lastFetchedSongs: null,
      lastFetchedRepresentatives: null,
      lastFetchedGigs: null,
      lastFetchedStats: null,
      lastFetchedGenres: null,

      isLoadingSongs: false,
      isLoadingRepresentatives: false,
      isLoadingGigs: false,
      isLoadingStats: false,
      isLoadingGenres: false,

      // --- SONGS ---
      fetchSongs: async (force = false) => {
        const { songs, isLoadingSongs } = get();

        // CACHE-FIRST: If songs are already in localStorage cache, return immediately
        if (!force && songs && songs.length > 0) {
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
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/songs`, {
          method: "POST",
          headers: getAuthHeaders(token),
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
          dashboardDataCache: {}, // Invalidate dashboard cache to reflect new song
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
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/songs/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(token),
          body: JSON.stringify(songData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao atualizar música no servidor.");
        }
        const updated: Song = await res.json();

        set((state) => {
          // Intelligently update rep songs cache in-place without wiping all artist repertoires
          const updatedRepCache = Object.fromEntries(
            Object.entries(state.representativeSongsCache).map(([repId, repSongs]) => [
              repId,
              repSongs.map((s) =>
                s.songId === id
                  ? {
                      ...s,
                      title: updated.title,
                      composer: updated.composer || s.composer,
                      genre: updated.genre || s.genre,
                      masteryLevel: updated.masteryLevel,
                    }
                  : s
              ),
            ])
          );

          return {
            songs: state.songs.map((s) => (s.id === id ? updated : s)),
            lastFetchedSongs: Date.now(),
            representativeSongsCache: updatedRepCache,
            dashboardDataCache: {}, // Invalidate dashboard cache
          };
        });

        return updated;
      },

      deleteSong: async (id) => {
        const token = get().currentUser?.token;
        const target = get().songs.find((s) => s.id === id);
        const res = await fetch(`${API_URL}/api/songs/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(token),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao excluir música do servidor.");
        }

        set((state) => ({
          songs: state.songs.filter((s) => s.id !== id),
          lastFetchedSongs: Date.now(),
          representativeSongsCache: Object.fromEntries(
            Object.entries(state.representativeSongsCache).map(([repId, repSongs]) => [
              repId,
              repSongs.filter((s) => s.songId !== id),
            ])
          ),
          dashboardDataCache: {},
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
          dashboardDataCache: {},
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
          const token = get().currentUser?.token;
          await fetch(`${API_URL}/api/songs/${id}/mastery`, {
            method: "PATCH",
            headers: getAuthHeaders(token),
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
          representativeSongsCache: Object.fromEntries(
            Object.entries(state.representativeSongsCache).map(([repId, repSongs]) => [
              repId,
              repSongs.map((rs) =>
                rs.songId === id ? { ...rs, genre: cleanGenre } : rs
              ),
            ])
          ),
          dashboardDataCache: {},
        }));

        try {
          const token = get().currentUser?.token;
          const res = await fetch(`${API_URL}/api/songs/${id}/genre`, {
            method: "PATCH",
            headers: getAuthHeaders(token),
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
        const { representatives, isLoadingRepresentatives } = get();

        // CACHE-FIRST: Return immediately from localStorage
        if (!force && representatives && representatives.length > 0) {
          return representatives;
        }

        if (isLoadingRepresentatives) return representatives;

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

        // CACHE-FIRST: If already cached for this representative, return immediately
        if (!force && cached !== undefined) {
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
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/representatives`, {
          method: "POST",
          headers: getAuthHeaders(token),
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
          dashboardDataCache: {},
        }));
        return created;
      },

      updateRepresentative: async (id, repData) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/representatives/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(token),
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
          dashboardDataCache: {},
        }));
        return updated;
      },

      deleteRepresentative: async (id) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/representatives/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(token),
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
          representativeSongsCache: Object.fromEntries(
            Object.entries(state.representativeSongsCache).filter(([repId]) => repId !== id)
          ),
          dashboardDataCache: {},
        }));
      },

      // --- GIGS ---
      fetchGigs: async (force = false) => {
        const { gigs, isLoadingGigs } = get();

        // CACHE-FIRST: Return immediately from localStorage
        if (!force && gigs && gigs.length > 0) {
          return gigs;
        }

        if (isLoadingGigs) return gigs;

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

      addGig: async (gigData) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/gigs`, {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify(gigData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao salvar show no servidor.");
        }
        const created: Gig = await res.json();

        set((state) => ({
          gigs: [created, ...state.gigs.filter((g) => g.id !== created.id)],
          lastFetchedGigs: Date.now(),
          dashboardDataCache: {},
          stats: state.stats
            ? {
                ...state.stats,
                upcomingGigs: state.stats.upcomingGigs + 1,
              }
            : null,
        }));
        return created;
      },

      deleteGig: async (id: string) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/gigs/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(token),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao excluir show no servidor.");
        }

        set((state) => ({
          gigs: state.gigs.filter((g) => g.id !== id),
          lastFetchedGigs: Date.now(),
          dashboardDataCache: {},
          stats: state.stats
            ? {
                ...state.stats,
                upcomingGigs: Math.max(0, state.stats.upcomingGigs - 1),
              }
            : null,
        }));
      },

      // --- STATS ---
      fetchStats: async (force = false) => {
        const { stats, isLoadingStats } = get();

        // CACHE-FIRST: Return immediately from localStorage
        if (!force && stats !== null) {
          return stats;
        }

        if (isLoadingStats) return stats;

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

      fetchDashboardData: async (period = "month", force = false) => {
        const { dashboardDataCache } = get();
        const cached = dashboardDataCache[period];

        // CACHE-FIRST: Return immediately from localStorage
        if (!force && cached && cached.data) {
          return cached.data;
        }

        try {
          const res = await fetch(`${API_URL}/api/analytics/dashboard?period=${period}`);
          if (res.ok) {
            const data: DashboardData = await res.json();
            set((state) => ({
              dashboardDataCache: {
                ...state.dashboardDataCache,
                [period]: { data, timestamp: Date.now() },
              },
            }));
            return data;
          }
        } catch (err) {
          console.error("[useAppStore] Error fetching dashboard data:", err);
        }
        return cached?.data || null;
      },

      // --- GENRES ---
      fetchGenres: async (force = false) => {
        const { genres, isLoadingGenres } = get();

        // CACHE-FIRST: Return immediately from localStorage
        if (!force && genres && genres.length > 0) {
          return genres;
        }

        if (isLoadingGenres) return genres;

        set({ isLoadingGenres: true });
        try {
          const res = await fetch(`${API_URL}/api/genres`);
          if (res.ok) {
            const data: GenreItem[] = await res.json();
            set({
              genres: data,
              lastFetchedGenres: Date.now(),
              isLoadingGenres: false,
            });
            return data;
          }
        } catch (err) {
          console.error("[useAppStore] Error fetching genres:", err);
        } finally {
          set({ isLoadingGenres: false });
        }
        return get().genres;
      },

      addCustomGenre: async (name: string, color?: string) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/genres`, {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ name: name.trim(), color }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Falha ao criar estilo musical.");
        }
        const created: GenreItem = await res.json();
        set((state) => ({
          genres: [...state.genres.filter((g) => g.name.toLowerCase() !== created.name.toLowerCase()), created],
          lastFetchedGenres: Date.now(),
          dashboardDataCache: {},
        }));
        return created;
      },

      renameGenre: async (oldName: string, newName: string, color?: string) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/genres`, {
          method: "PUT",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ oldName: oldName.trim(), newName: newName.trim(), color }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || errData?.message || "Falha ao atualizar estilo musical.");
        }
        get().invalidateCache("genres");
        get().invalidateCache("stats");
        get().invalidateCache("songs");
        get().invalidateCache("dashboard");
      },

      deleteGenre: async (idOrName: string) => {
        const token = get().currentUser?.token;
        const res = await fetch(`${API_URL}/api/genres/${encodeURIComponent(idOrName.trim())}`, {
          method: "DELETE",
          headers: getAuthHeaders(token),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || errData?.message || "Falha ao remover estilo musical.");
        }
        set((state) => ({
          genres: state.genres.filter((g) => g.id !== idOrName && g.name.toLowerCase() !== idOrName.toLowerCase()),
          lastFetchedGenres: Date.now(),
          dashboardDataCache: {},
        }));
        get().invalidateCache("genres");
        get().invalidateCache("stats");
        get().invalidateCache("songs");
        get().invalidateCache("dashboard");
      },

      deleteCustomGenre: async (id: string) => {
        return get().deleteGenre(id);
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
            lastFetchedGenres: null,
            dashboardDataCache: {},
          });
        } else if (key === "songs") {
          set({ lastFetchedSongs: null, dashboardDataCache: {} });
        } else if (key === "representatives") {
          set({ lastFetchedRepresentatives: null, representativeSongsCache: {} });
        } else if (key === "gigs") {
          set({ lastFetchedGigs: null, dashboardDataCache: {} });
        } else if (key === "stats") {
          set({ lastFetchedStats: null });
        } else if (key === "genres") {
          set({ lastFetchedGenres: null, dashboardDataCache: {} });
        } else if (key === "dashboard") {
          set({ dashboardDataCache: {} });
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
          genres: [],
          dashboardDataCache: {},
          lastFetchedSongs: null,
          lastFetchedRepresentatives: null,
          lastFetchedGigs: null,
          lastFetchedStats: null,
          lastFetchedGenres: null,
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
        currentUser: state.currentUser,
        songs: state.songs,
        representatives: state.representatives,
        representativeSongsCache: state.representativeSongsCache,
        gigs: state.gigs,
        stats: state.stats,
        genres: state.genres,
        dashboardDataCache: state.dashboardDataCache,
        lastFetchedSongs: state.lastFetchedSongs,
        lastFetchedRepresentatives: state.lastFetchedRepresentatives,
        lastFetchedGigs: state.lastFetchedGigs,
        lastFetchedStats: state.lastFetchedStats,
        lastFetchedGenres: state.lastFetchedGenres,
      }),
    }
  )
);
