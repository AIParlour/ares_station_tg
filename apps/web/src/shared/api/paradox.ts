import { apiPost } from "./client";
import type { PuzzleCheckResponse, ParadoxAskResponse } from "../types/game";

export function checkPuzzle(
  dayId: string,
  slot: string,
  answer: string
): Promise<PuzzleCheckResponse> {
  return apiPost<PuzzleCheckResponse>("/api/puzzle/check", { dayId, slot, answer });
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
