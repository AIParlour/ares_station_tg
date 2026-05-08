/* ─────────────────────────────────────────────────────────────────────────────
   PuzzleScreen — dispatches to the correct visual renderer based on puzzle type.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { checkPuzzle, purchaseHint } from "../../../shared/api/paradox";
import { fetchProgress } from "../../../shared/api/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLockOpen, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import type { Puzzle } from "../../../shared/types/game";
import type { PuzzleFeedback } from "./renderers/types";

const FULL_DECRYPT_COST = 50;

/* ── Renderers ───────────────────────────────────────────────────────────────── */
import { KeypadPuzzle }       from "./renderers/KeypadPuzzle";
import { CipherWheelPuzzle }  from "./renderers/CipherWheelPuzzle";
import { WireConnectionPuzzle } from "./renderers/WireConnectionPuzzle";
import { FrequencyTunerPuzzle } from "./renderers/FrequencyTunerPuzzle";
import { PatternGridPuzzle }  from "./renderers/PatternGridPuzzle";
import { MultiChoicePuzzle }  from "./renderers/MultiChoicePuzzle";
import { LogicPuzzle }        from "./renderers/LogicPuzzle";
import { TextInputPuzzle }    from "./renderers/TextInputPuzzle";

import styles from "./PuzzleScreen.module.css";

/* ── Type → Label mapping ────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  keypad:       "CODE ENTRY",
  cipher_wheel: "SIGNAL DECODE",
  wire:         "SYSTEM LINK",
  frequency:    "FREQUENCY SCAN",
  pattern_grid: "PATTERN MATCH",
  multi_choice: "DATA ANALYSIS",
  logic:        "LOGIC ANALYSIS",
  // Legacy types
  riddle:       "RIDDLE",
  math:         "DATA AUDIT",
  cipher:       "SIGNAL DECODE",
  wordplay:     "LINGUISTIC",
  sequence:     "PROCEDURE CHECK",
};

/* ── Main Screen ─────────────────────────────────────────────────────────────── */

export function PuzzleScreen() {
  const { state, solvePuzzle } = useGame();
  const { current, goBack } = useRouter();
  const slot = (current.params?.slot as string) ?? "";

  const puzzle = state.day?.puzzles.find((p) => p.slot === slot) ?? null;
  const alreadySolved = state.solved[slot] ?? false;

  if (!puzzle) {
    return (
      <div className={styles.puzzle}>
        <TopBar onBack={goBack} title="PUZZLE NOT FOUND" />
      </div>
    );
  }

  return (
    <PuzzleActive
      puzzle={puzzle}
      dayId={state.day!.dayId}
      alreadySolved={alreadySolved}
      onSolve={(word) => solvePuzzle(slot, word)}
      onBack={goBack}
    />
  );
}

/* ── Active Puzzle Wrapper ───────────────────────────────────────────────────── */

interface PuzzleActiveProps {
  puzzle: Puzzle;
  dayId: string;
  alreadySolved: boolean;
  onSolve: (unlockWord: string) => void;
  onBack: () => void;
}

