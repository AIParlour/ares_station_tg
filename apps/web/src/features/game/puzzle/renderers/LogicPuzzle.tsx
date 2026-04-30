/* ─────────────────────────────────────────────────────────────────────────────
   LogicPuzzle — Structured deduction puzzle with scenario, clues, and
   eliminable answer options. Player reads clues, eliminates wrong answers,
   then selects and submits.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleDot, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import type { PuzzleRendererProps } from "./types";
import styles from "./LogicPuzzle.module.css";

interface LogicData {
  scenario: string;
  clues: string[];
  options: string[];
}

function parseLogicData(data: unknown): LogicData {
  const d = data as LogicData;
  return {
    scenario: d?.scenario ?? "",
    clues: d?.clues ?? [],
    options: d?.options ?? [],
  };
}

export function LogicPuzzle({
  data,
  alreadySolved,
  feedback,
  errorMsg,
  onSubmit,
}: PuzzleRendererProps) {
  const { scenario, clues, options } = parseLogicData(data);

  const [selected, setSelected] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());

  const locked =
    alreadySolved || feedback === "checking" || feedback === "correct";

  /* ── Reset selection on wrong answer ──────────────────────────────────────── */
  useEffect(() => {
    if (feedback === "wrong") {
      const timer = setTimeout(() => setSelected(null), 900);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /* ── Select handler (tap to select, tap selected to deselect) ───────────── */
  const handleSelect = useCallback(
    (option: string) => {
      if (locked || eliminated.has(option)) return;
      setSelected((prev) => (prev === option ? null : option));
    },
    [locked, eliminated],
  );

  /* ── Eliminate handler (tap the × button) ────────────────────────────────── */
  const handleEliminate = useCallback(
    (option: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (locked) return;
      setEliminated((prev) => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
        } else {
          next.add(option);
          if (selected === option) setSelected(null);
        }
        return next;
      });
    },
    [locked, selected],
  );

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    if (locked || !selected) return;
    onSubmit(selected);
  };

  /* ── Option class helper ─────────────────────────────────────────────────── */
  const optionClass = (option: string) => {
    const base = styles.option;
    const isSel = selected === option;
    const isElim = eliminated.has(option);

    if (isElim) return `${base} ${styles["option--eliminated"]}`;
    if (feedback === "correct" && isSel)
      return `${base} ${styles["option--selected"]} ${styles["option--correct"]}`;
    if (feedback === "wrong" && isSel)
      return `${base} ${styles["option--selected"]} ${styles["option--wrong"]}`;
    if (isSel) return `${base} ${styles["option--selected"]}`;
    if (locked) return `${base} ${styles["option--disabled"]}`;
    return base;
  };

  return (
    <div className={styles.root}>
      {/* ── Scenario ───────────────────────────────────────────────────────── */}
      <div className={styles.scenario}>
        <div className={styles.scenario__label}>SCENARIO</div>
        <p className={styles.scenario__text}>{scenario}</p>
      </div>

      {/* ── Clues ──────────────────────────────────────────────────────────── */}
      <div className={styles.clues}>
        <div className={styles.clues__label}>EVIDENCE</div>
        {clues.map((clue, i) => (
          <div key={i} className={styles.clue}>
            <span className={styles.clue__num}>{i + 1}.</span>
            <span className={styles.clue__text}>{clue}</span>
          </div>
        ))}
      </div>

      {/* ── Answer options ─────────────────────────────────────────────────── */}
      <div className={styles.options}>
        <div className={styles.options__label}>DEDUCTION</div>
        {options.map((option) => (
          <button
            key={option}
            className={optionClass(option)}
            disabled={locked}
            onClick={() => handleSelect(option)}
            aria-pressed={selected === option}
          >
            <span className={styles.option__indicator}>
              {eliminated.has(option)
                ? "━"
                : selected === option
                  ? <FontAwesomeIcon icon={faCircleDot} />
                  : <FontAwesomeIcon icon={faCircle} />}
            </span>
            <span className={styles.option__text}>{option}</span>
            {!locked && (
              <span
                className={styles.option__elim}
                onClick={(e) => handleEliminate(option, e)}
                role="button"
                tabIndex={-1}
              >
                {eliminated.has(option) ? "↩" : "×"}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {errorMsg && feedback === "wrong" && (
        <p className={styles.error}>{errorMsg}</p>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <button
        className={styles.submit}
        disabled={locked || !selected}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "ANALYSING…"
          : feedback === "correct"
            ? <><FontAwesomeIcon icon={faCircleCheck} /> DEDUCTION CONFIRMED</>
            : "SUBMIT DEDUCTION"}
      </button>
    </div>
  );
}
