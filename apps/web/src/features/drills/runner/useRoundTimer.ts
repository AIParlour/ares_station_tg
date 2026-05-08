/* ─────────────────────────────────────────────────────────────────────────────
   useRoundTimer — countdown timer for drill rounds.
   - Uses Date.now() for accuracy (RAF can drift if tab is throttled).
   - Fires onExpire once when msLeft hits 0.
   - Pauseable via stop() / start().
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from "react";

interface UseRoundTimerOptions {
  durationMs:    number;
  autoStart?:    boolean;
  onExpire?:     () => void;
}

export interface RoundTimer {
  msLeft:    number;
  isRunning: boolean;
  start:     () => void;
  stop:      () => void;
  reset:     (newDurationMs?: number) => void;
}

export function useRoundTimer(opts: UseRoundTimerOptions): RoundTimer {
  const { durationMs, autoStart = false, onExpire } = opts;

  const [msLeft, setMsLeft]     = useState(durationMs);
  const [isRunning, setRunning] = useState(autoStart);
  const startedAtRef            = useRef<number | null>(null);
  const baselineRef             = useRef<number>(durationMs);
  const expiredRef              = useRef<boolean>(false);

  /* Tick loop — only active when isRunning */
  useEffect(() => {
    if (!isRunning) return;

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    let raf = 0;
    const tick = () => {
      const elapsed   = Date.now() - (startedAtRef.current ?? Date.now());
      const remaining = Math.max(0, baselineRef.current - elapsed);
      setMsLeft(remaining);

      if (remaining <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          setRunning(false);
          onExpire?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, onExpire]);

  const start = useCallback(() => {
    if (expiredRef.current) return;          // can't restart an expired round
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    // Bake remaining time into baseline so resume continues from where we paused
    if (startedAtRef.current !== null) {
      const elapsed = Date.now() - startedAtRef.current;
      baselineRef.current = Math.max(0, baselineRef.current - elapsed);
      startedAtRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback((newDurationMs?: number) => {
    const next = newDurationMs ?? durationMs;
    baselineRef.current = next;
    startedAtRef.current = null;
    expiredRef.current = false;
    setMsLeft(next);
    setRunning(false);
  }, [durationMs]);

  return { msLeft, isRunning, start, stop, reset };
}
