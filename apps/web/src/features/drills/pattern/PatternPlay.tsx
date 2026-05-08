/* ─────────────────────────────────────────────────────────────────────────────
   PatternPlay — playing-phase only, reusable across standalone & workout flows.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillRunner } from "../runner/DrillRunner";
import { PatternRound } from "./PatternRound";
import { generatePatternPuzzle, type PatternPuzzle } from "./patternGen";

interface PatternPlayProps {
  durationMs: number;
  onComplete: (score: number) => void;
  onExit:     () => void;
}

export function PatternPlay({ durationMs, onComplete, onExit }: PatternPlayProps) {
  const [score,  setScore]  = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<PatternPuzzle>(() => generatePatternPuzzle(0));

  const handleCorrect = useCallback(() => {
    setScore((s) => {
      const next = s + 1;
      setPuzzle(generatePatternPuzzle(next));
      return next;
    });
    setStreak((k) => k + 1);
  }, []);

  const handleSkip = useCallback(() => {
    setPuzzle(generatePatternPuzzle(score));
    setStreak(0);
  }, [score]);

  const handleExpire = useCallback(() => {
    haptic("notification", "warning");
    onComplete(score);
  }, [score, onComplete]);

  return (
    <DrillRunner
      drillType="pattern"
      durationMs={durationMs}
      score={score}
      streak={streak}
      onExpire={handleExpire}
      onExit={onExit}
    >
      <PatternRound
        puzzle={puzzle}
        onCorrect={handleCorrect}
        onSkip={handleSkip}
      />
    </DrillRunner>
  );
}
