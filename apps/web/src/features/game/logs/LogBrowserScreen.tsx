/* ─────────────────────────────────────────────────────────────────────────────
   LogBrowserScreen — Paradox system logs with tap-to-decrypt redactions.
   Replaces the free-form Paradox chat for Season 1 (no LLM).

   Mechanic:
     - Each redacted segment has a `key` (e.g. "THERMAL", "LAMP").
     - If the player's unlockedWords include that key, tapping it reveals the text.
     - Otherwise, tapping flashes a toast telling the player they lack access.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { TopBar }         from "../../../shared/ui/TopBar/TopBar";
import { useRouter }      from "../../../app/Router";
import { useGame }        from "../GameProvider";
import { haptic }         from "../../../shared/hooks/useTelegram";
import type { ParadoxLog, LogSegment } from "../../../shared/types/game";
import styles from "./LogBrowserScreen.module.css";

export function LogBrowserScreen() {
  const { goBack } = useRouter();
  const { state }  = useGame();

  const logs = state.day?.paradoxLogs ?? [];
  const unlocked = new Set(state.unlockedWords);

  /* Persist reveals across taps — once unlocked in this session, they stay open */
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSegmentTap = (segmentKey: string, globalId: string) => {
    if (unlocked.has(segmentKey)) {
      if (!revealed.has(globalId)) {
        haptic("notification", "success");
        setRevealed((prev) => new Set(prev).add(globalId));
      }
    } else {
      haptic("impact", "medium");
      setToast(`ACCESS INSUFFICIENT — KEY REQUIRED`);
    }
  };

  return (
    <div className={styles.logs}>
      <Classification level="red-alert" label="CLASSIFIED // PARADOX INTERNAL" />
      <TopBar title="SYSTEM LOGS" onBack={goBack} />

      <div className={styles.logs__intro}>
        <div className={styles.logs__intro__title}>PARADOX MEMORY ACCESS</div>
        <div className={styles.logs__intro__subtitle}>
          Tap redacted fields to decrypt using collected keys.
        </div>
      </div>

      <Keyring unlockedWords={state.unlockedWords} />

      <div className={styles.logs__list}>
        {logs.length === 0 ? (
          <div className={styles.logs__empty}>NO SYSTEM LOGS AVAILABLE FOR THIS SOL.</div>
        ) : (
          logs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              revealed={revealed}
              onSegmentTap={handleSegmentTap}
            />
          ))
        )}
      </div>

      {toast && <div className={styles.logs__toast}>{toast}</div>}
    </div>
  );
}

/* ── Keyring (collected unlock words) ────────────────────────────────────────── */

function Keyring({ unlockedWords }: { unlockedWords: string[] }) {
  return (
    <div className={styles.logs__keyring}>
      <span className={styles.logs__keyring__label}>KEYS:</span>
      {unlockedWords.length === 0 ? (
        <span className={styles.logs__keyring__empty}>
          No keys collected. Solve puzzles to earn decryption keys.
        </span>
      ) : (
        unlockedWords.map((word) => (
          <span key={word} className={styles.logs__keyring__word}>
            {word}
          </span>
        ))
      )}
    </div>
  );
}

/* ── Single log entry ────────────────────────────────────────────────────────── */

function LogEntry({
  log,
  revealed,
  onSegmentTap,
}: {
  log: ParadoxLog;
  revealed: Set<string>;
  onSegmentTap: (key: string, globalId: string) => void;
}) {
  return (
    <article className={styles.logs__entry}>
      <header className={styles.logs__entry__header}>
        <span className={styles.logs__entry__timestamp}>{log.timestamp}</span>
        <span>{log.classification}</span>
      </header>

      <p className={styles.logs__entry__body}>
        {log.segments.map((seg, i) => (
          <Segment
            key={`${log.id}-${i}`}
            segment={seg}
            globalId={`${log.id}-${i}`}
            revealed={revealed}
            onTap={onSegmentTap}
          />
        ))}
      </p>
    </article>
  );
}

/* ── Segment renderer ────────────────────────────────────────────────────────── */

function Segment({
  segment,
  globalId,
  revealed,
  onTap,
}: {
  segment: LogSegment;
  globalId: string;
  revealed: Set<string>;
  onTap: (key: string, globalId: string) => void;
}) {
  if (segment.type === "text") {
    return <span className={styles.logs__segment}>{segment.text}</span>;
  }

  const isRevealed = revealed.has(globalId);
  const classes = isRevealed
    ? `${styles.logs__redaction} ${styles["logs__redaction--unlocked"]}`
    : `${styles.logs__redaction} ${styles["logs__redaction--locked"]}`;

  return (
    <span
      className={classes}
      onClick={() => onTap(segment.key, globalId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap(segment.key, globalId);
        }
      }}
    >
      {isRevealed ? segment.text : ""}
    </span>
  );
}
