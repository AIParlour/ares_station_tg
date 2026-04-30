/* ─────────────────────────────────────────────────────────────────────────────
   DocumentScreen — Main day screen.

   Layout:
     1. Paradox system logs (redacted fields auto-reveal as keys are collected)
     2. "Collect seed phrase" section with puzzle buttons
     3. "View Full Log" button — unlocks after all puzzles solved
   ───────────────────────────────────────────────────────────────────────────── */

import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import type { ParadoxLog, LogSegment } from "../../../shared/types/game";
import styles from "./DocumentScreen.module.css";

export function DocumentScreen() {
  const { state } = useGame();
  const { navigate, goBack } = useRouter();

  /* ── Loading / Error ──────────────────────────────────────────────────────── */

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className={styles.day}>
        <TopBar onBack={goBack} title="LOADING" />
        <div className={styles.day__loading}>RETRIEVING ARCHIVE…</div>
      </div>
    );
  }

  if (state.status === "error" || !state.day) {
    return (
      <div className={styles.day}>
        <TopBar onBack={goBack} title="ERROR" />
        <div className={styles.day__error}>{state.error ?? "UNKNOWN ERROR"}</div>
      </div>
    );
  }

  const { day } = state;
  const logs = day.paradoxLogs ?? [];
  const unlocked = new Set(state.unlockedWords);
  const totalPuzzles = day.puzzles.length;
  const solvedCount = day.puzzles.filter((p) => state.solved[p.slot]).length;
  const allSolved = solvedCount === totalPuzzles;

  /* ── Handlers ─────────────────────────────────────────────────────────────── */

  const handlePuzzle = (slot: string) => {
    haptic("impact", "light");
    navigate({ name: "puzzle", params: { slot } });
  };

  const handleViewStory = () => {
    haptic("impact", "medium");
    navigate({ name: "story" });
  };

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.day}>
      <Classification level="red-alert" label={`CLASSIFIED // SOL ${day.stardate}`} />
      <TopBar onBack={goBack} title={day.title.toUpperCase()} />

      {/* ── Section 1: Paradox Logs ──────────────────────────────────────────── */}
      <div className={styles.day__logs}>
        <div className={styles.day__logs__header}>
          <div className={styles.day__logs__title}>PARADOX MEMORY ACCESS</div>
          <div className={styles.day__logs__subtitle}>
            Redacted fields decrypt as you collect keys.
          </div>
        </div>

        <Keyring unlockedWords={state.unlockedWords} />

        <div className={styles.day__logs__list}>
          {logs.length === 0 ? (
            <div className={styles.day__logs__empty}>
              NO SYSTEM LOGS AVAILABLE FOR THIS SOL.
            </div>
          ) : (
            logs.map((log) => (
              <LogEntry
                key={log.id}
                log={log}
                unlocked={unlocked}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Section 2: Puzzle Buttons ────────────────────────────────────────── */}
      <div className={styles.day__puzzles}>
        <div className={styles.day__puzzles__header}>
          COLLECT SEED PHRASE TO DECRYPT LOGS — {solvedCount}/{totalPuzzles}
        </div>

        <div className={styles.day__puzzles__grid}>
          {day.puzzles.map((puzzle) => {
            const solved = state.solved[puzzle.slot];
            return (
              <button
                key={puzzle.slot}
                className={`${styles.day__puzzle__btn} ${solved ? styles["day__puzzle__btn--solved"] : ""}`}
                onClick={() => handlePuzzle(puzzle.slot)}
              >
                <span className={styles.day__puzzle__icon}>
                  {solved ? "✓" : "◇"}
                </span>
                <span className={styles.day__puzzle__word}>
                  {solved ? puzzle.unlockWord : "? ? ?"}
                </span>
                <span className={styles.day__puzzle__status}>
                  {solved ? "DECRYPTED" : "ENCRYPTED"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Story Unlock Button ───────────────────────────────────── */}
      <div className={styles.day__story}>
        <button
          className={`${styles.day__story__btn} ${allSolved ? styles["day__story__btn--active"] : styles["day__story__btn--locked"]}`}
          onClick={allSolved ? handleViewStory : undefined}
          disabled={!allSolved}
        >
          <span className={styles.day__story__icon}>
            {allSolved ? "▶" : "◈"}
          </span>
          <span className={styles.day__story__label}>
            {allSolved ? "ACCESS MISSION LOG" : `${totalPuzzles - solvedCount} KEYS REMAINING`}
          </span>
        </button>
        {!allSolved && (
          <div className={styles.day__story__hint}>
            Solve all puzzles to unlock Dr. Leskov's personal log.
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Keyring ─────────────────────────────────────────────────────────────────── */

function Keyring({ unlockedWords }: { unlockedWords: string[] }) {
  return (
    <div className={styles.day__keyring}>
      <span className={styles.day__keyring__label}>KEYS:</span>
      {unlockedWords.length === 0 ? (
        <span className={styles.day__keyring__empty}>
          No keys collected yet.
        </span>
      ) : (
        unlockedWords.map((word) => (
          <span key={word} className={styles.day__keyring__word}>
            {word}
          </span>
        ))
      )}
    </div>
  );
}

/* ── Log Entry ───────────────────────────────────────────────────────────────── */

function LogEntry({
  log,
  unlocked,
}: {
  log: ParadoxLog;
  unlocked: Set<string>;
}) {
  return (
    <article className={styles.day__log__entry}>
      <header className={styles.day__log__header}>
        <span className={styles.day__log__timestamp}>{log.timestamp}</span>
        <span>{log.classification}</span>
      </header>
      <p className={styles.day__log__body}>
        {log.segments.map((seg, i) => (
          <Segment
            key={`${log.id}-${i}`}
            segment={seg}
            unlocked={unlocked}
          />
        ))}
      </p>
    </article>
  );
}

/* ── Segment ─────────────────────────────────────────────────────────────────── */

function Segment({
  segment,
  unlocked,
}: {
  segment: LogSegment;
  unlocked: Set<string>;
}) {
  if (segment.type === "text") {
    return <span>{segment.text}</span>;
  }

  const isRevealed = unlocked.has(segment.key);
  const cls = isRevealed
    ? `${styles.day__redaction} ${styles["day__redaction--unlocked"]}`
    : `${styles.day__redaction} ${styles["day__redaction--locked"]}`;

  return (
    <span className={cls}>
      {isRevealed ? segment.text : ""}
    </span>
  );
}
