/* ─────────────────────────────────────────────────────────────────────────────
   PatternRound — single Pattern Recall puzzle.

   Internal lifecycle:
     "memorize" — cells lit; countdown bar; auto-advances after revealMs.
     "recall"   — cells dark; player taps cells. Auto-checks when picks ===
                  litCells count.
     "done"     — outcome shown briefly:
                    correct → green flash → onCorrect()
                    wrong   → reveal correct pattern in red → onSkip()

   Skip from the player is also routed through onSkip (no pattern reveal).
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { patternsMatch, type PatternPuzzle } from "./patternGen";
import styles from "./PatternRound.module.css";

type SubPhase = "memorize" | "recall" | "done";
type Outcome  = "none" | "correct" | "wrong";

interface PatternRoundProps {
  puzzle:    PatternPuzzle;
  onCorrect: () => void;
  onSkip:    () => void;
  frozen?:   boolean;
}

export function PatternRound({ puzzle, onCorrect, onSkip, frozen }: PatternRoundProps) {
  const [subPhase, setSubPhase] = useState<SubPhase>("memorize");
  const [picked, setPicked]     = useState<Set<number>>(() => new Set());
  const [outcome, setOutcome]   = useState<Outcome>("none");

  // Track outstanding timeouts so a new puzzle (mid-flight) doesn't fire stale
  // callbacks against the next one.
  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  /* Reset on new puzzle */
  useEffect(() => {
    clearTimers();
    setSubPhase("memorize");
    setPicked(new Set());
    setOutcome("none");

    const t = window.setTimeout(() => setSubPhase("recall"), puzzle.revealMs);
    timersRef.current.push(t);
    return clearTimers;
  }, [puzzle]);

  const handleTap = (idx: number) => {
    if (frozen || subPhase !== "recall") return;

    haptic("selection");
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else                next.add(idx);

      // Auto-check when count matches target.
      if (next.size === puzzle.litCells.length) {
        const correct = patternsMatch(next, puzzle.litCells);
        if (correct) {
          haptic("notification", "success");
          setOutcome("correct");
          setSubPhase("done");
          const t = window.setTimeout(() => onCorrect(), 360);
          timersRef.current.push(t);
        } else {
          haptic("notification", "error");
          setOutcome("wrong");
          setSubPhase("done");
          // Reveal the correct pattern briefly so the player learns from it.
          const t = window.setTimeout(() => onSkip(), 900);
          timersRef.current.push(t);
        }
      }
      return next;
    });
  };

  const handleSkip = () => {
    if (subPhase === "done") return;
    clearTimers();
    onSkip();
  };

  const total = puzzle.gridSize * puzzle.gridSize;

  /* ── Header text ─────────────────────────────────────────────────────────── */
  let headLabel: React.ReactNode;
  let headClass = styles.head;
  if (subPhase === "memorize") {
    headLabel = "MEMORIZE THE PATTERN";
  } else if (subPhase === "recall") {
    const remaining = puzzle.litCells.length - picked.size;
    headLabel = `RECALL · ${remaining} REMAINING`;
  } else if (outcome === "correct") {
    headLabel = "PATTERN MATCHED";
    headClass = `${styles.head} ${styles["head--correct"]}`;
  } else {
    headLabel = "PATTERN MISSED";
    headClass = `${styles.head} ${styles["head--wrong"]}`;
  }

  return (
    <div className={styles.round}>
      <div className={headClass}>{headLabel}</div>

      {/* Countdown bar (memorize only) */}
      {subPhase === "memorize" && (
        <div className={styles.countdown}>
          <div
            className={styles.countdown__fill}
            style={{ animationDuration: `${puzzle.revealMs}ms` }}
          />
        </div>
      )}

      <div className={`${styles.grid} ${styles[`grid--${puzzle.gridSize}`]}`}>
        {Array.from({ length: total }, (_, i) => {
          const isLit         = puzzle.litCells.includes(i);
          const isPicked      = picked.has(i);
          const showLit       = isLit && (
                                  subPhase === "memorize"
                                  || (subPhase === "done" && outcome === "wrong")
                                );
          const showPicked    = subPhase === "recall" && isPicked;
          const showCorrect   = subPhase === "done" && outcome === "correct" && isLit;
          const showWrongPick = subPhase === "done" && outcome === "wrong" && isPicked && !isLit;

          const cellCls =
            styles.cell
            + (showLit       ? ` ${styles["cell--lit"]}`        : "")
            + (showPicked    ? ` ${styles["cell--picked"]}`     : "")
            + (showCorrect   ? ` ${styles["cell--correct"]}`    : "")
            + (showWrongPick ? ` ${styles["cell--wrongPick"]}`  : "");

          return (
            <button
              key={i}
              className={cellCls}
              onClick={() => handleTap(i)}
              disabled={!!frozen || subPhase !== "recall"}
              aria-label={`Cell ${i + 1}`}
            />
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.skip}
          onClick={handleSkip}
          disabled={!!frozen || subPhase === "done"}
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
