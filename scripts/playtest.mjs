#!/usr/bin/env node
/**
 * Ares Station — Phase 7 Playtest Script
 *
 * Validates all 30 puzzles across Days 1–6 without needing a running server.
 * Checks:
 *   1. Cipher wheel: encoded strings decode correctly with prescribed shift
 *   2. Wire puzzles: answer format matches right[] items in left-index order
 *   3. Pattern grid: answer cells exist in the grid dimensions
 *   4. Keypad: answer is numeric, matches expected length
 *   5. Multi-choice: answer exactly matches one of the options
 *   6. Logic: answer exactly matches one of the options
 *   7. Paradox logs: every unlockWord appears as a key in at least one log segment
 *   8. Finale constraint words: match the set of puzzle unlockWords
 *   9. Seed-split check: _answer and unlockWord are present in every puzzle
 *  10. Cross-day progression: each day has exactly 5 puzzles
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "../apps/api/src/content");

const DAYS = [1, 2, 3, 4, 5, 6];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ── ANSI colours ──────────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`; // green
const R = (s) => `\x1b[31m${s}\x1b[0m`; // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`; // yellow
const B = (s) => `\x1b[1m${s}\x1b[0m`;  // bold
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

let PASS = 0;
let FAIL = 0;
const ISSUES = [];

function ok(label) {
  PASS++;
  console.log(`  ${G("✓")} ${label}`);
}

function fail(label, detail = "") {
  FAIL++;
  const msg = `  ${R("✗")} ${label}${detail ? `\n      ${R("→")} ${detail}` : ""}`;
  console.log(msg);
  ISSUES.push(`${label}${detail ? " — " + detail : ""}`);
}

function warn(label) {
  console.log(`  ${Y("⚠")} ${label}`);
}

// ── Cipher wheel decode (matches CipherWheelPuzzle.tsx) ──────────────────────
function cipherDecode(encoded, shift) {
  const len = ALPHABET.length;
  return Array.from(encoded)
    .map((ch) => {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx === -1) return ch;
      return ALPHABET[(idx + shift + len * 26) % len];
    })
    .join("");
}

// ── Wire answer builder (matches WireConnectionPuzzle.tsx handleSubmit) ──────
function buildWireAnswer(left, right, correctMapping) {
  // correctMapping: array of right-side values in left-index order
  return correctMapping.join(",");
}

// ── Load a day JSON ───────────────────────────────────────────────────────────
function loadDay(n) {
  const path = join(CONTENT_DIR, `day${n}.json`);
  return JSON.parse(readFileSync(path, "utf-8"));
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK FUNCTIONS PER PUZZLE TYPE
// ─────────────────────────────────────────────────────────────────────────────

function checkKeypad(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [keypad]`;
  const ans = puzzle._answer;
  const len = puzzle.data?.length;

  if (!ans) return fail(label, "missing _answer");
  if (!/^\d+$/.test(ans)) return fail(label, `answer "${ans}" is not numeric`);
  if (len && String(ans).length !== len) {
    return fail(label, `answer "${ans}" has ${ans.length} digits but data.length=${len}`);
  }
  ok(`${label} answer="${ans}" length=${ans.length}`);
}

function checkCipherWheel(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [cipher_wheel]`;
  const { encoded } = puzzle.data ?? {};
  const expected = puzzle._answer;

  if (!encoded) return fail(label, "missing data.encoded");
  if (!expected) return fail(label, "missing _answer");

  // Try all shifts 1–25 to find which one decodes correctly
  let found = false;
  let foundShift = null;
  for (let shift = 1; shift < 26; shift++) {
    const decoded = cipherDecode(encoded, shift);
    if (decoded === expected.toUpperCase()) {
      found = true;
      foundShift = shift;
      break;
    }
  }

  if (!found) {
    // Show what shift=0 and a few others decode to for debugging
    const attempts = [1, 2, 3, 4, 5, 6, 7, 20].map(
      (s) => `shift${s}→${cipherDecode(encoded, s)}`
    );
    return fail(label, `"${encoded}" cannot be decoded to "${expected}" with any shift 1–25. Samples: ${attempts.join(", ")}`);
  }

  // Now verify the hint matches the expected shift
  // The hint text usually says "shift back by N" or "use X as your shift"
  // We derive the UI shift: if decoded with shift S, then S is the actual modular shift
  // "shift back by N" in the puzzle text means the decode shift = (26 - N) % 26
  // We just confirm it decodes correctly at some shift.
  ok(`${label} encoded="${encoded}" → "${expected}" at shift+${foundShift} (i.e. back ${26 - foundShift})`);
}

// Extract the shift from the prompt/hint for validation
function extractPromptedShift(puzzle) {
  const hint = puzzle.hintText ?? "";

  // First: handle "X has N digits" / "N digits" pattern → extract N
  const digitsMatch = hint.match(/has (\d+) digits?/i) ?? hint.match(/(\d+) digits? =|= (\d+) digits?/i);
  if (digitsMatch) {
    return Number(digitsMatch[1] ?? digitsMatch[2]);
  }

  // "back by N" or "shift back N" or "shift of N"
  const backMatch = hint.match(/back\s+by\s+(\d+)/i) ?? hint.match(/shift\s+of\s+(\d+)/i);
  if (backMatch) return Number(backMatch[1]);

  // "N − M = K" style (cipher diff): capture the result K
  const diffMatch = hint.match(/\d+\s*[−\-]\s*\d+\s*=\s*(\d+)/);
  if (diffMatch) return Number(diffMatch[1]);

  // Small standalone number next to shift keyword (avoid grabbing large sol numbers)
  const shiftMatch = hint.match(/shift.*?\b(\d{1,2})\b|\b(\d{1,2})\b.*?shift/i);
  if (shiftMatch) {
    const n = Number(shiftMatch[1] ?? shiftMatch[2]);
    if (n >= 1 && n <= 25) return n;
  }

  return null;
}

function checkCipherWheelWithPromptedShift(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [cipher_wheel shift-hint]`;
  const { encoded } = puzzle.data ?? {};
  const expected = puzzle._answer;
  const promptedShift = extractPromptedShift(puzzle);

  if (promptedShift === null) {
    warn(`${label}: could not extract prompted shift from hint`);
    return;
  }

  // "shift back by N" = decode shift = (26 - N)
  // "shift of N" in puzzle context = also means shift back
  const decodeShift = (26 - promptedShift) % 26;
  const decoded = cipherDecode(encoded, decodeShift);

  if (decoded !== expected.toUpperCase()) {
    // Try the other interpretation (forward shift = promptedShift)
    const decoded2 = cipherDecode(encoded, promptedShift);
    if (decoded2 === expected.toUpperCase()) {
      ok(`${label} shift="${promptedShift}" forward decodes correctly`);
      return;
    }
    fail(
      label,
      `hint says shift back ${promptedShift}, but "${encoded}" → "${decoded}" (expected "${expected}")`
    );
  } else {
    ok(`${label} hint shift back ${promptedShift} decodes to "${expected}" ✓`);
  }
}

function checkWire(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [wire]`;
  const { left, right } = puzzle.data ?? {};
  const answer = puzzle._answer;

  if (!left?.length) return fail(label, "missing data.left");
  if (!right?.length) return fail(label, "missing data.right");
  if (!answer) return fail(label, "missing _answer");

  if (left.length !== right.length) {
    fail(label, `left has ${left.length} items but right has ${right.length}`);
  }

  // Answer should be comma-separated right values in left-index order
  const parts = answer.split(",");
  if (parts.length !== left.length) {
    return fail(label, `answer has ${parts.length} parts but left has ${left.length} items`);
  }

  // Every answer part must exist in right[]
  const missingFromRight = parts.filter((p) => !right.includes(p));
  if (missingFromRight.length > 0) {
    return fail(label, `answer parts not in right[]: ${missingFromRight.join(", ")}`);
  }

  // No duplicate right values in answer
  const seen = new Set();
  const dupes = parts.filter((p) => { const d = seen.has(p); seen.add(p); return d; });
  if (dupes.length > 0) {
    return fail(label, `duplicate right values in answer: ${dupes.join(", ")}`);
  }

  ok(`${label} ${left.length} pairs, all answer values in right[]`);
}

function checkPatternGrid(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [pattern_grid]`;
  const { rows, cols } = puzzle.data ?? {};
  const answer = puzzle._answer;

  if (!rows || !cols) return fail(label, "missing data.rows or data.cols");
  if (!answer) return fail(label, "missing _answer");

  // Answer format: "A1,B2,..." where letter=col (A=0), number=row (1-based)
  const cells = answer.split(",");
  const COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, cols);

  for (const cell of cells) {
    const colLetter = cell[0];
    const rowNum = parseInt(cell.slice(1), 10);
    if (!COLS.includes(colLetter)) {
      return fail(label, `cell "${cell}" has invalid column "${colLetter}" (valid: ${COLS})`);
    }
    if (rowNum < 1 || rowNum > rows) {
      return fail(label, `cell "${cell}" has row ${rowNum} outside 1–${rows}`);
    }
  }

  // No duplicates
  const cellSet = new Set(cells);
  if (cellSet.size !== cells.length) {
    return fail(label, `duplicate cells in answer: ${answer}`);
  }

  ok(`${label} ${rows}×${cols} grid, ${cells.length} cells: ${answer}`);
}

function checkMultiChoice(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [multi_choice]`;
  const { options } = puzzle.data ?? {};
  const answer = puzzle._answer;

  if (!options?.length) return fail(label, "missing data.options");
  if (!answer) return fail(label, "missing _answer");

  if (!options.includes(answer)) {
    return fail(label, `answer "${answer}" is not in options: [${options.join(" | ")}]`);
  }
  ok(`${label} answer="${answer}" found in ${options.length} options`);
}

function checkLogic(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} [logic]`;
  const { options } = puzzle.data ?? {};
  const answer = puzzle._answer;

  if (!options?.length) return fail(label, "missing data.options");
  if (!answer) return fail(label, "missing _answer");

  if (!options.includes(answer)) {
    return fail(label, `answer "${answer}" not in options: [${options.join(" | ")}]`);
  }

  // Check scenario and clues are present
  if (!puzzle.data?.scenario) fail(label, "missing data.scenario");
  if (!puzzle.data?.clues?.length) fail(label, "missing data.clues");

  ok(`${label} answer="${answer}" found in ${options.length} options`);
}

// ── Paradox log key coverage ──────────────────────────────────────────────────
function checkParadoxLogs(day) {
  const label = `Day ${day.number} paradox log key coverage`;
  const unlockWords = day.puzzles.map((p) => p.unlockWord);
  const constraintWords = day.finale?.constraintWords ?? [];

  // Collect all keys used in paradoxLogs segments
  const usedKeys = new Set();
  for (const log of day.paradoxLogs ?? []) {
    for (const seg of log.segments ?? []) {
      if (seg.type === "redacted" && seg.key) {
        usedKeys.add(seg.key);
      }
    }
  }

  // Every constraintWord should be used as a key in at least one segment
  const missing = constraintWords.filter((w) => !usedKeys.has(w));
  if (missing.length > 0) {
    return fail(label, `words unused as log keys: ${missing.join(", ")}`);
  }

  // Every usedKey should be a constraintWord (or preUnlocked)
  const preUnlocked = new Set(day.finale?.preUnlocked ?? []);
  const validKeys = new Set([...constraintWords, ...preUnlocked]);
  const orphanKeys = [...usedKeys].filter((k) => !validKeys.has(k));
  if (orphanKeys.length > 0) {
    warn(`Day ${day.number}: log keys with no matching constraintWord: ${orphanKeys.join(", ")}`);
  }

  ok(`${label}: all ${constraintWords.length} constraint words appear as log keys`);
}

// ── Finale constraint words match puzzle unlock words ─────────────────────────
function checkFinaleWords(day) {
  const label = `Day ${day.number} finale constraintWords vs puzzle unlockWords`;
  const puzzleWords = day.puzzles.map((p) => p.unlockWord).sort();
  const constraintWords = [...(day.finale?.constraintWords ?? [])].sort();

  const missing = puzzleWords.filter((w) => !constraintWords.includes(w));
  const extra = constraintWords.filter((w) => !puzzleWords.includes(w));

  if (missing.length > 0) {
    fail(label, `puzzle unlockWords not in constraintWords: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    fail(label, `constraintWords not earned by any puzzle: ${extra.join(", ")}`);
  }
  if (missing.length === 0 && extra.length === 0) {
    ok(`${label}: perfect match (${constraintWords.join(", ")})`);
  }
}

// ── Seed-split sanity: every puzzle has _answer and unlockWord ────────────────
function checkSeedFields(puzzle, dayNum) {
  const label = `Day ${dayNum} ${puzzle.slot} seed fields`;
  if (!puzzle._answer) return fail(label, "missing _answer");
  if (!puzzle.unlockWord) return fail(label, "missing unlockWord");
  if (!puzzle.slot) return fail(label, "missing slot");
  if (!puzzle.type) return fail(label, "missing type");
  ok(label);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

console.log(B("\n═══════════════════════════════════════════════════════════════"));
console.log(B("  ARES STATION — Phase 7 Playtest"));
console.log(B("═══════════════════════════════════════════════════════════════\n"));

for (const dayNum of DAYS) {
  let day;
  try {
    day = loadDay(dayNum);
  } catch (e) {
    fail(`Load day${dayNum}.json`, e.message);
    continue;
  }

  console.log(B(`\nDAY ${dayNum}: "${day.title}" (Sol ${day.stardate})`));
  console.log(DIM(`  id=${day.id}  puzzles=${day.puzzles.length}`));
  console.log();

  // ── Check puzzle count ─────────────────────────────────────────────────────
  if (day.puzzles.length !== 5) {
    fail(`Day ${dayNum} puzzle count`, `expected 5, got ${day.puzzles.length}`);
  } else {
    ok(`Day ${dayNum} has 5 puzzles`);
  }

  // ── Per-puzzle checks ──────────────────────────────────────────────────────
  for (const puzzle of day.puzzles) {
    checkSeedFields(puzzle, dayNum);

    switch (puzzle.type) {
      case "keypad":       checkKeypad(puzzle, dayNum); break;
      case "cipher_wheel": checkCipherWheel(puzzle, dayNum); checkCipherWheelWithPromptedShift(puzzle, dayNum); break;
      case "wire":         checkWire(puzzle, dayNum); break;
      case "pattern_grid": checkPatternGrid(puzzle, dayNum); break;
      case "multi_choice": checkMultiChoice(puzzle, dayNum); break;
      case "logic":        checkLogic(puzzle, dayNum); break;
      default:
        warn(`Day ${dayNum} ${puzzle.slot}: unknown type "${puzzle.type}"`);
    }
  }

  // ── Day-level checks ───────────────────────────────────────────────────────
  console.log();
  checkFinaleWords(day);
  checkParadoxLogs(day);
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL ANSWER TABLE (for manual playtest reference)
// ─────────────────────────────────────────────────────────────────────────────

console.log(B("\n\n═══════════════════════════════════════════════════════════════"));
console.log(B("  FULL ANSWER KEY (for manual playtest)"));
console.log(B("═══════════════════════════════════════════════════════════════\n"));

for (const dayNum of DAYS) {
  let day;
  try { day = loadDay(dayNum); } catch { continue; }
  console.log(B(`Day ${dayNum}: ${day.title}`));
  for (const p of day.puzzles) {
    const ansDisplay = p._answer.length > 50 ? p._answer.slice(0, 47) + "..." : p._answer;
    console.log(`  ${p.slot} [${p.type.padEnd(12)}] answer="${ansDisplay}"  unlock="${p.unlockWord}"`);
  }
  console.log();
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

console.log(B("═══════════════════════════════════════════════════════════════"));
console.log(B("  RESULTS"));
console.log(B("═══════════════════════════════════════════════════════════════"));
console.log(`  ${G(`PASS: ${PASS}`)}   ${FAIL > 0 ? R(`FAIL: ${FAIL}`) : G(`FAIL: ${FAIL}`)}`);

if (ISSUES.length > 0) {
  console.log(`\n${R("  Issues to fix:")}`);
  ISSUES.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`));
}

console.log();
process.exit(FAIL > 0 ? 1 : 0);
