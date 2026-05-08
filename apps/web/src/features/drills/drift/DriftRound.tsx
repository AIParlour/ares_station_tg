/* ─────────────────────────────────────────────────────────────────────────────
   DriftRound — single Telemetry Drift puzzle.

   Player sees a number sequence with a "?" slot and four choice buttons.
   Tapping the right one scores; tapping a wrong one shakes that button and
   registers an error haptic.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import type { DriftPuzzle } from "./driftGen";
import styles from "./DriftRound.module.css";

interface DriftRoundProps {
  puzzle:    DriftPuzzle;
  onCorrect: () => void;
  onSkip:    () => void;
  frozen?:   boolean;
}

export function DriftRound({ puzzle, onCorrect, onSkip, frozen }: DriftRoundProps) {
  const [wrongIdx, setWrongIdx]     = useState<number | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);

  useEffect(() => {
    setWrongIdx(null);
    setCorrectIdx(null);
  }, [puzzle]);

  const handlePick = (idx: number) => {
    if (frozen || correctIdx !== null) return;
    const value = puzzle.choices[idx];
    if (value === puzzle.answer) {
      haptic("notification", "success");
      setCorrectIdx(idx);
      window.setTimeout(() => onCorrect(), 200);
    } else {
      haptic("notification", "error");
      setWrongIdx(idx);
      window.setTimeout(() => setWrongIdx(null), 280);
    }
  };

  return (
    <div className={styles.round}>
      <div className={styles.head}>
        <div className={styles.head__metric}>TELEMETRY STREAM</div>
        <div className={styles.head__instruction}>
          PREDICT THE MISSING VALUE
        </div>
      </div>

      <div className={styles.sequence}>
        {puzzle.sequence.map((v, i) => {
          const isMissing = v === null;
          return (
            <span
              key={i}
              className={`${styles.sequence__item} ${isMissing ? styles["sequence__item--missing"] : ""}`}
            >
              {isMissing ? "?" : v}
            </span>
          );
        })}
      </div>

      <div className={styles.choices}>
        {puzzle.choices.map((c, i) => {
          const isWrong   = wrongIdx === i;
          const isCorrect = correctIdx === i;
          return (
            <button
              key={i}
              className={`${styles.choice} ${isWrong ? styles["choice--wrong"] : ""} ${isCorrect ? styles["choice--correct"] : ""}`}
              onClick={() => handlePick(i)}
              disabled={!!frozen}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.skip}
          onClick={onSkip}
          disabled={!!frozen || correctIdx !== null}
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
