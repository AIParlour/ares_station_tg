/* ─────────────────────────────────────────────────────────────────────────────
   SensorDrillScreen — Sensor Sweep round orchestrator.
   Mirrors CipherDrillScreen's lifecycle (ready → playing → finished).
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../../app/Router";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillResults } from "../runner/DrillResults";
import { SensorPlay } from "./SensorPlay";
import {
  submitRound,
  type RoundResult,
} from "../../../shared/api/drills";
import styles from "./SensorDrillScreen.module.css";

const ROUND_DURATION_MS = 60_000;

type Phase = "ready" | "playing" | "finished";

export function SensorDrillScreen() {
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
    submitRound("sensor", finalScore, ROUND_DURATION_MS)
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
        <Classification level="standard" label="OPERATOR DRILLS // SENSOR SWEEP" />
        <div className={styles.ready}>
          <div className={styles.ready__title}>SENSOR SWEEP</div>

          <div className={styles.ready__howto}>
            <div className={styles.ready__howto__heading}>HOW IT WORKS</div>
            <p className={styles.ready__howto__line}>
              SCAN THE SENSOR ARRAY.
            </p>
            <p className={styles.ready__howto__line}>
              ONE READING IS OUTSIDE NOMINAL.
            </p>
            <p className={styles.ready__howto__line}>
              TAP THE FALSIFIED CARD.
            </p>
          </div>

          <div className={styles.ready__example}>
            <div className={styles.ready__example__label}>NOMINAL · 23.0 – 27.0 °C</div>
            <div className={styles.ready__example__grid}>
              <div className={styles.ready__example__cell}>
                <div className={styles.ready__example__id}>S-01</div>
                <div className={styles.ready__example__value}>25.4</div>
              </div>
              <div className={styles.ready__example__cell}>
                <div className={styles.ready__example__id}>S-02</div>
                <div className={styles.ready__example__value}>26.1</div>
              </div>
              <div className={`${styles.ready__example__cell} ${styles["ready__example__cell--bad"]}`}>
                <div className={styles.ready__example__id}>S-03</div>
                <div className={styles.ready__example__value}>29.8</div>
              </div>
              <div className={styles.ready__example__cell}>
                <div className={styles.ready__example__id}>S-04</div>
                <div className={styles.ready__example__value}>24.0</div>
              </div>
            </div>
            <div className={styles.ready__example__caption}>
              S-03 IS OUT OF RANGE → TAP IT
            </div>
          </div>

          <div className={styles.ready__meta}>
            60 SECONDS · GAPS TIGHTEN AS YOU SCORE · SKIP IS FREE
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
        <Classification level="standard" label="OPERATOR DRILLS // SENSOR SWEEP" />
        <DrillResults
          drillType="sensor"
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
      <Classification level="standard" label="OPERATOR DRILLS // SENSOR SWEEP" />
      <SensorPlay
        key={playKey}
        durationMs={ROUND_DURATION_MS}
        onComplete={handleComplete}
        onExit={handleExitToHub}
      />
    </div>
  );
}
