/* ─────────────────────────────────────────────────────────────────────────────
   Progress / currency API client.
   Talks to /api/progress/* — see apps/api/src/routes/progress.ts.
   ───────────────────────────────────────────────────────────────────────────── */

import { apiGet, apiPost } from "./client";

export type DayStatus = "locked" | "available" | "in_progress" | "completed";

export interface ProgressDay {
  dayId:        string;
  season:       number;
  dayNumber:    number;
  status:       DayStatus;
  unlockedAt:   string;
  startedAt:    string | null;
  completedAt:  string | null;
  solvedSlots:  Record<string, boolean>;
  unlockWords:  string[];
  paradoxWin:   boolean;
  attemptsUsed: number;
  title:        string;
}

export interface ProgressPlayer {
  balance:   number;
  firstName: string;
  username:  string | null;
}

export interface ProgressResponse {
  ok:     true;
  player: ProgressPlayer;
  days:   ProgressDay[];
}

/** Fetch the player's full day list + balance. */
export function fetchProgress(): Promise<ProgressResponse> {
  return apiGet<ProgressResponse>("/api/progress");
}

export interface SkipWaitResponse {
  ok:         true;
  newBalance: number;
  message?:   string;
}

/** Skip the release timer on a locked day. Costs 50 ⬡ on the server. */
export function skipWait(dayId: string): Promise<SkipWaitResponse> {
  return apiPost<SkipWaitResponse>("/api/progress/skip-wait", { dayId });
}

/** Convenience: find the next locked day (lowest dayNumber with status "locked"). */
export function findNextLockedDay(days: ProgressDay[]): ProgressDay | null {
  const locked = days
    .filter((d) => d.status === "locked")
    .sort((a, b) => a.dayNumber - b.dayNumber);
  return locked[0] ?? null;
}
