/* ─────────────────────────────────────────────────────────────────────────────
   Pattern Recall generator — memory drill.

   Mechanic
   --------
   The player sees a grid with N cells lit for `revealMs` milliseconds, then
   the cells go dark. The player must tap the cells that were lit.
   Auto-checks when the player has tapped exactly N cells.

   Difficulty index N drives:
     - grid size  (3×3 → 4×4)
     - lit count  (3 → 6)
     - reveal time (1500ms → 1100ms)
   ───────────────────────────────────────────────────────────────────────────── */

export interface PatternPuzzle {
  gridSize: number;     // 3 or 4
  litCells: number[];   // sorted indices (row-major) of cells that were lit
  revealMs: number;     // how long the pattern is shown
}

interface DifficultyParams {
  gridSize:  number;
  litCount:  number;
  revealMs:  number;
}

function paramsFor(difficulty: number): DifficultyParams {
  if (difficulty < 3)  return { gridSize: 3, litCount: 3, revealMs: 1500 };
  if (difficulty < 7)  return { gridSize: 3, litCount: 4, revealMs: 1400 };
  if (difficulty < 11) return { gridSize: 4, litCount: 4, revealMs: 1300 };
  if (difficulty < 16) return { gridSize: 4, litCount: 5, revealMs: 1200 };
  return                       { gridSize: 4, litCount: 6, revealMs: 1100 };
}

export function generatePatternPuzzle(difficulty: number): PatternPuzzle {
  const { gridSize, litCount, revealMs } = paramsFor(difficulty);
  const total = gridSize * gridSize;

  // Fisher–Yates shuffle to pick `litCount` distinct indices.
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const litCells = indices.slice(0, litCount).sort((a, b) => a - b);

  return { gridSize, litCells, revealMs };
}

/** Returns true if the two cell-lists are equal as sets (order-independent). */
export function patternsMatch(picked: Iterable<number>, target: number[]): boolean {
  const a = new Set(picked);
  if (a.size !== target.length) return false;
  for (const v of target) if (!a.has(v)) return false;
  return true;
}
