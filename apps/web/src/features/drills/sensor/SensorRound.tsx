/* ─────────────────────────────────────────────────────────────────────────────
   SensorRound — single Sensor Sweep puzzle.

   The player sees a metric label, a nominal range, and a grid of readings.
   Tapping the falsified reading scores; tapping any other shakes the wrong
   card and registers an error haptic.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { formatNominal, type SensorPuzzle } from "./sensorGen";
import styles from "./SensorRound.module.css";

interface SensorRoundProps {
  puzzle:    SensorPuzzle;
  onCorrect: () => void;
  onSkip:    () => void;
  frozen?:   boolean;
}

export function SensorRound({ puzzle, onCorrect, onSkip, frozen }: SensorRoundProps) {
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);

  /* Reset feedback on each new puzzle */
  useEffect(() => {
    setWrongIdx(null);
    setCorrectIdx(null);
  }, [puzzle]);

  const handleTap = (idx: number) => {
    if (frozen || correctIdx !== null) return;
    if (puzzle.readings[idx].isFalsified) {
      haptic("notification", "success");
      setCorrectIdx(idx);
      window.setTimeout(() => onCorrect(), 140);
    } else {
      haptic("notification", "error");
      setWrongIdx(idx);
      window.setTimeout(() => setWrongIdx(null), 280);
    }
  };

  return (
    <div className={styles.round}>
      <div className={styles.head}>
        <div className={styles.head__metric}>{puzzle.metric}</div>
        <div className={styles.head__range}>
          NOMINAL · {formatNominal(puzzle)}
        </div>
        <div className={styles.head__instruction}>
          TAP THE FALSIFIED READING
        </div>
      </div>

      <div
        className={styles.grid}
        data-count={puzzle.readings.length}
      >
        {puzzle.readings.map((r, i) => {
          const isWrong   = wrongIdx === i;
          const isCorrect = correctIdx === i;
          return (
            <button
              key={r.id}
              className={`${styles.cell} ${isWrong ? styles["cell--wrong"] : ""} ${isCorrect ? styles["cell--correct"] : ""}`}
              onClick={() => handleTap(i)}
              disabled={!!frozen}
              aria-label={`${r.id}, value ${r.display} ${puzzle.unit}`}
            >
              <div className={styles.cell__id}>{r.id}</div>
              <div className={styles.cell__value}>{r.display}</div>
              <div className={styles.cell__unit}>{puzzle.unit}</div>
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
