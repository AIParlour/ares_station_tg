/* ─────────────────────────────────────────────────────────────────────────────
   CipherWheelPuzzle — Rotatable cipher wheel for decoding encoded messages.
   Two alphabet rows (outer fixed, inner shifted) with arrow controls.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback, useEffect } from "react";
import type { PuzzleRendererProps } from "./types";
import styles from "./CipherWheelPuzzle.module.css";

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface CipherWheelData {
  encoded: string;
  alphabet?: string;
}

function parseCipherData(data: unknown): { encoded: string; alphabet: string } {
  const d = data as CipherWheelData;
  return {
    encoded: d?.encoded ?? "",
    alphabet: d?.alphabet ?? DEFAULT_ALPHABET,
  };
}

function decode(
  encoded: string,
  alphabet: string,
  shift: number,
): string {
  const len = alphabet.length;
  return Array.from(encoded)
    .map((ch) => {
      const upperCh = ch.toUpperCase();
      const idx = alphabet.indexOf(upperCh);
      if (idx === -1) return ch; // non-letter passthrough
      const decoded = alphabet[(idx + shift + len) % len];
      // preserve original case
      return ch === upperCh ? decoded : decoded.toLowerCase();
    })
    .join("");
}

export function CipherWheelPuzzle({
  data,
  alreadySolved,
  feedback,
  onSubmit,
}: PuzzleRendererProps) {
  const { encoded, alphabet } = parseCipherData(data);

  const [shift, setShift] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);

  const locked = alreadySolved || feedback === "checking" || feedback === "correct";

  const decoded = useMemo(
    () => decode(encoded, alphabet, shift),
    [encoded, alphabet, shift],
  );

  /* Build the shifted inner alphabet for display */
  const innerAlphabet = useMemo(() => {
    const len = alphabet.length;
    return Array.from(alphabet).map(
      (_, i) => alphabet[(i + shift + len) % len],
    );
  }, [alphabet, shift]);

  /* Trigger a brief animation class on shift change */
  useEffect(() => {
    if (animDir === null) return;
    const timer = setTimeout(() => setAnimDir(null), 200);
    return () => clearTimeout(timer);
  }, [animDir, shift]);

  const shiftLeft = useCallback(() => {
    if (locked) return;
    setAnimDir("left");
    setShift((s) => ((s - 1) + alphabet.length) % alphabet.length);
  }, [locked, alphabet.length]);

  const shiftRight = useCallback(() => {
    if (locked) return;
    setAnimDir("right");
    setShift((s) => (s + 1) % alphabet.length);
  }, [locked, alphabet.length]);

  const handleSubmit = () => {
    if (locked) return;
    onSubmit(decoded.toUpperCase());
  };

  /* Feedback-driven modifier for decoded text */
  const decodedModifier =
    feedback === "correct"
      ? styles["root__decoded--correct"]
      : feedback === "wrong"
        ? styles["root__decoded--wrong"]
        : "";

  /* Animation modifier for inner row */
  const innerModifier =
    animDir === "left"
      ? styles["root__inner-row--slide-left"]
      : animDir === "right"
        ? styles["root__inner-row--slide-right"]
        : "";

  return (
    <div className={styles.root}>
      {/* ── Wheel display ─────────────────────────────────────────────────── */}
      <div className={styles.root__wheel}>
        {/* Outer row — fixed reference */}
        <div className={styles["root__outer-row"]}>
          {Array.from(alphabet).map((letter, i) => (
            <span key={i} className={styles.root__letter}>
              {letter}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className={styles.root__divider} />

        {/* Inner row — shifts */}
        <div className={`${styles["root__inner-row"]} ${innerModifier}`}>
          {innerAlphabet.map((letter, i) => (
            <span key={i} className={styles["root__letter--inner"]}>
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* ── Shift controls ────────────────────────────────────────────────── */}
      <div className={styles.root__controls}>
        <button
          className={styles.root__arrow}
          onClick={shiftLeft}
          disabled={locked}
          aria-label="Shift left"
        >
          &#9664;
        </button>

        <span className={styles.root__shift}>
          SHIFT: +{shift}
        </span>

        <button
          className={styles.root__arrow}
          onClick={shiftRight}
          disabled={locked}
          aria-label="Shift right"
        >
          &#9654;
        </button>
      </div>

      {/* ── Message display ───────────────────────────────────────────────── */}
      <div className={styles.root__messages}>
        <div className={styles.root__label}>ENCODED</div>
        <div className={styles.root__encoded}>{encoded}</div>

        <div className={styles.root__label}>DECODED</div>
        <div className={`${styles.root__decoded} ${decodedModifier}`}>
          {decoded || "\u00A0"}
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button
        className={styles.root__submit}
        disabled={locked || !decoded.trim()}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "VERIFYING\u2026"
          : feedback === "correct"
            ? "DECRYPTED \u2713"
            : "SUBMIT DECODE"}
      </button>
    </div>
  );
}
