/* ─────────────────────────────────────────────────────────────────────────────
   DrillResults — generic post-round summary.

   Used by every drill (Cipher in M1, Sensor/Pattern/Drift in M2).

   States:
     - submitting — POST /api/drills/round in flight (result === null, no error)
     - success    — server result available
     - error      — submission failed; user can still retry the round
   ───────────────────────────────────────────────────────────────────────────── */

import { DRILL_META } from "../drillMeta";
import type { DrillType, MasteryTier, RoundResult } from "../../../shared/api/drills";
import styles from "./DrillResults.module.css";

interface DrillResultsProps {
  drillType:    DrillType;
  score:        number;
  result:       RoundResult | null;
  error:        string | null;
  onPlayAgain:  () => void;
  onBack:       () => void;
}

export function DrillResults({
  drillType,
  score,
  result,
  error,
  onPlayAgain,
  onBack,
}: DrillResultsProps) {
  const meta       = DRILL_META[drillType];
  const submitting = !result && !error;
  const tier       = result?.masteryTier ?? "none";
  const pb         = result?.newPersonalBest === true;
  const tierUp     = result?.masteryChanged === true;

  return (
    <div className={styles.results}>
      <div className={styles.results__head}>
        <div className={styles.results__head__label}>ROUND COMPLETE</div>
        <div className={styles.results__head__name}>{meta.name}</div>
      </div>

      <div className={styles.results__scoreCard}>
        <div className={styles.results__scoreCard__label}>SCORE</div>
        <div className={styles.results__scoreCard__value}>{score}</div>
        {pb && (
          <div className={styles.results__scoreCard__pb}>NEW PERSONAL BEST</div>
        )}
      </div>

      <div className={styles.results__masteryRow}>
        <div className={styles.results__masteryRow__label}>MASTERY</div>
        <MasteryDisplay tier={tier} thresholds={meta.thresholds} score={result?.score ?? score} />
        {tierUp && tier !== "none" && (
          <div className={styles.results__masteryRow__up}>↑ TIER ADVANCED</div>
        )}
      </div>

      {submitting && (
        <div className={styles.results__status}>SUBMITTING…</div>
      )}
      {error && (
        <div className={styles.results__error}>
          UPLINK FAILED — RESULTS NOT SAVED<br />
          <span className={styles.results__error__detail}>{error}</span>
        </div>
      )}

      <div className={styles.results__actions}>
        <button className={styles.results__playAgain} onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button className={styles.results__back} onClick={onBack}>
          BACK TO DRILLS
        </button>
      </div>
    </div>
  );
}

/* ── Mastery progress bar ──────────────────────────────────────────────────── */

interface MasteryDisplayProps {
  tier:       MasteryTier;
  thresholds: { bronze: number; silver: number; gold: number };
  score:      number;
}

function MasteryDisplay({ tier, thresholds, score }: MasteryDisplayProps) {
  // Progress to next tier (0..1). Gold is the cap.
  const next =
    tier === "none"   ? thresholds.bronze :
    tier === "bronze" ? thresholds.silver :
    tier === "silver" ? thresholds.gold   :
                        thresholds.gold;
  const prev =
    tier === "none"   ? 0 :
    tier === "bronze" ? thresholds.bronze :
    tier === "silver" ? thresholds.silver :
                        thresholds.gold;
  const denom = Math.max(1, next - prev);
  const progress = tier === "gold" ? 1 : Math.min(1, Math.max(0, (score - prev) / denom));

  return (
    <div className={styles.mastery}>
      <span className={`${styles.mastery__tier} ${styles[`mastery__tier--${tier}`]}`}>
        {tier === "none" ? "—" : tier.toUpperCase()}
      </span>
      <div className={styles.mastery__bar}>
        <div
          className={`${styles.mastery__fill} ${styles[`mastery__fill--${tier}`]}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className={styles.mastery__next}>
        {tier === "gold" ? "MAX" : `${score}/${next}`}
      </span>
    </div>
  );
}
