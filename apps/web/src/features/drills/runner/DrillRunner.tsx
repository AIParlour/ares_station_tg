/* ─────────────────────────────────────────────────────────────────────────────
   DrillRunner — shared shell for all Operator Drill rounds.
   Provides:
     - Countdown timer HUD
     - Score counter
     - Streak counter
     - Drill name header
     - Children slot for drill-specific round content (cipher input, sensor table, etc.)

   M0: skeleton only — exercised in M1 when CipherCalibration is built.
   ───────────────────────────────────────────────────────────────────────────── */

import { ReactNode, useEffect } from "react";
import { useRoundTimer } from "./useRoundTimer";
import { DRILL_META } from "../drillMeta";
import type { DrillType } from "../../../shared/api/drills";
import { haptic } from "../../../shared/hooks/useTelegram";
import styles from "./DrillRunner.module.css";

interface DrillRunnerProps {
  drillType:  DrillType;
  durationMs: number;
  score:      number;
  streak:     number;
  /** Called once when timer reaches zero. Drill should hand back final score. */
  onExpire:   () => void;
  /** Called when user taps the exit button. */
  onExit?:    () => void;
  children:   ReactNode;
}

export function DrillRunner({
  drillType,
  durationMs,
  score,
  streak,
  onExpire,
  onExit,
  children,
}: DrillRunnerProps) {
  const meta = DRILL_META[drillType];
  const timer = useRoundTimer({ durationMs, autoStart: true, onExpire });

  // Light haptic each second tick under 5s remaining.
  useEffect(() => {
    if (timer.msLeft > 0 && timer.msLeft <= 5000 && timer.msLeft % 1000 < 50) {
      haptic("impact", "light");
    }
  }, [timer.msLeft]);

  const seconds = Math.ceil(timer.msLeft / 1000);
  const isUrgent = timer.msLeft <= 5000;

  return (
    <div className={styles.runner}>
      <header className={styles.runner__header}>
        <button className={styles.runner__exit} onClick={onExit} aria-label="Exit drill">
          ✕
        </button>
        <div className={styles.runner__name}>{meta.name}</div>
        <div className={styles.runner__streak}>
          <span className={styles.runner__streak__label}>×</span>
          <span className={styles.runner__streak__value}>{streak}</span>
        </div>
      </header>

      <div className={styles.runner__hud}>
        <Stat label="TIME" value={`${seconds}s`} urgent={isUrgent} />
        <Stat label="SCORE" value={String(score)} />
      </div>

      <main className={styles.runner__stage}>
        {children}
      </main>
    </div>
  );
}

function Stat({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className={`${styles.stat} ${urgent ? styles["stat--urgent"] : ""}`}>
      <div className={styles.stat__label}>{label}</div>
      <div className={styles.stat__value}>{value}</div>
    </div>
  );
}
