/* ─────────────────────────────────────────────────────────────────────────────
   Prisma seed — populates the days table from JSON content files.

   Usage:
     npx prisma db seed

   Content files live in src/content/ and follow this convention:
     - Each file exports the full day with answers inline
     - This script splits content (client-safe) from answers (server-only)
   ───────────────────────────────────────────────────────────────────────────── */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface RawPuzzle {
  slot: string;
  type: string;
  author?: string;
  prompt: string;
  hintText?: string | null;
  _answer: string;
  unlockWord: string;
  data?: unknown;
}

interface RawDay {
  id: string;
  number: number;
  title: string;
  stardate: string;
  author: { short: string; full: string };
  theme?: string;
  document: unknown[];
  puzzles: RawPuzzle[];
  finale: {
    goal: string;
    constraintWords: string[];
    preUnlocked: string[];
    forbidden: string[];
    _targetPhrase: string;
    maxAttempts: number;
  };
  paradoxLogs?: unknown[];
}

/**
 * Splits a raw day JSON into the Prisma-ready { content, answers } shape.
 *   content: everything the client needs (puzzle prompts, but no answers)
 *   answers: slot → { answer, unlockWord, hint } — server-only
 */
function splitDay(raw: RawDay) {
  // Build answer key from puzzles
  const answers: Record<string, { answer: string; unlockWord: string; hint: string | null }> = {};
  const clientPuzzles = raw.puzzles.map((p) => {
    answers[p.slot] = {
      answer: p._answer,
      unlockWord: p.unlockWord,
      hint: p.hintText ?? null,
    };
    // Return puzzle without _answer (client-safe)
    return {
      slot: p.slot,
      type: p.type,
      title: p.prompt.length > 80 ? (p.author ?? p.slot) : (p.author ?? p.slot),
      prompt: p.prompt,
      hintText: p.hintText ?? null,
      unlockWord: p.unlockWord, // unlock words are visible after solving
      ...(p.data !== undefined ? { data: p.data } : {}),
    };
  });

  // Build finale without _targetPhrase
  const { _targetPhrase, ...clientFinale } = raw.finale;

  // Add _targetPhrase to answers under a special key
  (answers as any).__finale = { targetPhrase: _targetPhrase };

  const content = {
    title: raw.title,
    stardate: raw.stardate,
    author: raw.author,
    theme: raw.theme ?? "standard",
    document: raw.document,
    puzzles: clientPuzzles,
    finale: clientFinale,
    ...(raw.paradoxLogs ? { paradoxLogs: raw.paradoxLogs } : {}),
  };

  return { content, answers };
}

/* ── Main ────────────────────────────────────────────────────────────────────── */

async function main() {
  const contentDir = join(__dirname, "..", "src", "content");

  // List of day files to seed — add more as content is authored
  const dayFiles = [
    { file: "day1.json", season: 1, dayNumber: 1 },
    { file: "day2.json", season: 1, dayNumber: 2 },
    { file: "day3.json", season: 1, dayNumber: 3 },
    { file: "day4.json", season: 1, dayNumber: 4 },
    { file: "day5.json", season: 1, dayNumber: 5 },
    { file: "day6.json", season: 1, dayNumber: 6 },
  ];

  for (const { file, season, dayNumber } of dayFiles) {
    const filePath = join(contentDir, file);
    let raw: RawDay;

    try {
      raw = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`  ✗ Could not read ${file}:`, err);
      continue;
    }

    const { content, answers } = splitDay(raw);
    const dayId = raw.id; // e.g. "day-1"

    await prisma.day.upsert({
      where: { id: dayId },
      update: {
        content,
        answers,
        season,
        dayNumber,
      },
      create: {
        id: dayId,
        season,
        dayNumber,
        publishedAt: new Date(),
        content,
        answers,
      },
    });

    console.log(`  ✓ Seeded ${dayId} (season ${season}, day ${dayNumber})`);
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
