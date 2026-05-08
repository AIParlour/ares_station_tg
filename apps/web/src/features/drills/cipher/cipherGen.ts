/* ─────────────────────────────────────────────────────────────────────────────
   Cipher generator — substitution cipher with visible key.

   Mechanic
   ---------
   Each round generates ONE 26-letter substitution key (a permutation of A–Z
   with no fixed points). The key is displayed during play. Each puzzle picks
   a fresh plaintext word and shows its ciphertext; the player decodes by
   looking up letters in the visible key.

   Per-round (not per-puzzle) key is intentional: the player benefits from
   memorizing the key as the round progresses, which rewards practice.

   Difficulty index N (0-based) drives word length / bank only — the key is
   always fully visible in v1.
   ───────────────────────────────────────────────────────────────────────────── */

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ── Word banks ─────────────────────────────────────────────────────────────── */

const WORD_BANK_SHORT = [
  "ARES", "MARS", "DUST", "VENT", "LOCK", "DOOR", "ROOM", "CORE",
  "SCAN", "CODE", "FILE", "DATA", "PIPE", "WIRE", "FUEL", "TANK",
  "PUMP", "BEAM", "GAS",  "OXY",  "HULL", "CREW", "DOCK", "BAY",
  "RING", "DISK", "DRIVE","KEY",  "LOG",  "MAP",  "FAN",  "HEAT",
] as const;

const WORD_BANK_MID = [
  "OXYGEN",  "REACTOR", "AIRLOCK", "MEDBAY",  "RECYCLE", "STATION",
  "ORBITAL", "TRAJECT", "BEACON",  "CONSOLE", "OPERATOR","COMMAND",
  "PROTOCOL","INTEGRITY","CHANNEL", "DECRYPT", "TELEMETRY","SENSOR",
  "PARADOX", "HELIOS",  "DOSSIER", "SECTOR",  "BREACH",  "OVERRIDE",
] as const;

const WORD_BANK_LONG = [
  "CALIBRATION", "RESPIRATION", "ATMOSPHERIC", "EXPEDITION",
  "QUARANTINE",  "EMERGENCY",   "TRANSMITTER", "DECOMPRESS",
  "SUBSURFACE",  "EXOPLANET",   "AUTHORIZED",  "REDUNDANCY",
  "MANIFEST",    "CRYOGENIC",   "TRAJECTORY",  "OBSERVATORY",
] as const;

/* ── Public types ───────────────────────────────────────────────────────────── */

export interface SubCipherKey {
  /** plain → cipher map (forward.A === ciphertext for plain 'A'). */
  forward: Record<string, string>;
  /** cipher → plain map (the inverse — what the player computes mentally). */
  inverse: Record<string, string>;
}

export interface CipherPuzzle {
  /** The original (correct) word, uppercase A–Z. */
  plaintext:  string;
  /** The encoded word the user sees. */
  ciphertext: string;
}

/* ── Key generation ─────────────────────────────────────────────────────────── */

/**
 * Generate a substitution key with no fixed points (no letter maps to itself).
 * Re-rolls until the constraint is satisfied — almost always 1 attempt.
 */
export function generateKey(): SubCipherKey {
  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = ALPHA.split("");
    // Fisher–Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Reject if any fixed point (player would think the puzzle is broken).
    let valid = true;
    for (let i = 0; i < shuffled.length; i++) {
      if (shuffled[i] === ALPHA[i]) { valid = false; break; }
    }
    if (!valid) continue;

    const forward: Record<string, string> = {};
    const inverse: Record<string, string> = {};
    for (let i = 0; i < ALPHA.length; i++) {
      forward[ALPHA[i]]   = shuffled[i];
      inverse[shuffled[i]] = ALPHA[i];
    }
    return { forward, inverse };
  }

  // Pathological fallback (should never happen): plain reverse alphabet.
  // Reverse maps Z→A, Y→B, ... has zero fixed points by construction.
  const forward: Record<string, string> = {};
  const inverse: Record<string, string> = {};
  for (let i = 0; i < ALPHA.length; i++) {
    const enc = ALPHA[ALPHA.length - 1 - i];
    forward[ALPHA[i]] = enc;
    inverse[enc]      = ALPHA[i];
  }
  return { forward, inverse };
}

/* ── Difficulty curve ──────────────────────────────────────────────────────── */

function pickWordBank(difficulty: number): readonly string[] {
  if (difficulty < 4)  return WORD_BANK_SHORT;
  if (difficulty < 8)  return [...WORD_BANK_SHORT, ...WORD_BANK_MID];
  if (difficulty < 14) return [...WORD_BANK_MID, ...WORD_BANK_LONG];
  return [...WORD_BANK_MID, ...WORD_BANK_LONG];
}

/* ── Puzzle generation ─────────────────────────────────────────────────────── */

/** Apply a substitution key to a plaintext word. */
export function encode(word: string, key: SubCipherKey): string {
  let out = "";
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    out += key.forward[c] ?? c;
  }
  return out;
}

/**
 * Generate a fresh puzzle at the given difficulty using the supplied key.
 * Each call is non-deterministic — players see new words each round.
 */
export function generateCipherPuzzle(difficulty: number, key: SubCipherKey): CipherPuzzle {
  const bank      = pickWordBank(difficulty);
  const plaintext = bank[Math.floor(Math.random() * bank.length)];
  return {
    plaintext,
    ciphertext: encode(plaintext, key),
  };
}

/** Normalize a user's answer for comparison: trim, uppercase, strip whitespace. */
export function normalizeAnswer(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Return all unique cipher letters that appear in `ciphertext` (for highlighting). */
export function uniqueCipherLetters(ciphertext: string): string[] {
  const seen = new Set<string>();
  for (let i = 0; i < ciphertext.length; i++) {
    const c = ciphertext[i];
    if (c >= "A" && c <= "Z") seen.add(c);
  }
  return Array.from(seen);
}
