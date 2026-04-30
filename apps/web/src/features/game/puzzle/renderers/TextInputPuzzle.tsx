/* ─────────────────────────────────────────────────────────────────────────────
   TextInputPuzzle — Legacy fallback renderer for free-text puzzle answers.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { PuzzleRendererProps } from "./types";
import styles from "./TextInputPuzzle.module.css";

export function TextInputPuzzle({
  alreadySolved,
  feedback,
  onSubmit,
}: PuzzleRendererProps) {
  const [value, setValue] = useState("");

  const locked = alreadySolved || feedback === "checking" || feedback === "correct";

  const handleSubmit = () => {
    if (locked || !value.trim()) return;
    onSubmit(value.trim().toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className={styles.root}>
      <input
        className={styles.root__input}
        type="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="ENTER ANSWER"
        value={value}
        disabled={locked}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
      />

      <button
        className={styles.root__submit}
        disabled={locked || !value.trim()}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "VERIFYING…"
          : feedback === "correct"
            ? "DECRYPTED ✓"
            : "SUBMIT"}
      </button>
    </div>
  );
}
