/* ─────────────────────────────────────────────────────────────────────────────
   DocumentScreen — Main day screen.

   Layout:
     1. Paradox system logs (redacted fields auto-reveal as keys are collected)
     2. "Collect seed phrase" section with puzzle buttons
     3. "View Full Log" button — unlocks after all puzzles solved
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen, faFileLines } from "@fortawesome/free-solid-svg-icons";
import type { ParadoxLog, LogSegment } from "../../../shared/types/game";
import styles from "./DocumentScreen.module.css";

export function DocumentScreen() {
  const { state, clearPendingReveal } = useGame();
  const { navigate, goBack } = useRouter();

  /* Snapshot the freshly-unlocked key on mount. After we read it we wipe
     it from the provider so navigating back later won't re-trigger the
     decrypt animation on an already-revealed segment. */
  const [animateKey, setAnimateKey] = useState<string | null>(state.pendingReveal);

  useEffect(() => {
    if (state.pendingReveal) {
      setAnimateKey(state.pendingReveal);
      clearPendingReveal();
    }
  }, [state.pendingReveal, clearPendingReveal]);

  /* Drop the animate flag once the keyframes have finished — keeps the
     segment in its final unlocked styling and prevents the animation from
     replaying on subsequent renders. Total animation length: ~1.6s. */
  useEffect(() => {
    if (!animateKey) return;
    const t = setTimeout(() => setAnimateKey(null), 1700);
    return () => clearTimeout(t);
  }, [animateKey]);

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
                animateKey={animateKey}
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
                  <FontAwesomeIcon icon={solved ? faLockOpen : faLock} />
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
            <FontAwesomeIcon icon={allSolved ? faFileLines : faLock} />
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
  animateKey,
}: {
  log: ParadoxLog;
  unlocked: Set<string>;
  animateKey: string | null;
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
            animateKey={animateKey}
          />
        ))}
      </p>
    </article>
  );
}

/* ── Segment ─────────────────────────────────────────────────────────────────── */

const GLITCH_DURATION_MS = 380;
const GLITCH_CHARS = "█▓▒░@#%&*?!=+/\\<>[]{};:";

function Segment({
  segment,
  unlocked,
  animateKey,
}: {
  segment: LogSegment;
  unlocked: Set<string>;
  animateKey: string | null;
}) {
  if (segment.type === "text") {
    return <span>{segment.text}</span>;
  }

  const isRevealed = unlocked.has(segment.key);
  const isAnimating = isRevealed && animateKey === segment.key;

  if (!isRevealed) {
    return (
      <span className={`${styles.day__redaction} ${styles["day__redaction--locked"]}`} />
    );
  }

  if (isAnimating) {
    return <AnimatedReveal text={segment.text} />;
  }

  return (
    <span className={`${styles.day__redaction} ${styles["day__redaction--unlocked"]}`}>
      {segment.text}
    </span>
  );
}

/* Glitch flash → typewriter reveal. Used once per freshly-decrypted segment. */
function AnimatedReveal({ text }: { text: string }) {
  const [phase, setPhase] = useState<"glitch" | "typing" | "done">("glitch");
  const [glitchText, setGlitchText] = useState("");
  const [typedCount, setTypedCount] = useState(0);

  /* Glitch phase: spew random characters for ~380ms */
  useEffect(() => {
    if (phase !== "glitch") return;
    const interval = window.setInterval(() => {
      let s = "";
      for (let i = 0; i < text.length; i++) {
        s += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      setGlitchText(s);
    }, 45);
    const stop = window.setTimeout(() => {
      window.clearInterval(interval);
      setPhase("typing");
    }, GLITCH_DURATION_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [phase, text]);

  /* Typewriter phase: reveal one character at a time */
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedCount >= text.length) {
      setPhase("done");
      return;
    }
    const t = window.setTimeout(() => setTypedCount((n) => n + 1), 35);
    return () => window.clearTimeout(t);
  }, [phase, typedCount, text]);

  const cls =
    phase === "glitch"
      ? `${styles.day__redaction} ${styles["day__redaction--glitching"]}`
      : `${styles.day__redaction} ${styles["day__redaction--decrypting"]}`;

  if (phase === "glitch") {
    return <span className={cls}>{glitchText}</span>;
  }

  return (
    <span className={cls}>
      {text.slice(0, typedCount)}
      {phase === "typing" && <span className={styles.day__redaction__cursor}>▌</span>}
    </span>
  );
}
