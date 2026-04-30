import { apiGet } from "./client";
import type { Day } from "../types/game";

export interface PlayerDayProgress {
  id: string;
  unlockedAt: string;
  solvedSlots: Record<string, boolean>;
  unlockWords: string[];
  paradoxWin: boolean;
  attemptsUsed: number;
}

interface DayResponse {
  ok: boolean;
  playerDay: PlayerDayProgress;
  day: Day;
}

export async function fetchCurrentDay(): Promise<{
  day: Day;
  progress: PlayerDayProgress;
}> {
  const res = await apiGet<DayResponse>("/api/days/current");
  return { day: res.day, progress: res.playerDay };
}

/** @deprecated — use fetchCurrentDay() which also returns progress */
export function fetchToday(): Promise<Day> {
  return fetchCurrentDay().then((r) => r.day);
}
