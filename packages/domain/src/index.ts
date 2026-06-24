/* ─────────────────────────────────────────────────────────────────────────────
   Ares Station shared domain types

   These types are intentionally platform-neutral. They can be imported by the
   API, legacy Telegram web client, future React Native app, and validation
   scripts without pulling in React, Express, Prisma, or Telegram SDK code.
   ───────────────────────────────────────────────────────────────────────────── */

export const PUZZLE_TYPES = [
  "keypad",
  "cipher_wheel",
  "wire",
  "logic",
  "pattern_grid",
  "multi_choice",
  "text_input",
  "frequency",
] as const;

export type PuzzleType = (typeof PUZZLE_TYPES)[number];

export type DayTheme = "standard" | "artifact" | "red-alert" | string;

export type Author = {
  short: string;
  full: string;
};

export type RedactSpec = {
  slot: string;
  placeholder: string;
  reveal?: string;
};

export type DocLine = {
  type?: "text" | "heading" | "redacted" | "table";
  text?: string;
  redact?: RedactSpec;
  rest?: string;
  rows?: string[][];
};

export type KeypadPuzzleData = {
  length?: number;
};

export type CipherWheelPuzzleData = {
  encoded: string;
};

export type WirePuzzleData = {
  left: string[];
  right: string[];
};

export type ChoicePuzzleData = {
  options: string[];
};

export type LogicPuzzleData = ChoicePuzzleData & {
  scenario?: string;
  clues?: string[];
};

export type PatternGridPuzzleData = {
  rows: number;
  cols: number;
};

export type PuzzleData =
  | KeypadPuzzleData
  | CipherWheelPuzzleData
  | WirePuzzleData
  | ChoicePuzzleData
  | LogicPuzzleData
  | PatternGridPuzzleData
  | Record<string, unknown>;

export type PublicPuzzle = {
  slot: string;
  type: PuzzleType;
  title?: string;
  author?: string;
  prompt: string;
  data?: PuzzleData;
  hintText?: string | null;
  unlockWord: string;
};

/** Alias used by clients after answers have been stripped server-side. */
export type Puzzle = PublicPuzzle;

export type PrivatePuzzle = PublicPuzzle & {
  _answer: string;
};

export type PublicFinale = {
  goal: string;
  constraintWords: string[];
  preUnlocked: string[];
  forbidden: string[];
  maxAttempts: number;
};

export type PrivateFinale = PublicFinale & {
  _targetPhrase: string;
};

export type LogSegment =
  | { type: "text"; text: string }
  | { type: "redacted"; text: string; key: string };

export type ParadoxLog = {
  id: string;
  timestamp: string;
  classification: string;
  segments: LogSegment[];
};

export type PrivateDay = {
  id: string;
  number: number;
  title: string;
  stardate: string;
  author: Author;
  theme?: DayTheme;
  document: DocLine[];
  puzzles: PrivatePuzzle[];
  finale: PrivateFinale;
  paradoxLogs?: ParadoxLog[];
};

export type PublicDay = Omit<PrivateDay, "id" | "puzzles" | "finale"> & {
  dayId: string;
  puzzles: PublicPuzzle[];
  finale: PublicFinale;
};

/** Alias used by the clients after answers have been stripped server-side. */
export type Day = PublicDay;

export type PlayerDayProgress = {
  id: string;
  unlockedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  solvedSlots: Record<string, boolean>;
  unlockWords: string[];
  paradoxWin: boolean;
  attemptsUsed: number;
};

export type PuzzleCheckResponse = {
  ok?: boolean;
  correct: boolean;
  unlockWord?: string;
  hint?: string;
  revealText?: string;
  allSolved?: boolean;
  alreadySolved?: boolean;
};

export type ParadoxAskResponse = {
  reply: string;
  win: boolean;
  attemptsRemaining: number;
};
