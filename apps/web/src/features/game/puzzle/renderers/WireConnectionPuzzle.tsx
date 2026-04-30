/* ─────────────────────────────────────────────────────────────────────────────
   WireConnectionPuzzle — Connect left items to right items with wires.
   Mars station terminal aesthetic.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleRendererProps } from "./types";
import styles from "./WireConnectionPuzzle.module.css";

/* ── Data shape ─────────────────────────────────────────────────────────────── */

interface WireData {
  left: string[];
  right: string[];
}

function isWireData(d: unknown): d is WireData {
  if (!d || typeof d !== "object") return false;
  const obj = d as Record<string, unknown>;
  return Array.isArray(obj.left) && Array.isArray(obj.right);
}

/* ── Selection state ────────────────────────────────────────────────────────── */

type Selection =
  | null
  | { side: "left"; index: number }
  | { side: "right"; index: number };

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function cls(...names: (string | false | undefined | null)[]): string {
  return names.filter(Boolean).join(" ");
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export function WireConnectionPuzzle({
  data,
  alreadySolved,
  feedback,
  onSubmit,
}: PuzzleRendererProps) {
  const wireData = isWireData(data) ? data : { left: [], right: [] };
  const { left, right } = wireData;

  // connections: Map<leftIndex, rightIndex>
  const [connections, setConnections] = useState<Map<number, number>>(
    () => new Map(),
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [wrongFlash, setWrongFlash] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [wireCoords, setWireCoords] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);

  const locked =
    alreadySolved || feedback === "checking" || feedback === "correct";

  /* ── Recalculate wire coordinates ─────────────────────────────────────────── */

  const recalcWires = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();

    const coords: { x1: number; y1: number; x2: number; y2: number }[] = [];

    connections.forEach((ri, li) => {
      const lEl = leftRefs.current[li];
      const rEl = rightRefs.current[ri];
      if (!lEl || !rEl) return;

      const lRect = lEl.getBoundingClientRect();
      const rRect = rEl.getBoundingClientRect();

      coords.push({
        x1: lRect.right - rect.left,
        y1: lRect.top + lRect.height / 2 - rect.top,
        x2: rRect.left - rect.left,
        y2: rRect.top + rRect.height / 2 - rect.top,
      });
    });

    setWireCoords(coords);
  }, [connections]);

  useEffect(() => {
    recalcWires();
  }, [recalcWires]);

  // Recalc on resize
  useEffect(() => {
    const handler = () => recalcWires();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [recalcWires]);

  /* ── Wrong-answer flash: disconnect after animation ───────────────────────── */

  useEffect(() => {
    if (feedback === "wrong") {
      setWrongFlash(true);
      const timer = setTimeout(() => {
        setWrongFlash(false);
        setConnections(new Map());
        setSelection(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /* ── Tap handlers ─────────────────────────────────────────────────────────── */

  const handleTap = (side: "left" | "right", index: number) => {
    if (locked) return;

    // If tapping a connected item, disconnect it
    if (side === "left" && connections.has(index)) {
      setConnections((prev) => {
        const next = new Map(prev);
        next.delete(index);
        return next;
      });
      setSelection(null);
      return;
    }
    if (side === "right") {
      // Check if this right index is connected to some left
      let connectedLeft: number | null = null;
      connections.forEach((ri, li) => {
        if (ri === index) connectedLeft = li;
      });
      if (connectedLeft !== null) {
        setConnections((prev) => {
          const next = new Map(prev);
          next.delete(connectedLeft!);
          return next;
        });
        setSelection(null);
        return;
      }
    }

    // Nothing selected yet — select this item
    if (!selection) {
      setSelection({ side, index });
      return;
    }

    // Same side — switch selection
    if (selection.side === side) {
      setSelection({ side, index });
      return;
    }

    // Opposite side — create connection
    const li = side === "left" ? index : selection.index;
    const ri = side === "right" ? index : selection.index;

    setConnections((prev) => {
      const next = new Map(prev);
      // Remove any existing connection for either index
      next.delete(li);
      prev.forEach((rVal, lKey) => {
        if (rVal === ri) next.delete(lKey);
      });
      next.set(li, ri);
      return next;
    });
    setSelection(null);
  };

  /* ── Submit ───────────────────────────────────────────────────────────────── */

  const allConnected = connections.size === left.length;

  const handleSubmit = () => {
    if (!allConnected || locked) return;

    // Build answer: right item values in order of left indices, comma-separated
    const answer = left
      .map((_, li) => right[connections.get(li)!])
      .join(",");
    onSubmit(answer);
  };

  /* ── Item class builder ───────────────────────────────────────────────────── */

  const itemClass = (side: "left" | "right", index: number) => {
    const isSelected =
      selection?.side === side && selection.index === index;

    let isConnected = false;
    if (side === "left") {
      isConnected = connections.has(index);
    } else {
      connections.forEach((ri) => {
        if (ri === index) isConnected = true;
      });
    }

    return cls(
      styles.root__item,
      isConnected && styles["root__item--connected"],
      isSelected && styles["root__item--selected"],
      feedback === "correct" && isConnected && styles["root__item--correct"],
      wrongFlash && isConnected && styles["root__item--wrong"],
      locked && styles["root__item--disabled"],
    );
  };

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.root}>
      <div className={styles.root__board} ref={boardRef}>
        {/* SVG wire overlay */}
        <svg className={styles.root__board__svg}>
          {wireCoords.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              className={cls(
                styles.root__wire,
                feedback === "correct" && styles["root__wire--correct"],
                wrongFlash && styles["root__wire--wrong"],
              )}
            />
          ))}
        </svg>

        {/* Left column */}
        <div
          className={cls(styles.root__column, styles["root__column--left"])}
        >
          {left.map((label, i) => (
            <button
              key={i}
              ref={(el) => { leftRefs.current[i] = el; }}
              className={itemClass("left", i)}
              onClick={() => handleTap("left", i)}
              type="button"
            >
              <span>{label}</span>
              <span className={styles.root__item__dot} />
            </button>
          ))}
        </div>

        {/* Right column */}
        <div
          className={cls(styles.root__column, styles["root__column--right"])}
        >
          {right.map((label, i) => (
            <button
              key={i}
              ref={(el) => { rightRefs.current[i] = el; }}
              className={itemClass("right", i)}
              onClick={() => handleTap("right", i)}
              type="button"
            >
              <span className={styles.root__item__dot} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        className={styles.root__submit}
        disabled={!allConnected || locked}
        onClick={handleSubmit}
        type="button"
      >
        {feedback === "checking"
          ? "VERIFYING\u2026"
          : feedback === "correct"
            ? "CONNECTIONS VERIFIED \u2713"
            : "VERIFY CONNECTIONS"}
      </button>
    </div>
  );
}
