/* ─────────────────────────────────────────────────────────────────────────────
   DriftPlay — playing-phase only, reusable across standalone & workout flows.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillRunner } from "../runner/DrillRunner";
import { DriftRound } from "./DriftRound";
import { generateDriftPuzzle, type DriftPuzzle } from "./driftGen";

interface DriftPlayProps {
  durationMs: number;
  onComplete: (score: number) => void;
  onExit:     () => void;
}

export function DriftPlay({ durationMs, onComplete, onExit }: DriftPlayProps) {
  const [score,  setScore]  = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<DriftPuzzle>(() => generateDriftPuzzle(0));

  const handleCorrect = useCallback(() => {
    setScore((s) => {
      const next = s + 1;
      setPuzzle(generateDriftPuzzle(next));
      return next;
    });
    setStreak((k) => k + 1);
  }, []);

  const handleSkip = useCallback(() => {
    haptic("selection");
    setPuzzle(generateDriftPuzzle(score));
    setStreak(0);
  }, [score]);

  const handleExpire = useCallback(() => {
    haptic("notification", "warning");
    onComplete(score);
  }, [score, onComplete]);

  return (
    <DrillRunner
      drillType="drift"
      durationMs={durationMs}
      score={score}
      streak={streak}
      onExpire={handleExpire}
      onExit={onExit}
    >
      <DriftRound
        puzzle={puzzle}
        onCorrect={handleCorrect}
        onSkip={handleSkip}
      />
    </DrillRunner>
  );
}
