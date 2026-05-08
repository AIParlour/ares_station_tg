import { apiPost } from "./client";
import type { PuzzleCheckResponse, ParadoxAskResponse } from "../types/game";

export function checkPuzzle(
  dayId: string,
  slot: string,
  answer: string
): Promise<PuzzleCheckResponse> {
  return apiPost<PuzzleCheckResponse>("/api/puzzle/check", { dayId, slot, answer });
}

export type HintTier = "full_decrypt" | "signal_boost";

export interface PuzzleHintResponse {
  ok:          true;
  tier:        HintTier;
  unlockWord:  string;
  newBalance:  number;
  allSolved:   boolean;
}

/** Spend currency to reveal a puzzle's solution. v1 supports full_decrypt only. */
export function purchaseHint(
  dayId: string,
  slot:  string,
  tier:  HintTier
): Promise<PuzzleHintResponse> {
  return apiPost<PuzzleHintResponse>("/api/puzzle/hint", { dayId, slot, tier });
}

export function askParadox(
  dayId: string,
  prompt: string,
  unlockedWords: string[]
): Promise<ParadoxAskResponse> {
  return apiPost<ParadoxAskResponse>("/api/paradox/ask", { dayId, prompt, unlockedWords });
}

export function resetParadox(dayId: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/api/paradox/reset", { dayId });
}
