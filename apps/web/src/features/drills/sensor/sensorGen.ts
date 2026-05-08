/* ─────────────────────────────────────────────────────────────────────────────
   Sensor Sweep generator — perception drill.

   Mechanic
   --------
   The player is shown a panel of sensor readings for a single metric (TEMP,
   PRESS, O2, etc.) along with the nominal range. Exactly one reading is
   "falsified" — outside the nominal range. The player taps that one.

   Difficulty index N drives:
     - count of readings on the panel  (6 → 8 → 9)
     - tightness of the deviation gap  (~3.0 → ~0.7 → ~0.3 units beyond the
       boundary). Tighter gaps require sharper visual scanning.
   ───────────────────────────────────────────────────────────────────────────── */

interface MetricSpec {
  name:     string;
  unit:     string;
  base:     number;   // nominal min
  range:    number;   // nominal width (so nominal max = base + range)
  decimals: number;
}

const METRICS: MetricSpec[] = [
  { name: "TEMP",  unit: "°C",  base: 23.0,  range: 4.0,  decimals: 1 },
  { name: "PRESS", unit: "kPa", base: 96.0,  range: 6.0,  decimals: 1 },
  { name: "O2",    unit: "%",   base: 19.5,  range: 1.5,  decimals: 1 },
  { name: "POWER", unit: "kW",  base: 4.20,  range: 1.20, decimals: 2 },
  { name: "RAD",   unit: "μSv", base: 0.10,  range: 0.30, decimals: 2 },
  { name: "HUMID", unit: "%",   base: 38.0,  range: 8.0,  decimals: 0 },
];

export interface SensorReading {
  id:           string;   // "S-01"
  value:        number;
  display:      string;   // formatted to the metric's decimals
  isFalsified:  boolean;
}

export interface SensorPuzzle {
  metric:      string;
  unit:        string;
  nominalMin:  number;
  nominalMax:  number;
  decimals:    number;
  readings:    SensorReading[];
}

interface DifficultyParams {
  count:   number;
  gapMin:  number;   // multiplier of metric.range for the gap below/above
  gapMax:  number;
}

function paramsFor(difficulty: number): DifficultyParams {
  if (difficulty < 4)  return { count: 6, gapMin: 0.50, gapMax: 1.00 };
  if (difficulty < 10) return { count: 8, gapMin: 0.18, gapMax: 0.45 };
  return                       { count: 9, gapMin: 0.06, gapMax: 0.20 };
}

/** Generate one sensor puzzle. */
export function generateSensorPuzzle(difficulty: number): SensorPuzzle {
  const metric = METRICS[Math.floor(Math.random() * METRICS.length)];
  const { count, gapMin, gapMax } = paramsFor(difficulty);

  const nominalMin = metric.base;
  const nominalMax = metric.base + metric.range;

  const falsifiedIdx = Math.floor(Math.random() * count);
  const goesOver     = Math.random() < 0.5;
  const gap          = (gapMin + Math.random() * (gapMax - gapMin)) * metric.range;

  const readings: SensorReading[] = [];
  for (let i = 0; i < count; i++) {
    let value: number;
    if (i === falsifiedIdx) {
      // Place outside the nominal range — at least `gap` beyond the boundary.
      value = goesOver ? nominalMax + gap : nominalMin - gap;
    } else {
      // Anywhere comfortably inside the range — keep ~10% padding from the
      // edges so honest readings don't visually crowd the falsified one.
      const pad = 0.08 * metric.range;
      value = nominalMin + pad + Math.random() * (metric.range - 2 * pad);
    }
    readings.push({
      id:          `S-${String(i + 1).padStart(2, "0")}`,
      value,
      display:     value.toFixed(metric.decimals),
      isFalsified: i === falsifiedIdx,
    });
  }

  return {
    metric:     metric.name,
    unit:       metric.unit,
    nominalMin,
    nominalMax,
    decimals:   metric.decimals,
    readings,
  };
}

/** Format the nominal range for display ("23.0 — 27.0 °C"). */
export function formatNominal(p: SensorPuzzle): string {
  return `${p.nominalMin.toFixed(p.decimals)} – ${p.nominalMax.toFixed(p.decimals)} ${p.unit}`;
}
