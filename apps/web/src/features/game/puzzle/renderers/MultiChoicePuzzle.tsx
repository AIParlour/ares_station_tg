/* ─────────────────────────────────────────────────────────────────────────────
   MultiChoicePuzzle — Single-select option list with terminal panel styling.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type { PuzzleRendererProps } from "./types";
import styles from "./MultiChoicePuzzle.module.css";

interface MultiChoiceData {
  options: string[];
}

export function MultiChoicePuzzle({
  data,
  alreadySolved,
  feedback,
  errorMsg,
  onSubmit,
}: PuzzleRendererProps) {
  const { options } = (data as MultiChoiceData) ?? { options: [] };

  const [selected, setSelected] = useState<string | null>(null);

  const locked =
    alreadySolved || feedback === "checking" || feedback === "correct";

  /* ── Deselect on wrong feedback after a flash ────────────────────────────── */
  useEffect(() => {
    if (feedback === "wrong") {
      const timer = setTimeout(() => setSelected(null), 900);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /* ── Select / deselect handler ───────────────────────────────────────────── */
  const handleSelect = useCallback(
    (option: string) => {
      if (locked) return;
      setSelected((prev) => (prev === option ? null : option));
    },
    [locked],
  );

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    if (locked || !selected) return;
    onSubmit(selected);
  };

  /* ── Option class helper ─────────────────────────────────────────────────── */
  const optionClass = (option: string) => {
    const base = styles.root__option;
    const isSel = selected === option;

    if (feedback === "correct" && isSel)
      return `${base} ${styles["root__option--selected"]} ${styles["root__option--correct"]}`;
    if (feedback === "wrong" && isSel)
      return `${base} ${styles["root__option--selected"]} ${styles["root__option--wrong"]}`;
    if (isSel) return `${base} ${styles["root__option--selected"]}`;
    if (locked) return `${base} ${styles["root__option--disabled"]}`;
    return base;
  };

  /* ── Indicator bracket ───────────────────────────────────────────────────── */
  const indicator = (option: string) =>
    selected === option ? "[*]" : "[ ]";

  return (
    <div className={styles.root}>
      {/* ── Option list ─────────────────────────────────────────────────────── */}
      <div className={styles.root__options}>
        {options.map((option) => (
          <button
            key={option}
            className={optionClass(option)}
            disabled={locked}
            onClick={() => handleSelect(option)}
            aria-pressed={selected === option}
          >
            <span className={styles.root__option__indicator}>
              {indicator(option)}
            </span>
            <span className={styles.root__option__text}>{option}</span>
          </button>
        ))}
      </div>

      {/* ── Error message ───────────────────────────────────────────────────── */}
      {errorMsg && feedback === "wrong" && (
        <p className={styles.root__error}>{errorMsg}</p>
      )}

      {/* ── Submit button ───────────────────────────────────────────────────── */}
      <button
        className={styles.root__submit}
        disabled={locked || !selected}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "VERIFYING…"
          : feedback === "correct"
            ? <><FontAwesomeIcon icon={faCircleCheck} /> CONFIRMED</>
            : "CONFIRM"}
      </button>
    </div>
  );
}