function PuzzleActive({ puzzle, dayId, alreadySolved, onSolve, onBack }: PuzzleActiveProps) {
  const [feedback, setFeedback] = useState<PuzzleFeedback>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Hint state
  const [balance, setBalance]       = useState<number | null>(null);
  const [hintOpen, setHintOpen]     = useState(false);
  const [hintBusy, setHintBusy]     = useState(false);
  const [hintError, setHintError]   = useState<string | null>(null);

  // Fetch balance once when this puzzle mounts (not yet solved).
  useEffect(() => {
    if (alreadySolved) return;
    let cancelled = false;
    fetchProgress()
      .then((res) => { if (!cancelled) setBalance(res.player.balance); })
      .catch(() => { /* tolerated — UI just disables the hint button */ });
    return () => { cancelled = true; };
  }, [alreadySolved]);

  const handleSubmit = async (answer: string) => {
    if (!answer.trim()) return;
    setFeedback("checking");
    haptic("impact", "light");

    try {
      const res = await checkPuzzle(dayId, puzzle.slot, answer.trim().toUpperCase());
      if (res.correct) {
        setFeedback("correct");
        haptic("notification", "success");
        onSolve(res.unlockWord ?? "");
        setTimeout(onBack, 1400);
      } else {
        setFeedback("wrong");
        setErrorMsg(res.hint ?? "INCORRECT. REVIEW SIGNAL.");
        haptic("notification", "error");
      }
    } catch {
      setFeedback("wrong");
      setErrorMsg("SYSTEM UNREACHABLE. TRY AGAIN.");
      haptic("notification", "error");
    }
  };

  const handleConfirmHint = async () => {
    if (hintBusy) return;
    setHintBusy(true);
    setHintError(null);
    try {
      const res = await purchaseHint(dayId, puzzle.slot, "full_decrypt");
      // Treat exactly like a normal correct solve: trigger animation, hand
      // the unlock word back to the GameProvider, and navigate back.
      setBalance(res.newBalance);
      setHintOpen(false);
      setFeedback("correct");
      haptic("notification", "success");
      onSolve(res.unlockWord);
      setTimeout(onBack, 1400);
    } catch (e) {
      setHintError(e instanceof Error ? e.message : "Hint purchase failed");
    } finally {
      setHintBusy(false);
    }
  };

  const label = TYPE_LABELS[puzzle.type] ?? puzzle.type.toUpperCase();

  const rendererProps = {
    prompt: puzzle.prompt,
    data: puzzle.data,
    alreadySolved,
    feedback,
    errorMsg,
    onSubmit: handleSubmit,
  };

  const wrapperClass = `${styles.puzzle} ${
    feedback === "correct" ? styles["puzzle--solved-flash"] : ""
  }`;

  return (
    <div className={wrapperClass}>
      <Classification level="standard" label={`STATION PUZZLE // ${label}`} />
      <TopBar onBack={onBack} title={puzzle.title ?? label} />

      {alreadySolved && (
        <div className={styles.puzzle__solved}><FontAwesomeIcon icon={faLockOpen} /> ALREADY DECRYPTED</div>
      )}

      <div className={styles.puzzle__prompt}>{puzzle.prompt}</div>

      <div className={styles.puzzle__renderer}>
        <PuzzleRenderer type={puzzle.type} {...rendererProps} />
      </div>

      {feedback === "wrong" && (
        <div className={styles.puzzle__feedback__wrong}>{errorMsg}</div>
      )}

      {feedback === "correct" && (
        <div className={styles.puzzle__feedback__correct}>
          SIGNAL DECRYPTED // KEY RECORDED
        </div>
      )}

      {/* Hint affordance — only shown while the puzzle is still active. */}
      {!alreadySolved && feedback !== "correct" && feedback !== "checking" && (
        <button
          className={styles.puzzle__stuck}
          onClick={() => { haptic("selection"); setHintOpen(true); }}
        >
          <FontAwesomeIcon icon={faCircleQuestion} /> STUCK? · DECRYPTION AID
        </button>
      )}

      {hintOpen && (
        <HintModal
          balance={balance}
          busy={hintBusy}
          error={hintError}
          onConfirm={handleConfirmHint}
          onCancel={() => { if (!hintBusy) { setHintOpen(false); setHintError(null); } }}
        />
      )}

      {/* Full-screen flash overlay on correct answer. */}
      {feedback === "correct" && (
        <div className={styles.puzzle__flash} aria-hidden="true" />
      )}
    </div>
  );
}

/* ── Hint Modal ──────────────────────────────────────────────────────────────── */

interface HintModalProps {
  balance: number | null;
  busy:    boolean;
  error:   string | null;
  onConfirm: () => void;
  onCancel:  () => void;
}

function HintModal({ balance, busy, error, onConfirm, onCancel }: HintModalProps) {
  const insufficient = balance !== null && balance < FULL_DECRYPT_COST;
  return (
    <div className={styles.hint__backdrop} role="dialog" aria-modal="true">
      <div className={styles.hint__sheet}>
        <div className={styles.hint__title}>DECRYPTION AID</div>

        <div className={styles.hint__balanceRow}>
          <span className={styles.hint__balanceLabel}>BALANCE</span>
          <span className={styles.hint__balanceValue}>
            {balance === null ? "···" : `${balance} ⬡`}
          </span>
        </div>

        <div className={styles.hint__option}>
          <div className={styles.hint__option__label}>FULL DECRYPT</div>
          <div className={styles.hint__option__sub}>Reveals the answer and continues.</div>
          <div className={styles.hint__option__cost}>{FULL_DECRYPT_COST} ⬡</div>
        </div>

        {error && (
          <div className={styles.hint__error}>
            {error}
          </div>
        )}

        <div className={styles.hint__actions}>
          <button
            className={styles.hint__btnGhost}
            onClick={onCancel}
            disabled={busy}
          >
            CANCEL
          </button>
          <button
            className={styles.hint__btnPrimary}
            onClick={onConfirm}
            disabled={busy || balance === null || insufficient}
          >
            {busy ? "DECRYPTING…" : insufficient ? "INSUFFICIENT ⬡" : `DECRYPT · ${FULL_DECRYPT_COST} ⬡`}
          </button>
        </div>

        {insufficient && (
          <div className={styles.hint__earnHint}>
            EARN ⬡ IN OPERATOR DRILLS
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Renderer Dispatch ───────────────────────────────────────────────────────── */

function PuzzleRenderer(props: { type: string } & Parameters<typeof KeypadPuzzle>[0]) {
  const { type, ...rest } = props;

  switch (type) {
    case "keypad":       return <KeypadPuzzle {...rest} />;
    case "cipher_wheel": return <CipherWheelPuzzle {...rest} />;
    case "wire":         return <WireConnectionPuzzle {...rest} />;
    case "frequency":    return <FrequencyTunerPuzzle {...rest} />;
    case "pattern_grid": return <PatternGridPuzzle {...rest} />;
    case "multi_choice": return <MultiChoicePuzzle {...rest} />;
    case "logic":        return <LogicPuzzle {...rest} />;
    default:             return <TextInputPuzzle {...rest} />;
  }
}
