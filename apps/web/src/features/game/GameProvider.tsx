/* ─────────────────────────────────────────────────────────────────────────────
   GameProvider — manages the Day data + per-puzzle progress.
   Keeps track of which slots are solved and which unlock words are collected.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from "react";
import type { Day } from "../../shared/types/game";
import { fetchCurrentDay } from "../../shared/api/day";
import { applyTheme, themeFromDay } from "../../app/theme";

/* ── State ───────────────────────────────────────────────────────────────────── */

/** Minimal snapshot of a completed day for the collected documents list */
export interface CompletedDay {
  dayId: string;
  number: number;
  title: string;
  stardate: string;
  author: { short: string; full: string };
}

interface GameState {
  status: "idle" | "loading" | "ready" | "error";
  day: Day | null;
  error: string | null;
  /** slot id → true when solved */
  solved: Record<string, boolean>;
  /** words collected from solved puzzles */
  unlockedWords: string[];
  /** days the player has completed (story read + day archived) */
  completedDays: CompletedDay[];
  /** Last unlock-word the player just solved — drives the redaction
   *  reveal animation on DocumentScreen. Cleared by `clearPendingReveal()`
   *  once the animation has played. Survives the navigation hop from
   *  PuzzleScreen → DocumentScreen because it lives in the provider. */
  pendingReveal: string | null;
}

const COMPLETED_DAYS_KEY = "ares_completed_days";

function loadCompletedDays(): CompletedDay[] {
  try {
    const raw = localStorage.getItem(COMPLETED_DAYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompletedDays(days: CompletedDay[]) {
  try {
    localStorage.setItem(COMPLETED_DAYS_KEY, JSON.stringify(days));
  } catch { /* storage full — degrade silently */ }
}

const initialState: GameState = {
  status: "idle",
  day: null,
  error: null,
  solved: {},
  unlockedWords: [],
  completedDays: loadCompletedDays(),
  pendingReveal: null,
};

/* ── Actions ─────────────────────────────────────────────────────────────────── */

type GameAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_OK"; day: Day; solved?: Record<string, boolean>; unlockedWords?: string[] }
  | { type: "FETCH_ERR"; error: string }
  | { type: "SOLVE_PUZZLE"; slot: string; unlockWord: string }
  | { type: "CLEAR_PENDING_REVEAL" }
  | { type: "COMPLETE_DAY" };

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_OK":
      return {
        ...state,
        status: "ready",
        day: action.day,
        solved: action.solved ?? state.solved,
        unlockedWords: action.unlockedWords ?? state.unlockedWords,
      };
    case "FETCH_ERR":
      return { ...state, status: "error", error: action.error };
    case "SOLVE_PUZZLE": {
      if (state.solved[action.slot]) return state; // idempotent
      return {
        ...state,
        solved: { ...state.solved, [action.slot]: true },
        unlockedWords: [...state.unlockedWords, action.unlockWord],
        pendingReveal: action.unlockWord,
      };
    }
    case "CLEAR_PENDING_REVEAL":
      return state.pendingReveal === null
        ? state
        : { ...state, pendingReveal: null };
    case "COMPLETE_DAY": {
      if (!state.day) return state;
      const already = state.completedDays.some((d) => d.dayId === state.day!.dayId);
      if (already) return state; // idempotent
      const entry: CompletedDay = {
        dayId: state.day.dayId,
        number: state.day.number,
        title: state.day.title,
        stardate: state.day.stardate,
        author: state.day.author,
      };
      const updated = [...state.completedDays, entry];
      saveCompletedDays(updated);
      return { ...state, completedDays: updated };
    }
  }
}

/* ── Context ─────────────────────────────────────────────────────────────────── */

interface GameContextValue {
  state: GameState;
  solvePuzzle: (slot: string, unlockWord: string) => void;
  completeDay: () => void;
  clearPendingReveal: () => void;
  reload: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

/* ── Provider ────────────────────────────────────────────────────────────────── */

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = () => {
    dispatch({ type: "FETCH_START" });
    fetchCurrentDay()
      .then(({ day, progress }) => {
        // Restore solved state from server (survives page refresh)
        const solved: Record<string, boolean> = {};
        if (progress.solvedSlots && typeof progress.solvedSlots === "object") {
          for (const key of Object.keys(progress.solvedSlots)) {
            solved[key] = true;
          }
        }
        dispatch({
          type: "FETCH_OK",
          day,
          solved,
          unlockedWords: progress.unlockWords ?? [],
        });
        applyTheme(themeFromDay(day.theme));
      })
      .catch((err: unknown) => {
        dispatch({
          type: "FETCH_ERR",
          error: err instanceof Error ? err.message : "Failed to load mission data.",
        });
      });
  };

  // NOTE: do NOT auto-load here. GameProvider mounts before auth completes
  // (LoadingScreen runs the auth hook). Screens call reload() after auth is done.

  const solvePuzzle = (slot: string, unlockWord: string) => {
    dispatch({ type: "SOLVE_PUZZLE", slot, unlockWord });
  };

  const completeDay = () => {
    dispatch({ type: "COMPLETE_DAY" });
  };

  const clearPendingReveal = () => {
    dispatch({ type: "CLEAR_PENDING_REVEAL" });
  };

  return (
    <GameContext.Provider
      value={{ state, solvePuzzle, completeDay, clearPendingReveal, reload: load }}
    >
      {children}
    </GameContext.Provider>
  );
}
