/* ─────────────────────────────────────────────────────────────────────────────
   Game domain types
   ───────────────────────────────────────────────────────────────────────────── */

export type PuzzleType = "riddle" | "math" | "cipher" | "wordplay" | "sequence";

export type DocLineType = "text" | "heading" | "redacted" | "table";

export type DocLine = {
  type: DocLineType;
  text?: string;
  rows?: string[][];
};

export type Puzzle = {
  slot: string;
  type: PuzzleType;
  title: string;
  prompt: string;
  data?: unknown;
  hintText?: string | null;
  unlockWord: string;
};

export type Finale = {
  goal: string;
  constraintWords: string[];
  preUnlocked: string[];
  forbidden: string[];
  maxAttempts: number;
};

export type DayTheme = "standard" | "artifact" | "red-alert";

/* ── Paradox system logs (log-decryption finale) ────────────────────────────── */

export type LogSegment =
  | { type: "text"; text: string }
  | { type: "redacted"; text: string; key: string };

export type ParadoxLog = {
  id: string;
  timestamp: string;
  classification: string;
  segments: LogSegment[];
};

export type Day = {
  /** Server-side identifier used in API calls (e.g. "day-001") */
  dayId: string;
  number: number;
  title: string;
  stardate: string;
  author: { short: string; full: string };
  theme?: string;
  document: DocLine[];
  puzzles: Puzzle[];
  finale: Finale;
  /** System logs authored by Paradox — decrypted segment-by-segment using unlocked words */
  paradoxLogs?: ParadoxLog[];
};

/* ── API response shapes ─────────────────────────────────────────────────── */

export type PuzzleCheckResponse = {
  correct: boolean;
  /** The word unlocked by solving this puzzle */
  unlockWord?: string;
  /** Optional hint shown on wrong answers */
  hint?: string;
  revealText?: string;
};

export type ParadoxAskResponse = {
  reply: string;
  win: boolean;
  attemptsRemaining: number;
};
