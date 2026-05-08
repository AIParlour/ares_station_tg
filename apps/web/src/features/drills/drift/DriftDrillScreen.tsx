/* ─────────────────────────────────────────────────────────────────────────────
   DriftDrillScreen — Telemetry Drift round orchestrator.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../../app/Router";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillResults } from "../runner/DrillResults";
import { DriftPlay } from "./DriftPlay";
import {
  submitRound,
  type RoundResult,
} from "../../../shared/api/drills";
import styles from "./DriftDrillScreen.module.css";

const ROUND_DURATION_MS = 60_000;

type Phase = "ready" | "playing" | "finished";

export function DriftDrillScreen() {
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
    submitRound("drift", finalScore, ROUND_DURATION_MS)
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
        <Classification level="standard" label="OPERATOR DRILLS // TELEMETRY DRIFT" />
        <div className={styles.ready}>
          <div className={styles.ready__title}>TELEMETRY DRIFT</div>

          <div className={styles.ready__howto}>
            <div className={styles.ready__howto__heading}>HOW IT WORKS</div>
            <p className={styles.ready__howto__line}>
              SCAN THE TELEMETRY SEQUENCE.
            </p>
            <p className={styles.ready__howto__line}>
              ONE VALUE IS MISSING.
            </p>
            <p className={styles.ready__howto__line}>
              PICK THE NEXT VALUE FROM THE OPTIONS.
            </p>
          </div>

          <div className={styles.ready__example}>
            <div className={styles.ready__example__label}>EXAMPLE</div>
            <div className={styles.ready__example__seq}>
              <span>2</span><span>5</span><span>8</span><span>11</span>
              <span className={styles["ready__example__seq--missing"]}>?</span>
            </div>
            <div className={styles.ready__example__choices}>
              <span className={styles.ready__example__choice}>13</span>
              <span className={`${styles.ready__example__choice} ${styles["ready__example__choice--correct"]}`}>14</span>
              <span className={styles.ready__example__choice}>16</span>
              <span className={styles.ready__example__choice}>20</span>
            </div>
            <div className={styles.ready__example__caption}>
              +3 EACH STEP → 14
            </div>
          </div>

          <div className={styles.ready__meta}>
            60 SECONDS · PATTERNS GROW HARDER · SKIP IS FREE
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
        <Classification level="standard" label="OPERATOR DRILLS // TELEMETRY DRIFT" />
        <DrillResults
          drillType="drift"
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
      <Classification level="standard" label="OPERATOR DRILLS // TELEMETRY DRIFT" />
      <DriftPlay
        key={playKey}
        durationMs={ROUND_DURATION_MS}
        onComplete={handleComplete}
        onExit={handleExitToHub}
      />
    </div>
  );
}
