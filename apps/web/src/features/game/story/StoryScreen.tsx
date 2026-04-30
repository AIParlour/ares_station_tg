import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faFolderOpen, faForward } from "@fortawesome/free-solid-svg-icons";
import styles from "./StoryScreen.module.css";

/** Raw document line from the day JSON. Supports text + optional inline redaction. */
interface RawDocLine {
  text: string;
  redact?: { slot: string; placeholder: string; reveal: string };
  rest?: string;
}

/* ── Tunables ────────────────────────────────────────────────────────────────── */

const CHAR_INTERVAL_MS = 16;     // typing speed per character
const PARAGRAPH_PAUSE_MS = 110;  // brief beat between paragraphs
const BREAK_PAUSE_MS = 50;       // pause on blank-line break

/* ── Component ───────────────────────────────────────────────────────────────── */

export function StoryScreen() {
  const { state, completeDay } = useGame();
  const { current, replace } = useRouter();
  const readOnly = current.params?.readOnly === true;

  const [completing, setCompleting] = useState(false);

  if (state.status !== "ready" || !state.day) {
    return (
      <div className={styles.story}>
        <TopBar onBack={() => replace({ name: "home" })} title="LOG" />
        <div className={styles.story__empty}>NO LOG DATA AVAILABLE.</div>
      </div>
    );
  }

  const { day } = state;
  const lines = day.document as RawDocLine[];

  const handleComplete = () => {
    haptic("notification", "success");
    setCompleting(true);
  };

  const handleCompleteFinish = () => {
    completeDay();
    replace({ name: "home" });
  };

  return (
    <div className={styles.story}>
      <Classification level="standard" label={`ARES STATION // SOL ${day.stardate}`} />
      <TopBar onBack={() => replace({ name: "document" })} title={`${day.author.full}`} />

      <div className={styles.story__header}>
        <div className={styles.story__title}>{day.title}</div>
        <div className={styles.story__meta}>
          SOL {day.stardate} — PERSONAL LOG — {day.author.short}
        </div>
      </div>

      <TypewriterBody lines={lines} skip={readOnly} />

      {!readOnly && (
        <div className={styles.story__complete}>
          <button
            className={styles.story__complete__btn}
            onClick={handleComplete}
            disabled={completing}
          >
            <span className={styles.story__complete__icon}><FontAwesomeIcon icon={faFloppyDisk} /></span>
            <span>LOG ARCHIVED — COMPLETE DAY</span>
          </button>
          <div className={styles.story__complete__hint}>
            This log will be saved to your collected documents.
          </div>
        </div>
      )}

      <div className={styles.story__footer}>
        END OF LOG — SOL {day.stardate}
      </div>

      {completing && (
        <DayCompleteOverlay
          stardate={day.stardate}
          title={day.title}
          onFinish={handleCompleteFinish}
        />
      )}
    </div>
  );
}

/* ── Typewriter body ─────────────────────────────────────────────────────────
   Renders the document lines one at a time, character-by-character.
   - Tap anywhere within the body skips the animation and reveals all text.
   - When `skip` is true (e.g. re-reading from the archive), all text is
     rendered immediately on mount.
   ───────────────────────────────────────────────────────────────────────────── */

function TypewriterBody({ lines, skip }: { lines: RawDocLine[]; skip: boolean }) {
  const [lineIndex, setLineIndex] = useState(skip ? lines.length : 0);
  const [chars, setChars] = useState(0);
  const skippedRef = useRef(skip);

  /* Drive the per-character + per-line scheduler */
  useEffect(() => {
    if (skippedRef.current) return;
    if (lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const text = renderLineText(line);

    // Empty line / paragraph break — short pause then advance
    if (!text) {
      const t = window.setTimeout(() => {
        setLineIndex((n) => n + 1);
        setChars(0);
      }, BREAK_PAUSE_MS);
      return () => window.clearTimeout(t);
    }

    // Line complete — pause briefly then advance to next
    if (chars >= text.length) {
      const t = window.setTimeout(() => {
        setLineIndex((n) => n + 1);
        setChars(0);
      }, PARAGRAPH_PAUSE_MS);
      return () => window.clearTimeout(t);
    }

    // Type next character
    const t = window.setTimeout(() => setChars((c) => c + 1), CHAR_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [lineIndex, chars, lines]);

  const handleSkip = useCallback(() => {
    if (skippedRef.current) return;
    if (lineIndex >= lines.length) return;
    skippedRef.current = true;
    setLineIndex(lines.length);
    setChars(0);
    haptic("selection");
  }, [lineIndex, lines.length]);

  const stillTyping = !skippedRef.current && lineIndex < lines.length;

  return (
    <div className={styles.story__body} onClick={handleSkip}>
      {/* Already-revealed lines */}
      {lines.slice(0, lineIndex).map((line, i) => (
        <StoryLine key={i} line={line} />
      ))}

      {/* In-progress line with cursor */}
      {stillTyping && <CurrentLine line={lines[lineIndex]} chars={chars} />}

      {/* Skip hint while typing */}
      {stillTyping && (
        <div className={styles.story__skip__hint}>
          <FontAwesomeIcon icon={faForward} /> TAP TO REVEAL
        </div>
      )}
    </div>
  );
}

function CurrentLine({ line, chars }: { line: RawDocLine; chars: number }) {
  if (!line.text && !line.redact) {
    return <div className={styles.story__break} />;
  }
  const fullText = renderLineText(line);
  const visible = fullText.slice(0, chars);
  return (
    <p className={styles.story__line}>
      {visible}
      <span className={styles.story__cursor}>▌</span>
    </p>
  );
}

function StoryLine({ line }: { line: RawDocLine }) {
  if (!line.text && !line.redact) {
    return <div className={styles.story__break} />;
  }
  if (line.redact) {
    return (
      <p className={styles.story__line}>
        {line.text}{line.redact.reveal}{line.rest ?? ""}
      </p>
    );
  }
  return <p className={styles.story__line}>{line.text}</p>;
}

function renderLineText(line: RawDocLine): string {
  if (!line.text && !line.redact) return "";
  if (line.redact) {
    return `${line.text}${line.redact.reveal}${line.rest ?? ""}`;
  }
  return line.text;
}

/* ── Day Complete Overlay ────────────────────────────────────────────────────
   Full-screen "case file stamped CLASSIFIED and filed" ceremony. Plays once
   when the player taps "LOG ARCHIVED — COMPLETE DAY". After ~2.4s it fires
   `onFinish` which actually mutates state (completeDay + navigate home).
   ───────────────────────────────────────────────────────────────────────────── */

function DayCompleteOverlay({
  stardate,
  title,
  onFinish,
}: {
  stardate: string;
  title: string;
  onFinish: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onFinish, 2400);
    return () => window.clearTimeout(t);
  }, [onFinish]);

  return (
    <div className={styles.story__overlay} role="status" aria-live="polite">
      <div className={styles.story__overlay__panel}>
        <div className={styles.story__overlay__icon}>
          <FontAwesomeIcon icon={faFolderOpen} />
        </div>
        <div className={styles.story__overlay__sol}>SOL {stardate}</div>
        <div className={styles.story__overlay__title}>{title.toUpperCase()}</div>
        <div className={styles.story__overlay__stamp}>CLASSIFIED</div>
        <div className={styles.story__overlay__filed}>FILED — EVIDENCE ARCHIVE</div>
      </div>
    </div>
  );
}
