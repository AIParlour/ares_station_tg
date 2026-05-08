/* ─────────────────────────────────────────────────────────────────────────────
   WorkoutScreen — Daily Calibration runner.

   Sequences the 3 drills picked for today's UTC day. Each drill plays for 60s,
   then a "between" transition card; final drill rolls into a summary screen
   that POSTs /api/drills/workout/complete.

   Lifecycle:
     loading      — fetch today's workout descriptor
     already-done — workout already completed for this UTC day
     ready        — splash + BEGIN
     playing      — drill at drillIndex is running
     between      — transition card between drills (CONTINUE button)
     submitting   — POST workout/complete in flight
     summary      — final results
     fetch-error  — couldn't load today's workout

   Architectural invariant
   -----------------------
   If the player exits mid-workout (DrillRunner X button), we DROP the partial
   scores and DO NOT submit — the day stays "pending" so they can try later
   without a streak penalty.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../../app/Router";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { haptic } from "../../../shared/hooks/useTelegram";
import { apiGet } from "../../../shared/api/client";
import {
  completeWorkout,
  type DrillType,
  type WorkoutResult,
} from "../../../shared/api/drills";
import { DRILL_META } from "../drillMeta";
import { CipherPlay } from "../cipher/CipherPlay";
import { SensorPlay } from "../sensor/SensorPlay";
import { PatternPlay } from "../pattern/PatternPlay";
import { DriftPlay } from "../drift/DriftPlay";
import styles from "./WorkoutScreen.module.css";

const ROUND_DURATION_MS = 60_000;

type Phase =
  | "loading"
  | "already-done"
  | "ready"
  | "playing"
  | "between"
  | "submitting"
  | "summary"
  | "fetch-error";

interface DrillRound {
  drillType: DrillType;
  score:     number;
}

interface TodayWorkoutResponse {
  ok:           true;
  utcDay:       string;
  drills:       DrillType[];
  status:       "pending" | "completed";
  completedAt:  string | null;
}

/* ── Integrity score helpers ─────────────────────────────────────────────── */

/**
 * Integrity = sum(score / goldThreshold) / drillCount, capped at 1, * 100.
 * Matches the server's calc; we display optimistically before the response.
 */
