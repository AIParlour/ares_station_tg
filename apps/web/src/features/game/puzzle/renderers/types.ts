/* ─────────────────────────────────────────────────────────────────────────────
   Shared types for all puzzle renderers.
   ───────────────────────────────────────────────────────────────────────────── */

export type PuzzleFeedback = "idle" | "checking" | "wrong" | "correct";

/** Props every puzzle renderer receives */
export interface PuzzleRendererProps {
  /** The puzzle prompt text */
  prompt: string;
  /** Type-specific data from the puzzle JSON */
  data: unknown;
  /** Whether the puzzle was already solved */
  alreadySolved: boolean;
  /** Current feedback state */
  feedback: PuzzleFeedback;
  /** Error/hint message on wrong answer */
  errorMsg: string;
  /** Call with the player's answer to submit */
  onSubmit: (answer: string) => void;
}
