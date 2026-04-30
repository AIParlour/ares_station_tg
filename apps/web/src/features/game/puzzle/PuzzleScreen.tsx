/* ─────────────────────────────────────────────────────────────────────────────
   PuzzleScreen — dispatches to the correct visual renderer based on puzzle type.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { checkPuzzle } from "../../../shared/api/paradox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLockOpen } from "@fortawesome/free-solid-svg-icons";
import type { Puzzle } from "../../../shared/types/game";
import type { PuzzleFeedback } from "./renderers/types";

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

      {/* Full-screen flash overlay on correct answer. */}
      {feedback === "correct" && (
        <div className={styles.puzzle__flash} aria-hidden="true" />
      )}
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
