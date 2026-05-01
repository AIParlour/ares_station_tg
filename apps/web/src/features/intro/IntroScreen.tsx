/* ─────────────────────────────────────────────────────────────────────────────
   IntroScreen — first-time-only cold open.

   Story beats (driven by CSS keyframe delays on a single SVG scene):
     1. Stars fade in over black
     2. Mars horizon rises from below
     3. Shuttle streaks down toward the surface, leaving a faint trail
     4. Station outline (3 modules + connecting corridors) draws itself
     5. Internal lights flicker on, one cluster at a time
     6. Paradox cold-open text types in line by line

   Skippable on tap. After completion (or skip) we set the
   `ares_intro_seen` flag in localStorage and navigate to home.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "../../app/Router";
import { haptic } from "../../shared/hooks/useTelegram";
import styles from "./IntroScreen.module.css";

export const INTRO_SEEN_KEY = "ares_intro_seen";

export function hasSeenIntro(): boolean {
  try { return localStorage.getItem(INTRO_SEEN_KEY) === "1"; }
  catch { return false; }
}

function markIntroSeen() {
  try { localStorage.setItem(INTRO_SEEN_KEY, "1"); }
  catch { /* noop */ }
}

/* ── Cold-open dialogue ──────────────────────────────────────────────────────
   Voice: Paradox v4.1 — clinical, passive, slightly off. Each line shows
   for ~2.4s with a brief overlap so the reading rhythm feels relentless.
   ───────────────────────────────────────────────────────────────────────────── */

const COLD_OPEN_LINES = [
  "PARADOX v4.1 // SECONDARY UPLINK ESTABLISHED",
  "A shuttle has been detected on approach vector 7-ALPHA.",
  "Approach coordinates were transmitted. Coordinates were corrupted in transit.",
  "Impact at coordinates 4.2°N, 137.4°E.",
  "Welcome to Ares Station.",
  "Communication with Earth is currently unavailable.",
  "You are the first human to enter this facility in 14 years.",
  "All communications will be logged per Directive 7-C.",
];

const TOTAL_DURATION_MS = 18000;

export function IntroScreen() {
  const { replace } = useRouter();
  const [textIndex, setTextIndex] = useState(0);

  const finish = useCallback(() => {
    markIntroSeen();
    haptic("impact", "medium");
    replace({ name: "home" });
  }, [replace]);

  /* Walk the cold-open lines forward; the first line shows after the
     station + lights settle (~5.5s in). */
  useEffect(() => {
    const start = window.setTimeout(() => setTextIndex(1), 5400);
    return () => window.clearTimeout(start);
  }, []);

  useEffect(() => {
    if (textIndex === 0) return;
    if (textIndex >= COLD_OPEN_LINES.length) return;
    const t = window.setTimeout(() => setTextIndex((i) => i + 1), 1700);
    return () => window.clearTimeout(t);
  }, [textIndex]);

  /* Auto-advance to home after the full sequence completes */
  useEffect(() => {
    const t = window.setTimeout(finish, TOTAL_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [finish]);

  return (
    <div className={styles.intro} onClick={finish} role="button" tabIndex={0}>
      <IntroScene />

      <div className={styles.intro__text}>
        {COLD_OPEN_LINES.slice(0, textIndex).map((line, i) => (
          <p
            key={i}
            className={
              i === textIndex - 1
                ? `${styles.intro__line} ${styles["intro__line--current"]}`
                : styles.intro__line
            }
          >
            {line}
          </p>
        ))}
      </div>

      <div className={styles.intro__skip}>TAP TO SKIP</div>
    </div>
  );
}

/* ── Scene SVG ──────────────────────────────────────────────────────────────
   All animation is CSS keyframes keyed off animation-delay. No JS-driven
   frames — the timeline is purely declarative.
   ───────────────────────────────────────────────────────────────────────────── */

function IntroScene() {
  return (
    <svg
      className={styles.scene}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Stars — randomly scattered across the upper half */}
      <g className={styles.stars}>
        {STAR_COORDS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>

      {/* Mars horizon (rises from below) */}
      <g className={styles.horizon}>
        <ellipse cx="200" cy="640" rx="540" ry="340" className={styles.mars} />
        <ellipse cx="200" cy="640" rx="540" ry="340" className={styles.marsRim} />
      </g>

      {/* Shuttle streak — descends top-right to mid-left */}
      <g className={styles.shuttle}>
        <line x1="0" y1="0" x2="-26" y2="-58" className={styles.shuttleTrail} />
        <polygon points="0,-3 4,3 -4,3" className={styles.shuttleHull} />
      </g>

      {/* Impact flash at landing point */}
      <circle cx="120" cy="320" r="2" className={styles.impact} />

      {/* Station — three modules connected by corridors. The strokes draw
          themselves via stroke-dashoffset. */}
      <g className={styles.station}>
        {/* corridors */}
        <line x1="86"  y1="306" x2="148" y2="306" className={styles.draw} />
        <line x1="252" y1="306" x2="314" y2="306" className={styles.draw} />

        {/* modules */}
        <rect x="50"  y="290" width="36" height="32" rx="1" className={styles.draw} />
        <rect x="148" y="278" width="104" height="56" rx="1" className={styles.draw} />
        <rect x="314" y="290" width="42" height="32" rx="1" className={styles.draw} />

        {/* dish on the central module */}
        <line x1="200" y1="278" x2="200" y2="262" className={styles.draw} />
        <path d="M 188 254 A 12 8 0 0 1 212 254" className={styles.draw} />
      </g>

      {/* Internal lights (flicker on after the station finishes drawing) */}
      <g className={styles.lights}>
        <circle cx="58"  cy="298" r="1.4" />
        <circle cx="58"  cy="312" r="1.4" />
        <circle cx="78"  cy="305" r="1.4" />
        <circle cx="160" cy="290" r="1.6" />
        <circle cx="180" cy="290" r="1.6" />
        <circle cx="200" cy="290" r="1.6" />
        <circle cx="220" cy="290" r="1.6" />
        <circle cx="240" cy="290" r="1.6" />
        <circle cx="160" cy="320" r="1.6" />
        <circle cx="200" cy="320" r="1.6" />
        <circle cx="240" cy="320" r="1.6" />
        <circle cx="324" cy="298" r="1.4" />
        <circle cx="340" cy="312" r="1.4" />
      </g>
    </svg>
  );
}

/* Pre-computed star field — keeps render deterministic and avoids Math.random
   calls during render. Each tuple is [cx, cy, r]. */
const STAR_COORDS: ReadonlyArray<readonly [number, number, number]> = [
  [22, 58, 0.6], [78, 24, 0.5], [114, 80, 0.7], [160, 30, 0.5],
  [212, 64, 0.7], [250, 22, 0.6], [296, 70, 0.5], [340, 32, 0.6],
  [380, 90, 0.7], [44, 110, 0.5], [88, 140, 0.7], [142, 122, 0.5],
  [184, 158, 0.6], [228, 132, 0.5], [272, 168, 0.7], [318, 130, 0.6],
  [362, 156, 0.5], [12, 180, 0.7], [56, 196, 0.5], [104, 214, 0.6],
  [156, 200, 0.7], [206, 230, 0.5], [262, 218, 0.6], [310, 230, 0.7],
  [358, 200, 0.5], [388, 240, 0.6],
];
