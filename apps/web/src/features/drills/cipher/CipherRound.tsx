/* ─────────────────────────────────────────────────────────────────────────────
   CipherRound — single substitution-cipher puzzle.

   Layout (top → bottom):
     [ KEY: two-row alphabet strip — PLAIN over CIPHER ]
     [ CIPHERTEXT block ]
     [ ↓ ]
     [ DECODED label + input ]
     [ SKIP / SUBMIT ]

   The cipher cells corresponding to letters that appear in the current
   ciphertext are highlighted to draw the player's eye to the relevant
   substitutions. The same key is used for every puzzle in the round
   (set by the parent screen) — the player benefits from learning it.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import { haptic } from "../../../shared/hooks/useTelegram";
import {
  normalizeAnswer,
  uniqueCipherLetters,
  type CipherPuzzle,
  type SubCipherKey,
} from "./cipherGen";
import styles from "./CipherRound.module.css";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface CipherRoundProps {
  puzzle:    CipherPuzzle;
  cipherKey: SubCipherKey;
  onCorrect: () => void;
  onSkip:    () => void;
  /** When true, input is disabled (e.g. timer expired). */
  frozen?:   boolean;
}

export function CipherRound({
  puzzle,
  cipherKey,
  onCorrect,
  onSkip,
  frozen,
}: CipherRoundProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const inputRef          = useRef<HTMLInputElement>(null);

  /* Reset state on each new puzzle */
  useEffect(() => {
    setValue("");
    setShake(false);
    setFlash(false);
    inputRef.current?.focus();
  }, [puzzle]);

  /* Cipher letters that appear in this ciphertext — used to highlight key cells */
  const highlighted = useMemo(
    () => new Set(uniqueCipherLetters(puzzle.ciphertext)),
    [puzzle.ciphertext]
  );

  const submit = () => {
    if (frozen || !value.trim()) return;
    if (normalizeAnswer(value) === puzzle.plaintext) {
      haptic("notification", "success");
      setFlash(true);
      window.setTimeout(() => onCorrect(), 140);
    } else {
      haptic("notification", "error");
      setShake(true);
      window.setTimeout(() => setShake(false), 280);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className={`${styles.round} ${flash ? styles["round--correct"] : ""}`}>
      {/* ── Key strip ────────────────────────────────────────────────────────── */}
      <div className={styles.key} aria-label="Substitution key">
        <div className={styles.key__rowLabel}>PLAIN</div>
        <div className={styles.key__row}>
          {ALPHA.split("").map((p) => (
            <div key={`p-${p}`} className={styles.key__cellPlain}>{p}</div>
          ))}
        </div>
        <div className={styles.key__rowLabel}>CIPHER</div>
        <div className={styles.key__row}>
          {ALPHA.split("").map((p) => {
            const c = cipherKey.forward[p];
            const hit = highlighted.has(c);
            return (
              <div
                key={`c-${p}`}
                className={`${styles.key__cellCipher} ${hit ? styles["key__cellCipher--hit"] : ""}`}
              >
                {c}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cipher prompt ───────────────────────────────────────────────────── */}
      <div className={styles.round__hint}>DECODE THE TRANSMISSION</div>

      <div className={`${styles.round__cipher} ${shake ? styles["round__cipher--shake"] : ""}`}>
        {puzzle.ciphertext}
      </div>

      <div className={styles.round__arrow}>↓</div>
      <div className={styles.round__plain__label}>DECODED</div>

      <input
        ref={inputRef}
        className={styles.round__input}
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="TYPE PLAINTEXT"
        value={value}
        disabled={!!frozen}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.round__actions}>
        <button
          className={styles.round__skip}
          onClick={onSkip}
          disabled={!!frozen}
          aria-label="Skip puzzle"
        >
          SKIP
        </button>
        <button
          className={styles.round__submit}
          onClick={submit}
          disabled={!!frozen || !value.trim()}
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
}
