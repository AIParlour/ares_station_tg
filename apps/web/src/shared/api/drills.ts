/* ─────────────────────────────────────────────────────────────────────────────
   Operator Drills API client.
   Talks to /api/drills/* — see apps/api/src/routes/drills.ts.
   ───────────────────────────────────────────────────────────────────────────── */

import { apiGet, apiPost } from "./client";

export type DrillType = "cipher" | "sensor" | "pattern" | "drift";

export type MasteryTier = "none" | "bronze" | "silver" | "gold";

export interface DrillStat {
  drillType:         DrillType;
  bestScore:         number;
  masteryTier:       MasteryTier;
  totalSessions:     number;
  totalRoundsPlayed: number;
}

export interface DrillStreak {
  currentStreak:  number;
  longestStreak:  number;
  lastWorkoutDay: string | null;
}

export interface TodayWorkout {
  utcDay:      string;
  drills:      DrillType[];
  status:      "pending" | "completed";
  completedAt: string | null;
}

export interface DrillsState {
  ok:           true;
  stats:        DrillStat[];
  streak:       DrillStreak;
  todayWorkout: TodayWorkout;
}

export interface RoundResult {
  ok:               true;
  drillType:        DrillType;
  score:            number;
  durationMs:       number;
  newPersonalBest:  boolean;
  masteryTier:      MasteryTier;
  masteryChanged:   boolean;
}

export interface WorkoutResult {
  ok:              true;
  streak:          number;
  longestStreak:   number;
  currencyAwarded: number;
  codexUnlocks:    Array<{ id: string; title: string }>;
  flavorLine:      string;
}

export function getDrillsState(): Promise<DrillsState> {
  return apiGet<DrillsState>("/api/drills/state");
}

export function submitRound(
  drillType: DrillType,
  score: number,
  durationMs: number,
): Promise<RoundResult> {
  return apiPost<RoundResult>("/api/drills/round", { drillType, score, durationMs });
}

export function completeWorkout(
  rounds: Array<{ drillType: DrillType; score: number }>,
  integrityScore: number,
): Promise<WorkoutResult> {
  return apiPost<WorkoutResult>("/api/drills/workout/complete", { rounds, integrityScore });
}
