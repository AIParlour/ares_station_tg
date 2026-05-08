/* ─────────────────────────────────────────────────────────────────────────────
   SensorPlay — playing-phase only, reusable across standalone & workout flows.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillRunner } from "../runner/DrillRunner";
import { SensorRound } from "./SensorRound";
import { generateSensorPuzzle, type SensorPuzzle } from "./sensorGen";

interface SensorPlayProps {
  durationMs: number;
  onComplete: (score: number) => void;
  onExit:     () => void;
}

export function SensorPlay({ durationMs, onComplete, onExit }: SensorPlayProps) {
  const [score,  setScore]  = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<SensorPuzzle>(() => generateSensorPuzzle(0));

  const handleCorrect = useCallback(() => {
    setScore((s) => {
      const next = s + 1;
      setPuzzle(generateSensorPuzzle(next));
      return next;
    });
    setStreak((k) => k + 1);
  }, []);

  const handleSkip = useCallback(() => {
    haptic("selection");
    setPuzzle(generateSensorPuzzle(score));
    setStreak(0);
  }, [score]);

  const handleExpire = useCallback(() => {
    haptic("notification", "warning");
    onComplete(score);
  }, [score, onComplete]);

  return (
    <DrillRunner
      drillType="sensor"
      durationMs={durationMs}
      score={score}
      streak={streak}
      onExpire={handleExpire}
      onExit={onExit}
    >
      <SensorRound
        puzzle={puzzle}
        onCorrect={handleCorrect}
        onSkip={handleSkip}
      />
    </DrillRunner>
  );
}
