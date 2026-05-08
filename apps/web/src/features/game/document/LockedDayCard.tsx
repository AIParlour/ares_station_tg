/* ─────────────────────────────────────────────────────────────────────────────
   LockedDayCard — shown when today's mission is complete and the next day is
   still gated by its release timer.

   Surface:
     [ countdown ]    DAY N+1 RELEASES IN HH:MM:SS
     [ balance  ]    BALANCE: X ⬡
     [ skip btn ]    SKIP TIMER · 50 ⬡   (disabled if balance < 50)
     [ hint     ]    EARN ⬡ IN OPERATOR DRILLS
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import { skipWait } from "../../../shared/api/progress";
import styles from "./LockedDayCard.module.css";

const SKIP_COST = 50;

interface LockedDayCardProps {
  dayId:       string;
  dayNumber:   number;
  unlockedAt:  string;        // ISO timestamp
  balance:     number;
  /** Called after a successful skip — parent reloads game state. */
  onSkipped:   (newBalance: number) => void;
  /** Optional: navigate to drills hub. */
  onGoDrills?: () => void;
}

/** Format ms → "HH:MM:SS" (or "MM:SS" if < 1h). */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "RELEASING…";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function LockedDayCard({
  dayId,
  dayNumber,
  unlockedAt,
  balance,
  onSkipped,
  onGoDrills,
}: LockedDayCardProps) {
  const [now, setNow]       = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Tick every second.
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const target  = new Date(unlockedAt).getTime();
  const msLeft  = target - now;
  const ready   = msLeft <= 0;
  const canSkip = balance >= SKIP_COST && !submitting && !ready;

  const handleSkip = async () => {
    if (!canSkip) return;
    haptic("impact", "medium");
    setSubmitting(true);
    setError(null);
    try {
      const res = await skipWait(dayId);
      onSkipped(res.newBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Skip failed");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.label}>NEXT MISSION</div>
      <div className={styles.dayNum}>SOL · DAY {dayNumber}</div>

      <div className={`${styles.countdown} ${ready ? styles["countdown--ready"] : ""}`}>
        <div className={styles.countdown__label}>
          {ready ? "READY" : "RELEASES IN"}
        </div>
        <div className={styles.countdown__value}>
          {formatCountdown(msLeft)}
        </div>
      </div>

      <div className={styles.balance}>
        <span className={styles.balance__label}>BALANCE</span>
        <span className={styles.balance__value}>{balance} ⬡</span>
      </div>

      <button
        className={styles.skip}
        onClick={handleSkip}
        disabled={!canSkip}
      >
        {submitting
          ? "UPLINKING…"
          : ready
          ? "RELOAD"
          : balance < SKIP_COST
          ? `SKIP REQUIRES ${SKIP_COST} ⬡`
          : `SKIP TIMER · ${SKIP_COST} ⬡`}
      </button>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {!ready && balance < SKIP_COST && onGoDrills && (
        <button className={styles.earnBtn} onClick={onGoDrills}>
          EARN ⬡ IN OPERATOR DRILLS
        </button>
      )}
    </div>
  );
}
