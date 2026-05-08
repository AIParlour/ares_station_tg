/* ─────────────────────────────────────────────────────────────────────────────
   Static metadata for v1 drills. Names, blurbs, mastery score thresholds.
   Used by hub UI, runner, and (later) codex unlock checks.
   ───────────────────────────────────────────────────────────────────────────── */

import type { DrillType } from "../../shared/api/drills";

export interface DrillMeta {
  type:        DrillType;
  name:        string;
  short:       string;       // ≤ 4-letter monogram for compact UI
  blurb:       string;       // one-liner shown on hub cards
  domain:      "analytical" | "perception" | "memory" | "operational";
  thresholds:  { bronze: number; silver: number; gold: number };
}

export const DRILL_META: Record<DrillType, DrillMeta> = {
  cipher: {
    type:   "cipher",
    name:   "CIPHER CALIBRATION",
    short:  "CIPH",
    blurb:  "Decode words using a substitution key.",
    domain: "analytical",
    thresholds: { bronze: 6,  silver: 14, gold: 22 },
  },
  sensor: {
    type:   "sensor",
    name:   "SENSOR SWEEP",
    short:  "SENS",
    blurb:  "Spot the falsified reading in nominal data.",
    domain: "perception",
    thresholds: { bronze: 6,  silver: 14, gold: 24 },
  },
  pattern: {
    type:   "pattern",
    name:   "PATTERN RECALL",
    short:  "PTRN",
    blurb:  "Reproduce the warning panel configuration.",
    domain: "memory",
    thresholds: { bronze: 5,  silver: 11, gold: 18 },
  },
  drift: {
    type:   "drift",
    name:   "TELEMETRY DRIFT",
    short:  "DRFT",
    blurb:  "Predict the missing value in a sequence.",
    domain: "analytical",
    thresholds: { bronze: 6,  silver: 14, gold: 22 },
  },
};

export const ALL_DRILL_TYPES: DrillType[] = ["cipher", "sensor", "pattern", "drift"];
