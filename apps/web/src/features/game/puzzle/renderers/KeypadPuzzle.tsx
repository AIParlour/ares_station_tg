/* ─────────────────────────────────────────────────────────────────────────────
   KeypadPuzzle — Numeric/code entry keypad with dot indicators.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useRef } from "react";
import type { PuzzleRendererProps } from "./types";
import styles from "./KeypadPuzzle.module.css";

interface KeypadData {
  length: number;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⏎"] as const;

export function KeypadPuzzle({
  data,
  alreadySolved,
  feedback,
  onSubmit,
}: PuzzleRendererProps) {
  const { length } = (data as KeypadData) ?? { length: 4 };
  const [digits, setDigits] = useState("");
  const submittedRef = useRef(false);

  const locked = alreadySolved || feedback === "checking" || feedback === "correct";

  /* ── Auto-submit when all dots filled ───────────────────────────────────── */
  useEffect(() => {
    if (digits.length === length && !locked && !submittedRef.current) {
      submittedRef.current = true;
      /* Small delay so user sees the last dot fill before submission */
      const timer = setTimeout(() => onSubmit(digits), 250);
      return () => clearTimeout(timer);
    }
  }, [digits, length, locked, onSubmit]);

  /* ── Clear on wrong feedback ────────────────────────────────────────────── */
  useEffect(() => {
    if (feedback === "wrong") {
      const timer = setTimeout(() => {
        setDigits("");
        submittedRef.current = false;
      }, 800);
      return () => clearTimeout(timer);
    }
    if (feedback === "idle") {
      submittedRef.current = false;
    }
  }, [feedback]);

  /* ── Key handler ────────────────────────────────────────────────────────── */
  const handleKey = useCallback(
    (key: string) => {
      if (locked) return;

      if (key === "C") {
        setDigits("");
        submittedRef.current = false;
        return;
      }

      if (key === "⏎") {
        if (digits.length > 0) onSubmit(digits);
        return;
      }

      /* Digit */
      setDigits((prev) => {
        if (prev.length >= length) return prev;
        return prev + key;
      });
    },
    [locked, digits, length, onSubmit],
  );

  /* ── Determine dot state classes ────────────────────────────────────────── */
  const dotClass = (idx: number) => {
    const filled = idx < digits.length;
    if (feedback === "correct") return `${styles.dot} ${styles["dot--correct"]}`;
    if (feedback === "wrong") return `${styles.dot} ${styles["dot--wrong"]}`;
    if (filled) return `${styles.dot} ${styles["dot--filled"]}`;
    return styles.dot;
  };

  return (
    <div className={styles.root}>
      {/* ── Dot indicators ─────────────────────────────────────────────────── */}
      <div className={styles.root__dots}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className={dotClass(i)} />
        ))}
      </div>

      {/* ── Keypad grid ────────────────────────────────────────────────────── */}
      <div className={styles.root__grid}>
        {KEYS.map((key) => (
          <button
            key={key}
            className={`${styles.root__key} ${
              key === "C" ? styles["root__key--fn"] : ""
            } ${key === "⏎" ? styles["root__key--fn"] : ""}`}
            disabled={locked}
            onClick={() => handleKey(key)}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
