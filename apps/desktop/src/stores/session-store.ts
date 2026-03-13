import { create } from 'zustand';

interface MatchResult {
  placement: number;
  heroCardId: string;
  mmrDelta: number;
  timestamp: number;
}

interface SessionState {
  mmrStart: number | null;
  mmrCurrent: number | null;
  matchResults: MatchResult[];
  sessionStartedAt: number | null;

  startSession: (mmr: number) => void;
  addMatchResult: (result: MatchResult) => void;
  updateMmr: (mmr: number) => void;
  resetSession: () => void;
  getMmrDelta: () => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  mmrStart: null,
  mmrCurrent: null,
  matchResults: [],
  sessionStartedAt: null,

  startSession: (mmr) => {
    set({
      mmrStart: mmr,
      mmrCurrent: mmr,
      matchResults: [],
      sessionStartedAt: Date.now(),
    });
  },

  addMatchResult: (result) => {
    set((state) => ({
      matchResults: [...state.matchResults, result],
      mmrCurrent: state.mmrCurrent !== null
        ? state.mmrCurrent + result.mmrDelta
        : result.mmrDelta,
    }));
  },

  updateMmr: (mmr) => set({ mmrCurrent: mmr }),

  resetSession: () =>
    set({
      mmrStart: null,
      mmrCurrent: null,
      matchResults: [],
      sessionStartedAt: null,
    }),

  getMmrDelta: () => {
    const { mmrStart, mmrCurrent } = get();
    if (mmrStart === null || mmrCurrent === null) return 0;
    return mmrCurrent - mmrStart;
  },
}));
