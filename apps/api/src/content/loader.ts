import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export type RedactSpec = { slot: string; placeholder: string; reveal: string };
export type DocLine = { text: string; redact?: RedactSpec; rest?: string };
export type Puzzle = {
  slot: string;
  type: "riddle" | "sequence" | "math" | "cipher" | "wordplay";
  author?: string;
  prompt: string;
  hintText?: string | null;
  _answer: string;
  unlockWord: string;
};
export type Finale = {
  goal: string;
  constraintWords: string[];
  preUnlocked: string[];
  forbidden: string[];
  _targetPhrase: string;
  maxAttempts: number;
};
export type Day = {
  id: string;
  number: number;
  title: string;
  stardate: string;
  author: { short: string; full: string };
  document: DocLine[];
  puzzles: Puzzle[];
  finale: Finale;
};

const day1Path = resolve(here, "day1.json");
export const day1: Day = JSON.parse(readFileSync(day1Path, "utf-8"));

// Public-safe view: strips answers and target phrase before sending to client.
export function publicDay(d: Day) {
  return {
    id: d.id,
    number: d.number,
    title: d.title,
    stardate: d.stardate,
    author: d.author,
    document: d.document.map((l) =>
      l.redact
        ? { text: l.text, redact: { slot: l.redact.slot, placeholder: l.redact.placeholder }, rest: l.rest }
        : l
    ),
    puzzles: d.puzzles.map((p) => ({
      slot: p.slot,
      type: p.type,
      prompt: p.prompt,
      hintText: p.hintText,
      unlockWord: p.unlockWord, // revealed so FE can show constraint chip after solve
    })),
    finale: {
      goal: d.finale.goal,
      constraintWords: d.finale.constraintWords,
      preUnlocked: d.finale.preUnlocked,
      forbidden: d.finale.forbidden,
      maxAttempts: d.finale.maxAttempts,
    },
  };
}