function computeIntegrity(rounds: DrillRound[]): number {
  if (rounds.length === 0) return 0;
  let pct = 0;
  for (const r of rounds) {
    const gold = DRILL_META[r.drillType].thresholds.gold;
    pct += Math.min(1, r.score / gold);
  }
  return Math.round((pct / rounds.length) * 100);
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function WorkoutScreen() {
  const { goBack, replace } = useRouter();

  const [phase, setPhase]           = useState<Phase>("loading");
  const [drills, setDrills]         = useState<DrillType[]>([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [scores, setScores]         = useState<DrillRound[]>([]);
  const [result, setResult]         = useState<WorkoutResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  /* Load today's workout descriptor */
  useEffect(() => {
    let cancelled = false;
    apiGet<TodayWorkoutResponse>("/api/drills/workout/today")
      .then((data) => {
        if (cancelled) return;
        if (data.status === "completed") {
          setPhase("already-done");
        } else {
          setDrills(data.drills);
          setPhase("ready");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setPhase("fetch-error");
      });
    return () => { cancelled = true; };
  }, []);

  const handleBegin = useCallback(() => {
    haptic("impact", "medium");
    setDrillIndex(0);
    setScores([]);
    setPhase("playing");
  }, []);

  const handleDrillComplete = useCallback((score: number) => {
    const drillType = drills[drillIndex];
    setScores((prev) => [...prev, { drillType, score }]);
    if (drillIndex < drills.length - 1) {
      setPhase("between");
    } else {
      setPhase("submitting");
    }
  }, [drillIndex, drills]);

  const handleContinue = useCallback(() => {
    haptic("impact", "light");
    setDrillIndex((i) => i + 1);
    setPhase("playing");
  }, []);

  const handleExitMidWorkout = useCallback(() => {
    // Discard partial — go back to hub. Day stays pending.
    replace({ name: "drills" });
  }, [replace]);

  const handleBackToHub = useCallback(() => {
    replace({ name: "drills" });
  }, [replace]);

  /* Submit when we hit "submitting" — runs once. */
  useEffect(() => {
    if (phase !== "submitting") return;
    let cancelled = false;
    const integrity = computeIntegrity(scores);
    completeWorkout(
      scores.map((s) => ({ drillType: s.drillType, score: s.score })),
      integrity,
    )
      .then((r) => {
        if (cancelled) return;
        setResult(r);
        setPhase("summary");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setPhase("summary");   // still show what we have, with error banner
      });
    return () => { cancelled = true; };
    // scores is stable once we hit "submitting"; deliberately not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (phase === "loading") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
        <TopBar onBack={goBack} title="DAILY CALIBRATION" />
        <div className={styles.center}>
          <div className={styles.center__line}>LOADING TODAY'S BRIEF…</div>
        </div>
      </div>
    );
  }

  if (phase === "fetch-error") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
        <TopBar onBack={goBack} title="DAILY CALIBRATION" />
        <div className={styles.center}>
          <div className={styles.center__line}>UPLINK FAILED</div>
          <div className={styles.center__lineDim}>{error}</div>
          <button className={styles.btnSecondary} onClick={handleBackToHub}>BACK</button>
        </div>
      </div>
    );
  }

  if (phase === "already-done") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
        <TopBar onBack={goBack} title="DAILY CALIBRATION" />
        <div className={styles.center}>
          <div className={styles.center__title}>WORKOUT COMPLETE</div>
          <div className={styles.center__line}>RETURN TOMORROW FOR THE NEXT BRIEF</div>
          <button className={styles.btnSecondary} onClick={handleBackToHub}>BACK</button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
        <div className={styles.ready}>
          <div className={styles.ready__title}>DAILY CALIBRATION</div>

          <div className={styles.ready__sub}>TODAY'S BRIEF</div>

          <ol className={styles.ready__drills}>
            {drills.map((d, i) => (
              <li key={d} className={styles.ready__drillRow}>
                <span className={styles.ready__drillIdx}>{i + 1}</span>
                <span className={styles.ready__drillName}>{DRILL_META[d].name}</span>
                <span className={styles.ready__drillDomain}>
                  {DRILL_META[d].domain.toUpperCase()}
                </span>
              </li>
            ))}
          </ol>

          <div className={styles.ready__meta}>
            THREE 60-SECOND ROUNDS · ONE INTEGRITY SCORE
          </div>

          <button className={styles.btnPrimary} onClick={handleBegin}>
            BEGIN
          </button>
          <button className={styles.btnSecondary} onClick={goBack}>
            BACK
          </button>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    const drillType = drills[drillIndex];
    return (
      <div className={styles.screen}>
        <Classification level="standard" label={`OPERATOR DRILLS // CALIBRATION ${drillIndex + 1}/${drills.length}`} />
        {drillType === "cipher"  && <CipherPlay  durationMs={ROUND_DURATION_MS} onComplete={handleDrillComplete} onExit={handleExitMidWorkout} />}
        {drillType === "sensor"  && <SensorPlay  durationMs={ROUND_DURATION_MS} onComplete={handleDrillComplete} onExit={handleExitMidWorkout} />}
        {drillType === "pattern" && <PatternPlay durationMs={ROUND_DURATION_MS} onComplete={handleDrillComplete} onExit={handleExitMidWorkout} />}
        {drillType === "drift"   && <DriftPlay   durationMs={ROUND_DURATION_MS} onComplete={handleDrillComplete} onExit={handleExitMidWorkout} />}
      </div>
    );
  }

  if (phase === "between") {
    const finishedDrill = drills[drillIndex];
    const finishedScore = scores[scores.length - 1]?.score ?? 0;
    const nextDrill     = drills[drillIndex + 1];
    return (
      <div className={styles.screen}>
        <Classification level="standard" label={`OPERATOR DRILLS // CALIBRATION ${drillIndex + 1}/${drills.length}`} />
        <div className={styles.between}>
          <div className={styles.between__progress}>
            DRILL {drillIndex + 1} OF {drills.length} COMPLETE
          </div>
          <div className={styles.between__name}>{DRILL_META[finishedDrill].name}</div>

          <div className={styles.between__scoreCard}>
            <div className={styles.between__scoreCard__label}>SCORE</div>
            <div className={styles.between__scoreCard__value}>{finishedScore}</div>
          </div>

          <div className={styles.between__next}>
            <span className={styles.between__next__label}>NEXT</span>
            <span className={styles.between__next__name}>{DRILL_META[nextDrill].name}</span>
          </div>

          <button className={styles.btnPrimary} onClick={handleContinue}>
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className={styles.screen}>
        <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
        <div className={styles.center}>
          <div className={styles.center__title}>COMPILING REPORT</div>
          <div className={styles.center__line}>UPLINKING TO PARADOX…</div>
        </div>
      </div>
    );
  }

  // phase === "summary"
  const integrityNow = result?.flavorLine ? undefined : computeIntegrity(scores);
  return (
    <div className={styles.screen}>
      <Classification level="standard" label="OPERATOR DRILLS // DAILY CALIBRATION" />
      <div className={styles.summary}>
        <div className={styles.summary__title}>WORKOUT COMPLETE</div>

        <div className={styles.summary__integrity}>
          <div className={styles.summary__integrity__label}>INTEGRITY</div>
          <div className={styles.summary__integrity__value}>
            {integrityNow ?? computeIntegrity(scores)}<span className={styles.summary__integrity__pct}>%</span>
          </div>
        </div>

        <ul className={styles.summary__breakdown}>
          {scores.map((s) => {
            const meta = DRILL_META[s.drillType];
            return (
              <li key={s.drillType} className={styles.summary__row}>
                <span className={styles.summary__rowName}>{meta.short}</span>
                <span className={styles.summary__rowScore}>
                  {s.score}<span className={styles.summary__rowOf}> / {meta.thresholds.gold}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {result && (
          <div className={styles.summary__rewards}>
            <div className={styles.summary__streak}>
              STREAK · {result.streak} DAYS
              {result.streak > 1 && result.streak === result.longestStreak && " · NEW BEST"}
            </div>
            {result.currencyAwarded > 0 && (
              <div className={styles.summary__credits}>
                +{result.currencyAwarded} CREDITS
              </div>
            )}
            {result.codexUnlocks.length > 0 && (
              <div className={styles.summary__codex}>
                <div className={styles.summary__codex__heading}>CODEX UNLOCKED</div>
                {result.codexUnlocks.map((u) => (
                  <div key={u.id} className={styles.summary__codex__row}>· {u.title}</div>
                ))}
              </div>
            )}
            {result.flavorLine && (
              <div className={styles.summary__flavor}>“{result.flavorLine}”</div>
            )}
          </div>
        )}

        {error && (
          <div className={styles.summary__error}>
            UPLINK FAILED — RESULTS MAY NOT BE SAVED<br />
            <span className={styles.summary__error__detail}>{error}</span>
          </div>
        )}

        <button className={styles.btnPrimary} onClick={handleBackToHub}>
          BACK TO DRILLS
        </button>
      </div>
    </div>
  );
}
