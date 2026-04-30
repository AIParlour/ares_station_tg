/* ─────────────────────────────────────────────────────────────────────────────
   FrequencyTunerPuzzle — Oscilloscope-style frequency tuner for Mars station.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from "react";
import type { PuzzleRendererProps } from "./types";
import styles from "./FrequencyTunerPuzzle.module.css";

interface FrequencyData {
  min: number;
  max: number;
  step: number;
  unit: string;
  target: number;
}

type SignalStrength = "WEAK" | "MODERATE" | "STRONG" | "LOCKED";

function getProximity(value: number, target: number, range: number): number {
  const distance = Math.abs(value - target);
  return Math.max(0, 1 - distance / (range * 0.5));
}

function getSignalStrength(proximity: number, isCorrect: boolean): SignalStrength {
  if (isCorrect) return "LOCKED";
  if (proximity > 0.85) return "STRONG";
  if (proximity > 0.45) return "MODERATE";
  return "WEAK";
}

function getSignalColor(proximity: number): string {
  if (proximity > 0.85) return "#22c55e";
  if (proximity > 0.45) return "#eab308";
  return "#ef4444";
}

export function FrequencyTunerPuzzle({
  alreadySolved,
  feedback,
  errorMsg,
  onSubmit,
  data,
}: PuzzleRendererProps) {
  const { min, max, step, unit, target } = data as FrequencyData;
  const range = max - min;

  const [value, setValue] = useState(() => {
    // Start at midpoint of the range
    const mid = min + range / 2;
    // Snap to step
    return Math.round(mid / step) * step;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const wrongFlashRef = useRef(false);

  const locked =
    alreadySolved || feedback === "checking" || feedback === "correct";
  const isCorrect = alreadySolved || feedback === "correct";
  const proximity = getProximity(value, target, range);
  const strength = getSignalStrength(proximity, isCorrect);
  const color = isCorrect ? "#22c55e" : getSignalColor(proximity);

  // Flash red on wrong answer
  useEffect(() => {
    if (feedback === "wrong") {
      wrongFlashRef.current = true;
      const timer = setTimeout(() => {
        wrongFlashRef.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // ── Waveform rendering ──────────────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    timeRef.current += 0.03;
    const t = timeRef.current;

    // Clear
    ctx.fillStyle = "#0a0f0a";
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines (faint)
    ctx.strokeStyle = "rgba(34, 197, 94, 0.07)";
    ctx.lineWidth = 0.5;
    const gridSpacingY = h / 6;
    for (let gy = gridSpacingY; gy < h; gy += gridSpacingY) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    const gridSpacingX = w / 8;
    for (let gx = gridSpacingX; gx < w; gx += gridSpacingX) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    // Determine noise level based on proximity
    const currentProx = isCorrect ? 1 : getProximity(value, target, range);
    const noiseLevel = wrongFlashRef.current ? 1.0 : 1 - currentProx;

    // Determine draw color
    let drawColor: string;
    if (wrongFlashRef.current) {
      drawColor = "#ef4444";
    } else if (isCorrect) {
      drawColor = "#22c55e";
    } else {
      drawColor = getSignalColor(currentProx);
    }

    // Draw the waveform — primary sine + noise harmonics
    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = drawColor;
    ctx.shadowBlur = 6;

    const midY = h / 2;
    const amplitude = h * 0.3;

    for (let x = 0; x < w; x++) {
      const xNorm = x / w;

      // Base sine wave
      let y = Math.sin(xNorm * Math.PI * 4 + t * 2) * amplitude;

      // Add noise harmonics proportional to distance from target
      if (noiseLevel > 0.01) {
        y +=
          Math.sin(xNorm * Math.PI * 11 + t * 5.3) *
          amplitude *
          0.4 *
          noiseLevel;
        y +=
          Math.sin(xNorm * Math.PI * 23 + t * 8.7) *
          amplitude *
          0.25 *
          noiseLevel;
        y +=
          (Math.random() - 0.5) * amplitude * 0.5 * noiseLevel;
      }

      // Subtle drift even when locked
      y += Math.sin(xNorm * Math.PI * 2 + t * 0.7) * amplitude * 0.03;

      const py = midY + y;

      if (x === 0) {
        ctx.moveTo(x, py);
      } else {
        ctx.lineTo(x, py);
      }
    }
    ctx.stroke();

    // Second trace (dimmer ghost)
    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 2;

    for (let x = 0; x < w; x++) {
      const xNorm = x / w;
      let y = Math.sin(xNorm * Math.PI * 4 + t * 2 + 0.3) * amplitude * 0.85;

      if (noiseLevel > 0.01) {
        y +=
          Math.sin(xNorm * Math.PI * 13 + t * 4.1) *
          amplitude *
          0.3 *
          noiseLevel;
        y += (Math.random() - 0.5) * amplitude * 0.3 * noiseLevel;
      }

      const py = midY + y;
      if (x === 0) {
        ctx.moveTo(x, py);
      } else {
        ctx.lineTo(x, py);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, [value, target, range, isCorrect]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawWaveform);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawWaveform]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    setValue(parseFloat(e.target.value));
  };

  const handleSubmit = () => {
    if (locked) return;
    onSubmit(String(value));
  };

  // Format value for digital readout
  const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 1 : 0;
  const displayValue = value.toFixed(decimals);

  return (
    <div className={styles.root}>
      {/* ── Waveform display ─────────────────────────────────────────────────── */}
      <div
        className={`${styles.root__scope} ${isCorrect ? styles["root__scope--locked"] : ""} ${feedback === "wrong" ? styles["root__scope--wrong"] : ""}`}
      >
        <canvas ref={canvasRef} className={styles.root__canvas} />
        <span className={styles.root__scopeLabel}>SIGNAL ANALYSIS</span>
      </div>

      {/* ── Signal strength indicator ────────────────────────────────────────── */}
      <div className={styles.root__strength}>
        <span className={styles.root__strengthLabel}>SIGNAL</span>
        <div className={styles.root__strengthBar}>
          <div
            className={styles.root__strengthFill}
            style={{
              width: `${isCorrect ? 100 : proximity * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span
          className={styles.root__strengthText}
          style={{ color }}
        >
          {strength}
        </span>
      </div>

      {/* ── Digital readout ───────────────────────────────────────────────────── */}
      <div className={styles.root__readout} style={{ borderColor: color }}>
        <span className={styles.root__readoutValue} style={{ color }}>
          {displayValue}
        </span>
        <span className={styles.root__readoutUnit}>{unit}</span>
      </div>

      {/* ── Slider ────────────────────────────────────────────────────────────── */}
      <div className={styles.root__sliderWrap}>
        <span className={styles.root__sliderMin}>
          {min} {unit}
        </span>
        <input
          type="range"
          className={styles.root__slider}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={locked}
          onChange={handleSliderChange}
          style={
            {
              "--slider-color": color,
              "--slider-progress": `${((value - min) / range) * 100}%`,
            } as React.CSSProperties
          }
        />
        <span className={styles.root__sliderMax}>
          {max} {unit}
        </span>
      </div>

      {/* ── Error message ─────────────────────────────────────────────────────── */}
      {feedback === "wrong" && errorMsg && (
        <p className={styles.root__error}>{errorMsg}</p>
      )}

      {/* ── Submit button ─────────────────────────────────────────────────────── */}
      <button
        className={`${styles.root__submit} ${isCorrect ? styles["root__submit--correct"] : ""}`}
        disabled={locked}
        onClick={handleSubmit}
      >
        {feedback === "checking"
          ? "ANALYZING…"
          : isCorrect
            ? "FREQUENCY LOCKED ✓"
            : "LOCK FREQUENCY"}
      </button>
    </div>
  );
}
