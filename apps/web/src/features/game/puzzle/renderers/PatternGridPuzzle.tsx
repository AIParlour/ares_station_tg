/* ─────────────────────────────────────────────────────────────────────────────
   PatternGridPuzzle — Toggle cells on a grid to form a pattern answer.
   ───────────────────────────────────────────────────────────────────────────── */

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type { PuzzleRendererProps } from "./types";
import styles from "./PatternGridPuzzle.module.css";

interface PatternGridData {
  rows: number;
  cols: number;
  clue?: string;
}

/** Convert 0-based column index to letter: 0 → A, 1 → B, … */
const colLabel = (c: number): string => String.fromCharCode(65 + c);

/** Build a sorted answer string from the active cell set. */
const buildAnswer = (active: Set<string>): string =>
  Array.from(active)
    .sort((a, b) => a.localeCompare(b))
    .join(",");

export function PatternGridPuzzle({
  data,
  alreadySolved,
  feedback,
  errorMsg,
  onSubmit,
}: PuzzleRendererProps) {
  const { rows, cols, clue } = (data as PatternGridData) ?? { rows: 4, cols: 4 };

  /* ── Active cells stored as "A1", "B3", etc. ─────────────────────────────── */
  const [active, setActive] = useState<Set<string>>(new Set());

  const locked =
    alreadySolved || feedback === "checking" || feedback === "correct";

  /* ── Clear grid on wrong feedback after a brief flash ────────────────────── */
  useEffect(() => {
    if (feedback === "wrong") {
      const timer = setTimeout(() => setActive(new Set()), 900);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /* ── Toggle handler ──────────────────────────────────────────────────────── */
  const toggle = useCallback(
    (id: string) => {
      if (locked) return;
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [locked],
  );

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    if (locked || active.size === 0) return;
    onSubmit(buildAnswer(active));
  };

  /* ── Cell class helper ───────────────────────────────────────────────────── */
  const cellClass = useCallback(
    (id: string) => {
      const on = active.has(id);
      const base = styles.root__cell;

      if (feedback === "correct" && on)
        return `${base} ${styles["root__cell--active"]} ${styles["root__cell--correct"]}`;
      if (feedback === "wrong" && on)
        return `${base} ${styles["root__cell--active"]} ${styles["root__cell--wrong"]}`;
      if (on) return `${base} ${styles["root__cell--active"]}`;
      return base;
    },
    [active, feedback],
  );

  /* ── Pre-compute column headers ──────────────────────────────────────────── */
  const colHeaders = useMemo(
    () => Array.from({ length: cols }, (_, c) => colLabel(c)),
    [cols],
  );

  return (
    <div className={styles.root}>
      {/* ── Optional clue ───────────────────────────────────────────────────── */}
      {clue && <p className={styles.root__clue}>{clue}</p>}

      {/* ── Grid wrapper (labels + cells) ───────────────────────────────────── */}
      <div
        className={styles.root__grid}
        style={{ "--grid-cols": cols } as React.CSSProperties}
      >
        {/* Corner spacer */}
        <span className={styles.root__corner} />

        {/* Column headers */}
        {colHeaders.map((letter) => (
          <span key={letter} className={styles.root__colLabel}>
            {letter}
          </span>
        ))}

        {/* Rows: row label + cells */}
        {Array.from({ length: rows }, (_, r) => {
          const rowNum = r + 1;
          return (
            <Fragment key={r}>
              <span className={styles.root__rowLabel}>{rowNum}</span>
              {Array.from({ length: cols }, (_, c) => {
                const id = `${colLabel(c)}${rowNum}`;
                return (
                  <button
                    key={id}
                    className={cellClass(id)}
                    disabled={locked}
                    onClick={() => toggle(id)}
                    aria-label={`Cell ${id}`}
                    aria-pressed={active.has(id)}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>

      {/* ── Error message ───────────────────────────────────────────────────── */}
      {errorMsg && feedback === "wrong" && (
        <p className={styles.root__error}>{errorMsg}</p>
      )}

      {/* ── Submit button ───────────────────────────────────────────────────── */}
      <button
        className={styles.root__submit}
        disabled={locked || active.size === 0}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "ANALYSING…"
          : feedback === "correct"
            ? <><FontAwesomeIcon icon={faCircleCheck} /> PATTERN ACCEPTED</>
            : "SUBMIT PATTERN"}
      </button>
    </div>
  );
}
