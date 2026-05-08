/* ─────────────────────────────────────────────────────────────────────────────
   DrillsHubScreen — entry point for Operator Drills (side mode).
   M0: empty state UI wired to GET /api/drills/state. No drill play yet.
   M1+: drill cards become tappable; Daily Workout becomes runnable.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { TopBar }         from "../../shared/ui/TopBar/TopBar";
import { Classification } from "../../shared/ui/Classification/Classification";
import { useRouter }      from "../../app/Router";
import { haptic }         from "../../shared/hooks/useTelegram";
import {
  getDrillsState,
  type DrillsState,
  type DrillStat,
  type DrillType,
  type MasteryTier,
} from "../../shared/api/drills";
import { DRILL_META, ALL_DRILL_TYPES } from "./drillMeta";
import styles from "./DrillsHubScreen.module.css";

export function DrillsHubScreen() {
  const { goBack, navigate } = useRouter();

  const [state, setState] = useState<DrillsState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDrillsState()
      .then((s) => { if (!cancelled) setState(s); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, []);

  const statByType: Record<DrillType, DrillStat | undefined> = {
    cipher:  state?.stats.find((s) => s.drillType === "cipher"),
    sensor:  state?.stats.find((s) => s.drillType === "sensor"),
    pattern: state?.stats.find((s) => s.drillType === "pattern"),
    drift:   state?.stats.find((s) => s.drillType === "drift"),
  };

  const handleWorkout = () => {
    haptic("impact", "medium");
    navigate({ name: "workoutRun" });
  };

  const handleDrill = (drillType: DrillType) => {
    haptic("selection");
    navigate({ name: "drillRun", params: { drillType } });
  };

  return (
    <div className={styles.hub}>
      <Classification level="standard" label="OPERATOR DRILLS // COGNITIVE CALIBRATION" />
      <TopBar onBack={goBack} title="OPERATOR DRILLS" />

      <div className={styles.hub__hero}>
        <div className={styles.hub__hero__title}>PARADOX COGNITIVE MONITOR</div>
        <div className={styles.hub__hero__subtitle}>
          {error ? "OFFLINE — RETRY" : "CALIBRATION PROTOCOL ACTIVE"}
        </div>
      </div>

      <div className={styles.hub__stats}>
        <Stat label="INTEGRITY"
              value={state ? "—" : "···"}
              suffix="" />
        <Stat label="STREAK"
              value={state?.streak.currentStreak ?? "···"}
              suffix={state ? "DAYS" : ""} />
        <Stat label="WORKOUT"
              value={state?.todayWorkout.status === "completed" ? "DONE" : "PENDING"}
              suffix="" />
      </div>

      <button
        className={`${styles.hub__workout} ${state?.todayWorkout.status === "completed" ? styles["hub__workout--done"] : ""}`}
        onClick={handleWorkout}
        disabled={!state || state.todayWorkout.status === "completed"}
      >
        <div className={styles.hub__workout__head}>
          <span className={styles.hub__workout__label}>DAILY CALIBRATION</span>
          <span className={styles.hub__workout__time}>~5 MIN</span>
        </div>
        <div className={styles.hub__workout__sub}>
          {state?.todayWorkout.status === "completed"
            ? "RETURN TOMORROW"
            : "THREE DRILLS · ONE INTEGRITY SCORE"}
        </div>
        <div className={styles.hub__workout__chips}>
          {(state?.todayWorkout.drills ?? []).map((d) => (
            <span key={d} className={styles.hub__workout__chip}>{DRILL_META[d].short}</span>
          ))}
          {!state && <span className={styles.hub__workout__chipDim}>···</span>}
        </div>
      </button>

      <div className={styles.hub__divider}>OPERATOR DRILLS</div>

      <div className={styles.hub__drillList}>
        {ALL_DRILL_TYPES.map((dt) => {
          const meta = DRILL_META[dt];
          const stat = statByType[dt];
          return (
            <button key={dt} className={styles.hub__drill} onClick={() => handleDrill(dt)}>
              <div className={styles.hub__drill__head}>
                <span className={styles.hub__drill__name}>{meta.name}</span>
                <MasteryBadge tier={stat?.masteryTier ?? "none"} />
              </div>
              <div className={styles.hub__drill__blurb}>{meta.blurb}</div>
              <div className={styles.hub__drill__foot}>
                <span className={styles.hub__drill__pb}>
                  PB · {stat && stat.bestScore > 0 ? stat.bestScore : "—"}
                </span>
                <span className={styles.hub__drill__domain}>{meta.domain.toUpperCase()}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.hub__footer}>
        PARADOX v4.1 // PERFORMANCE LOGGED // NO STORY DATA AT RISK
      </div>
    </div>
  );
}

/* ── Pieces ────────────────────────────────────────────────────────────────── */

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.stat__label}>{label}</div>
      <div className={styles.stat__value}>
        <span>{value}</span>
        {suffix && <span className={styles.stat__suffix}>{suffix}</span>}
      </div>
    </div>
  );
}

function MasteryBadge({ tier }: { tier: MasteryTier }) {
  if (tier === "none") return <span className={styles.badge_none}>—</span>;
  return <span className={`${styles.badge} ${styles[`badge--${tier}`]}`}>{tier.toUpperCase()}</span>;
}
