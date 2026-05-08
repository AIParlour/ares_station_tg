/* ─────────────────────────────────────────────────────────────────────────────
   CipherPlay — playing-phase only, reusable across standalone & workout flows.
   Owns score/streak/key/puzzle state and the DrillRunner+CipherRound layout.
   Hands the final score back to the parent on timer expiry.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillRunner } from "../runner/DrillRunner";
import { CipherRound } from "./CipherRound";
import {
  generateKey,
  generateCipherPuzzle,
  type CipherPuzzle,
  type SubCipherKey,
} from "./cipherGen";

interface CipherPlayProps {
  durationMs: number;
  onComplete: (score: number) => void;
  onExit:     () => void;
}

export function CipherPlay({ durationMs, onComplete, onExit }: CipherPlayProps) {
  const [cipherKey] = useState<SubCipherKey>(() => generateKey());
  const [score,  setScore]  = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<CipherPuzzle>(() =>
    generateCipherPuzzle(0, cipherKey)
  );

  const handleCorrect = useCallback(() => {
    setScore((s) => {
      const next = s + 1;
      setPuzzle(generateCipherPuzzle(next, cipherKey));
      return next;
    });
    setStreak((k) => k + 1);
  }, [cipherKey]);

  const handleSkip = useCallback(() => {
    haptic("selection");
    setPuzzle(generateCipherPuzzle(score, cipherKey));
    setStreak(0);
  }, [score, cipherKey]);

  const handleExpire = useCallback(() => {
    haptic("notification", "warning");
    onComplete(score);
  }, [score, onComplete]);

  return (
    <DrillRunner
      drillType="cipher"
      durationMs={durationMs}
      score={score}
      streak={streak}
      onExpire={handleExpire}
      onExit={onExit}
    >
      <CipherRound
        puzzle={puzzle}
        cipherKey={cipherKey}
        onCorrect={handleCorrect}
        onSkip={handleSkip}
      />
    </DrillRunner>
  );
}
