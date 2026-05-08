/* ─────────────────────────────────────────────────────────────────────────────
   CipherDrillScreen — orchestrates a Cipher Calibration round.

   Lifecycle:
     1. ready    — pre-round splash with "BEGIN" CTA.
     2. playing  — timer running; CipherRound shows back-to-back puzzles.
     3. finished — round expired or user exited; submit score, show results.

   Roadmap-side decisions baked in here:
     - 60-second rounds.
     - One substitution KEY per round → player benefits from learning it.
     - Difficulty index = current score → puzzles ramp as the player succeeds.
     - Skip is free in v1.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../../app/Router";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { DrillResults } from "../runner/DrillResults";
import { CipherPlay } from "./CipherPlay";
import {
  submitRound,
  type RoundResult,
} from "../../../shared/api/drills";
import styles from "./CipherDrillScreen.module.css";

const ROUND_DURATION_MS = 60_000;

type Phase = "ready" | "playing" | "finished";

/* ── Static example used in the splash. Hand-built so the mapping reads
   cleanly: A→Q, R→K, E→T, S→L → "ARES" encodes to "QKTL". ─────────────────── */
const EXAMPLE_PAIRS: Array<[plain: string, cipher: string]> = [
  ["A", "Q"], ["R", "K"], ["E", "T"], ["S", "L"],
];

export function CipherDrillScreen() {
  const { goBack, replace } = useRouter();

  const [phase, setPhase]         = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [result, setResult]       = useState<RoundResult | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [playKey, setPlayKey]     = useState(0);

  const handleBegin = useCallback(() => {
    haptic("impact", "medium");
    setPhase("playing");
  }, []);

  /* Round timer expired — CipherPlay hands back final score. */
  const handleComplete = useCallback((score: number) => {
    setFinalScore(score);
    setPhase("finished");
  }, []);

  /* Submit when we hit "finished" — runs once per round */
  useEffect(() => {
    if (phase !== "finished") return;
    let cancelled = false;
    submitRound("cipher", finalScore, ROUND_DURATION_MS)
      .then((r) => { if (!cancelled) setResult(r); })
      .catch((e) => { if (!cancelled) setSubmitErr(String(e)); });
    return () => { cancelled = true; };
  }, [phase, finalScore]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setSubmitErr(null);
    setFinalScore(0);
    setPlayKey((n) => n + 1);  // remount CipherPlay → fresh key + state
    setPhase("ready");
  }, []);

  const handleExitToHub = useCallback(() => {
    replace({ name: "drills" });
  }, [replace]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (phase === "ready") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // CIPHER CALIBRATION" />
        <div className={styles.ready}>
          <div className={styles.ready__title}>CIPHER CALIBRATION</div>

          <div className={styles.ready__howto}>
            <div className={styles.ready__howto__heading}>HOW IT WORKS</div>
            <p className={styles.ready__howto__line}>
              A SUBSTITUTION KEY IS REVEALED.
            </p>
            <p className={styles.ready__howto__line}>
              READ EACH CIPHER LETTER FROM THE KEY.
            </p>
            <p className={styles.ready__howto__line}>
              TYPE THE PLAINTEXT WORD.
            </p>
          </div>

          <div className={styles.ready__example}>
            <div className={styles.ready__example__label}>EXAMPLE KEY</div>
            <div className={styles.ready__example__grid}>
              {EXAMPLE_PAIRS.map(([plain, cipher]) => (
                <div key={plain} className={styles.ready__example__col}>
                  <span className={styles.ready__example__plain}>{plain}</span>
                  <span className={styles.ready__example__arrow}>↓</span>
                  <span className={styles.ready__example__cipher}>{cipher}</span>
                </div>
              ))}
            </div>
            <div className={styles.ready__example__caption}>
              QKTL  →  ARES
            </div>
          </div>

          <div className={styles.ready__meta}>
            60 SECONDS · KEY HOLDS FOR THE ROUND · SKIP IS FREE
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
        <Classification level="standard" label="OPERATOR DRILLS // CIPHER CALIBRATION" />
        <DrillResults
          drillType="cipher"
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
      <Classification level="standard" label="OPERATOR DRILLS // CIPHER CALIBRATION" />
      <CipherPlay
        key={playKey}
        durationMs={ROUND_DURATION_MS}
        onComplete={handleComplete}
        onExit={handleExitToHub}
      />
    </div>
  );
}
