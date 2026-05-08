/* ─────────────────────────────────────────────────────────────────────────────
   Telemetry Drift generator — analytical drill (number sequences).

   Mechanic
   --------
   The player sees a numeric sequence with one slot missing (always the last
   slot in v1). They pick the correct next value from 4 multiple-choice
   options.

   Sequence kinds:
     - arithmetic      a, a+d, a+2d, ...
     - geometric       a, a*r, a*r^2, ...     r ∈ {2, 3}
     - alternating     two interleaved arithmetic sequences

   Difficulty index N drives:
     - which kinds are eligible
     - sequence length (5 → 6)
     - magnitude of differences / starting values
   ───────────────────────────────────────────────────────────────────────────── */

type SequenceKind = "arith" | "geom" | "alt";

export interface DriftPuzzle {
  /** Sequence with the missing slot represented as null. */
  sequence:     (number | null)[];
  /** Index into `sequence` of the null slot. */
  missingIndex: number;
  /** Correct value for the missing slot. */
  answer:       number;
  /** Four multiple-choice options. Includes `answer`. */
  choices:      number[];
  /** Internal label — not shown to player; useful for telemetry/debugging. */
  kind:         SequenceKind;
}

interface DifficultyParams {
  kinds:  SequenceKind[];
  length: number;
}

function paramsFor(difficulty: number): DifficultyParams {
  if (difficulty < 4)  return { kinds: ["arith"],                    length: 5 };
  if (difficulty < 8)  return { kinds: ["arith", "geom"],            length: 5 };
  if (difficulty < 12) return { kinds: ["arith", "geom", "alt"],     length: 5 };
  return                       { kinds: ["arith", "geom", "alt"],     length: 6 };
}

/* ── Sequence builders ─────────────────────────────────────────────────────── */

function buildArithmetic(length: number, difficulty: number): number[] {
  const a = 1 + Math.floor(Math.random() * 12);
  const dRange = difficulty < 4 ? 5 : difficulty < 8 ? 8 : 12;
  // Difference can be negative for harder difficulty (occasionally).
  const allowNeg = difficulty >= 8 && Math.random() < 0.25;
  let d = 1 + Math.floor(Math.random() * dRange);
  if (allowNeg) d = -d;

  // Make sure no value goes negative (looks weird in a "telemetry" drill).
  // If it would, retry with positive d.
  const seq: number[] = [];
  for (let i = 0; i < length; i++) seq.push(a + i * d);
  if (seq.some((v) => v < 0)) {
    return buildArithmetic(length, Math.max(0, difficulty - 8));
  }
  return seq;
}

function buildGeometric(length: number): number[] {
  const ratio = Math.random() < 0.7 ? 2 : 3;
  // Keep starting value small so the last term doesn't blow up.
  const cap   = ratio === 2 ? 6 : 4;
  const a     = 1 + Math.floor(Math.random() * cap);
  const seq: number[] = [];
  for (let i = 0; i < length; i++) seq.push(a * Math.pow(ratio, i));
  return seq;
}

function buildAlternating(length: number): number[] {
  // Two interleaved arithmetic sequences.
  const aA = 1 + Math.floor(Math.random() * 10);
  const aB = 10 + Math.floor(Math.random() * 15);
  const dA = 1 + Math.floor(Math.random() * 4);
  const dB = 1 + Math.floor(Math.random() * 4);
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(i % 2 === 0 ? aA + Math.floor(i / 2) * dA : aB + Math.floor(i / 2) * dB);
  }
  return seq;
}

/* ── Distractors ───────────────────────────────────────────────────────────── */

function buildChoices(answer: number): number[] {
  const set = new Set<number>([answer]);
  const magnitude = Math.max(2, Math.abs(answer));
  // Tightness scales with magnitude — small answers get small offsets, big
  // answers get bigger ones (so distractors stay plausible).
  const maxOffset = Math.min(20, Math.max(3, Math.floor(magnitude * 0.25)));

  let safety = 50;
  while (set.size < 4 && safety-- > 0) {
    const sign   = Math.random() < 0.5 ? -1 : 1;
    const offset = sign * (1 + Math.floor(Math.random() * maxOffset));
    const cand   = answer + offset;
    if (cand >= 0 && !set.has(cand)) set.add(cand);
  }

  // Pathological fallback (only triggers if the loop somehow fails).
  while (set.size < 4) set.add(answer + set.size * 7);

  const arr = Array.from(set);
  // Fisher–Yates shuffle so the answer position is unpredictable.
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Public API ────────────────────────────────────────────────────────────── */

export function generateDriftPuzzle(difficulty: number): DriftPuzzle {
  const { kinds, length } = paramsFor(difficulty);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];

  let raw: number[];
  switch (kind) {
    case "arith": raw = buildArithmetic(length, difficulty); break;
    case "geom":  raw = buildGeometric(length);  break;
    case "alt":   raw = buildAlternating(length); break;
  }

  // Always hide the last value in v1 — easiest to read the sequence.
  const missingIndex = raw.length - 1;
  const answer       = raw[missingIndex];

  const sequence: (number | null)[] = raw.slice();
  sequence[missingIndex] = null;

  return {
    sequence,
    missingIndex,
    answer,
    choices: buildChoices(answer),
    kind,
  };
}
