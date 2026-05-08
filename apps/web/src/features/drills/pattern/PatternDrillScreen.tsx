/* ─────────────────────────────────────────────────────────────────────────────
   PatternDrillScreen — Pattern Recall round orchestrator.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../../app/Router";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillResults } from "../runner/DrillResults";
import { PatternPlay } from "./PatternPlay";
import {
  submitRound,
  type RoundResult,
} from "../../../shared/api/drills";
import styles from "./PatternDrillScreen.module.css";

const ROUND_DURATION_MS = 60_000;

type Phase = "ready" | "playing" | "finished";

export function PatternDrillScreen() {
  const { goBack, replace } = useRouter();

  const [phase, setPhase]           = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [result, setResult]         = useState<RoundResult | null>(null);
  const [submitErr, setSubmitErr]   = useState<string | null>(null);
  const [playKey, setPlayKey]       = useState(0);

  const handleBegin = useCallback(() => {
    haptic("impact", "medium");
    setPhase("playing");
  }, []);

  const handleComplete = useCallback((score: number) => {
    setFinalScore(score);
    setPhase("finished");
  }, []);

  useEffect(() => {
    if (phase !== "finished") return;
    let cancelled = false;
    submitRound("pattern", finalScore, ROUND_DURATION_MS)
      .then((r) => { if (!cancelled) setResult(r); })
      .catch((e) => { if (!cancelled) setSubmitErr(String(e)); });
    return () => { cancelled = true; };
  }, [phase, finalScore]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setSubmitErr(null);
    setFinalScore(0);
    setPlayKey((n) => n + 1);
    setPhase("ready");
  }, []);

  const handleExitToHub = useCallback(() => {
    replace({ name: "drills" });
  }, [replace]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (phase === "ready") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // PATTERN RECALL" />
        <div className={styles.ready}>
          <div className={styles.ready__title}>PATTERN RECALL</div>

          <div className={styles.ready__howto}>
            <div className={styles.ready__howto__heading}>HOW IT WORKS</div>
            <p className={styles.ready__howto__line}>
              CELLS LIGHT UP BRIEFLY.
            </p>
            <p className={styles.ready__howto__line}>
              MEMORIZE THEIR POSITIONS.
            </p>
            <p className={styles.ready__howto__line}>
              TAP THE CORRECT CELLS WHEN PROMPTED.
            </p>
          </div>

          <div className={styles.ready__example}>
            <div className={styles.ready__example__label}>EXAMPLE — 3 CELLS LIT</div>
            <div className={styles.ready__example__grid}>
              {[0,1,2,3,4,5,6,7,8].map((i) => {
                // demo lit pattern: indices 0, 4, 8 (diagonal)
                const lit = i === 0 || i === 4 || i === 8;
                return (
                  <div
                    key={i}
                    className={`${styles.ready__example__cell} ${lit ? styles["ready__example__cell--lit"] : ""}`}
                  />
                );
              })}
            </div>
            <div className={styles.ready__example__caption}>
              MEMORIZE → CELLS DARK → TAP THE SAME 3
            </div>
          </div>

          <div className={styles.ready__meta}>
            60 SECONDS · GRID GROWS WITH SCORE · SKIP IS FREE
          </div>

          <button className={styles.ready__begin} onClick={handleBegin}>
            BEGIN
          </button>
          <button className={styles.ready__back} onClick={goBack}>
            BACK
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // PATTERN RECALL" />
        <DrillResults
          drillType="pattern"
          score={finalScore}
          result={result}
          error={submitErr}
          onPlayAgain={handlePlayAgain}
          onBack={handleExitToHub}
        />
      </div>
    );
  }

  // phase === "playing"
  return (
    <div className={styles.screen}>
      <Classification level="standard" label="OPERATOR DRILLS // PATTERN RECALL" />
      <PatternPlay
        key={playKey}
        durationMs={ROUND_DURATION_MS}
        onComplete={handleComplete}
        onExit={handleExitToHub}
      />
    </div>
  );
}
