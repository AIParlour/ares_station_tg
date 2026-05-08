/* ─────────────────────────────────────────────────────────────────────────────
   Operator Drills — side-mode mini-game routes.

   v1 drill types: "cipher" | "sensor" | "pattern" | "drift"

   ARCHITECTURAL INVARIANT
   Drills never unlock main-story content. Rewards are constrained to:
     - Currency (Transaction.type = "drill_reward")
     - PlayerDrillStat (personal best, mastery tier)
     - PlayerDrillStreak (daily-workout streak)
     - PlayerCodexUnlock (atmospheric only)
   See OPERATOR_DRILLS_ROADMAP.md.

   STATUS:
     - GET  /state            — REAL (M1)
     - POST /round            — REAL (M1)
     - GET  /workout/today    — STUB (M3)
     - POST /workout/complete — STUB (M3)
   ───────────────────────────────────────────────────────────────────────────── */

import { Router } from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

export const drillsRouter = Router();

drillsRouter.use(requireAuth);

// ── Constants & helpers ──────────────────────────────────────────────────────

const V1_DRILL_TYPES = ["cipher", "sensor", "pattern", "drift"] as const;
type DrillType = (typeof V1_DRILL_TYPES)[number];

type MasteryTier = "none" | "bronze" | "silver" | "gold";

/** Mastery thresholds duplicated server-side (must stay in sync with
 *  apps/web/src/features/drills/drillMeta.ts). The web copy drives UI;
 *  this copy authoritatively decides which tier the score earned. */
const DRILL_THRESHOLDS: Record<DrillType, { bronze: number; silver: number; gold: number }> = {
  cipher:  { bronze: 6,  silver: 14, gold: 22 },
  sensor:  { bronze: 6,  silver: 14, gold: 24 },
  pattern: { bronze: 5,  silver: 11, gold: 18 },
  drift:   { bronze: 6,  silver: 14, gold: 22 },
};

function tierFor(drillType: DrillType, score: number): MasteryTier {
  const t = DRILL_THRESHOLDS[drillType];
  if (score >= t.gold)   return "gold";
  if (score >= t.silver) return "silver";
  if (score >= t.bronze) return "bronze";
  return "none";
}

/** Returns "YYYY-MM-DD" for the given date in UTC. Defaults to today. */
function getUtcDay(d: Date = new Date()): string {
  const y   = d.getUTCFullYear();
  const m   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Pick 3 drills deterministically for the given UTC day.
 * Same day → same set; new day → new set.
 * Uses a small string-hash PRNG so we don't pull in dependencies.
 */
function pickDailyDrills(utcDay: string): DrillType[] {
  // FNV-1a-ish hash, good enough for a 4-element shuffle.
  let h = 2166136261;
  for (let i = 0; i < utcDay.length; i++) {
    h ^= utcDay.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Fisher–Yates shuffle seeded by h
  const pool = [...V1_DRILL_TYPES];
  for (let i = pool.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1597334677);
    const j = Math.abs(h) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drills/state
// Aggregate state for the Drills hub.
// REAL (M1): reads PlayerDrillStat[] and PlayerDrillStreak from DB.
// Workout completion still pending in M1; ships in M3.
// ─────────────────────────────────────────────────────────────────────────────
drillsRouter.get("/state", async (req, res) => {
  const { playerId } = req.player!;

  try {
    const utcDay = getUtcDay();

    const [statRows, streakRow, workoutRow] = await Promise.all([
      prisma.playerDrillStat.findMany({ where: { playerId } }),
      prisma.playerDrillStreak.findUnique({ where: { playerId } }),
      prisma.workoutSession.findUnique({
        where: { playerId_utcDay: { playerId, utcDay } },
      }),
    ]);

    // Build a complete stats array, filling in zero rows for any drill type
    // the player hasn't played yet — keeps the client free of null-checks.
    const byType = new Map(statRows.map((r) => [r.drillType, r]));
    const stats = V1_DRILL_TYPES.map((dt) => {
      const r = byType.get(dt);
      if (!r) {
        return {
          drillType:         dt,
          bestScore:         0,
          masteryTier:       "none" as MasteryTier,
          totalSessions:     0,
          totalRoundsPlayed: 0,
        };
      }
      return {
        drillType:         r.drillType,
        bestScore:         r.bestScore,
        masteryTier:       r.masteryTier as MasteryTier,
        totalSessions:     r.totalSessions,
        totalRoundsPlayed: r.totalRoundsPlayed,
      };
    });

    return res.json({
      ok: true,
      stats,
      streak: {
        currentStreak:  streakRow?.currentStreak  ?? 0,
        longestStreak:  streakRow?.longestStreak  ?? 0,
        lastWorkoutDay: streakRow?.lastWorkoutDay ?? null,
      },
      todayWorkout: {
        utcDay,
        drills:      pickDailyDrills(utcDay),
        status:      workoutRow ? "completed" : "pending",
        completedAt: workoutRow?.completedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error("[drills] state error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drills/round
// Body: { drillType: DrillType, score: number, durationMs: number }
// Records a single drill round outside the daily workout (free play).
// REAL (M1): upserts PlayerDrillStat, computes mastery tier transition.
// Returns whether this beat the personal best and any mastery change.
// ─────────────────────────────────────────────────────────────────────────────
drillsRouter.post("/round", async (req, res) => {
  const { playerId } = req.player!;
  const { drillType, score, durationMs } = req.body ?? {};

  // ── Validation ────────────────────────────────────────────────────────────
  if (!drillType || typeof score !== "number" || typeof durationMs !== "number") {
    return res.status(400).json({
      ok: false,
      error: "Missing or invalid drillType, score, or durationMs",
    });
  }
  if (!V1_DRILL_TYPES.includes(drillType)) {
    return res.status(400).json({ ok: false, error: `Unknown drillType: ${drillType}` });
  }
  if (!Number.isFinite(score) || score < 0 || score > 1000) {
    return res.status(400).json({ ok: false, error: "Score out of range" });
  }
  if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 600_000) {
    return res.status(400).json({ ok: false, error: "Duration out of range" });
  }

  const intScore   = Math.floor(score);
  const drillTypeT = drillType as DrillType;

  try {
    // Read the current stat so we can detect "new PB" and "tier changed".
    const prev = await prisma.playerDrillStat.findUnique({
      where: { playerId_drillType: { playerId, drillType: drillTypeT } },
    });

    const prevBest    = prev?.bestScore ?? 0;
    const prevTier    = (prev?.masteryTier as MasteryTier) ?? "none";

    const newBest     = Math.max(prevBest, intScore);
    const newTier     = tierFor(drillTypeT, newBest);
    const newPB       = intScore > prevBest;
    const tierChanged = newTier !== prevTier;

    await prisma.playerDrillStat.upsert({
      where:  { playerId_drillType: { playerId, drillType: drillTypeT } },
      create: {
        playerId,
        drillType:         drillTypeT,
        bestScore:         newBest,
        masteryTier:       newTier,
        totalSessions:     1,
        totalRoundsPlayed: 1,
      },
      update: {
        bestScore:         newBest,
        masteryTier:       newTier,
        totalSessions:     { increment: 1 },
        totalRoundsPlayed: { increment: 1 },
      },
    });

    return res.json({
      ok:               true,
      drillType:        drillTypeT,
      score:            intScore,
      durationMs,
      newPersonalBest:  newPB,
      masteryTier:      newTier,
      masteryChanged:   tierChanged,
    });
  } catch (err) {
    console.error("[drills] round error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drills/workout/today
// Today's Daily Workout descriptor: the 3 drills selected, completion status.
// REAL (M1, partial): completion status is read from WorkoutSession.
// M3: rounds aggregation when /workout/complete writes them.
// ─────────────────────────────────────────────────────────────────────────────
drillsRouter.get("/workout/today", async (req, res) => {
  const { playerId } = req.player!;
  const utcDay = getUtcDay();

  try {
    const workoutRow = await prisma.workoutSession.findUnique({
      where: { playerId_utcDay: { playerId, utcDay } },
    });

    return res.json({
      ok: true,
      utcDay,
      drills:      pickDailyDrills(utcDay),
      status:      workoutRow ? "completed" : "pending",
      completedAt: workoutRow?.completedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[drills] workout/today error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drills/workout/complete
// Body: { rounds: [{ drillType, score }, ...], integrityScore: number }
//
// Atomic transaction:
//   1. Validate utcDay uniqueness (one workout per day per player).
//   2. Insert WorkoutSession.
//   3. Upsert PlayerDrillStreak (yesterday → +1, gap → reset, today → impossible).
//   4. Award currency = integrityScore via Transaction (type "drill_reward")
//      AND increment Player.balance.
//   5. Codex unlocks deferred to M4 — returns [].
//
// Returns the updated streak, currency awarded, and a flavor line tied to the
// integrity tier.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for the day before `today` in UTC. */
function getYesterdayUtc(today: Date = new Date()): string {
  const y = new Date(today);
  y.setUTCDate(y.getUTCDate() - 1);
  return getUtcDay(y);
}

function flavorFor(integrity: number): string {
  if (integrity >= 90) return "Operator readiness exceeds calibration baseline.";
  if (integrity >= 70) return "Operator response time within nominal range.";
  if (integrity >= 50) return "Acceptable. Continue daily calibration.";
  if (integrity >= 25) return "Performance below target. Recommend additional drills.";
  return "Calibration drift detected. Schedule supervised review.";
}

drillsRouter.post("/workout/complete", async (req, res) => {
  const { playerId } = req.player!;
  const { rounds, integrityScore } = req.body ?? {};

  // ── Validation ────────────────────────────────────────────────────────────
  if (!Array.isArray(rounds) || typeof integrityScore !== "number") {
    return res.status(400).json({ ok: false, error: "Missing rounds or integrityScore" });
  }
  if (rounds.length === 0 || rounds.length > 4) {
    return res.status(400).json({ ok: false, error: "Rounds count out of range" });
  }
  if (!Number.isFinite(integrityScore) || integrityScore < 0 || integrityScore > 100) {
    return res.status(400).json({ ok: false, error: "integrityScore out of range" });
  }

  // Validate each round shape.
  for (const r of rounds) {
    if (
      !r ||
      typeof r.drillType !== "string" ||
      !V1_DRILL_TYPES.includes(r.drillType as DrillType) ||
      typeof r.score !== "number" ||
      !Number.isFinite(r.score) ||
      r.score < 0 ||
      r.score > 1000
    ) {
      return res.status(400).json({ ok: false, error: "Invalid round entry" });
    }
  }

  const intIntegrity = Math.floor(integrityScore);
  const utcDay       = getUtcDay();
  const yesterday    = getYesterdayUtc();

  try {
    // ── Daily-uniqueness pre-check (the @@unique constraint will catch races
    //    too, but checking here gives a cleaner 409 response).
    const existing = await prisma.workoutSession.findUnique({
      where: { playerId_utcDay: { playerId, utcDay } },
    });
    if (existing) {
      return res.status(409).json({ ok: false, error: "Workout already completed today" });
    }

    // ── Currency to award. v1 rule: integrity score = credit count.
    //    A perfect 100% workout is +100 credits; nothing for 0%.
    const credits = intIntegrity;

    // ── Compute next streak from existing record + yesterday match.
    const existingStreak = await prisma.playerDrillStreak.findUnique({
      where: { playerId },
    });

    let nextCurrent: number;
    if (existingStreak?.lastWorkoutDay === yesterday) {
      nextCurrent = existingStreak.currentStreak + 1;
    } else {
      // Either first workout, or there's a gap.
      nextCurrent = 1;
    }
    const nextLongest = Math.max(existingStreak?.longestStreak ?? 0, nextCurrent);

    // ── Atomic transaction: WorkoutSession insert + Streak upsert + reward.
    await prisma.$transaction([
      prisma.workoutSession.create({
        data: {
          playerId,
          utcDay,
          drillsPlayed:    rounds,
          integrityScore:  intIntegrity,
          currencyAwarded: credits,
        },
      }),
      prisma.playerDrillStreak.upsert({
        where:  { playerId },
        create: {
          playerId,
          currentStreak:  nextCurrent,
          longestStreak:  nextLongest,
          lastWorkoutDay: utcDay,
        },
        update: {
          currentStreak:  nextCurrent,
          longestStreak:  nextLongest,
          lastWorkoutDay: utcDay,
        },
      }),
      // Currency: only insert a transaction if there's something to award.
      // Prisma transaction arrays don't support conditional entries cleanly,
      // so we emit a no-op update when credits === 0.
      ...(credits > 0
        ? [
            prisma.transaction.create({
              data: {
                playerId,
                type:     "drill_reward",
                amount:   credits,
                metadata: { utcDay, integrityScore: intIntegrity, rounds },
              },
            }),
            prisma.player.update({
              where: { id: playerId },
              data:  { balance: { increment: credits } },
            }),
          ]
        : []),
    ]);

    return res.json({
      ok:              true,
      streak:          nextCurrent,
      longestStreak:   nextLongest,
      currencyAwarded: credits,
      codexUnlocks:    [],   // M4
      flavorLine:      flavorFor(intIntegrity),
    });
  } catch (err) {
    console.error("[drills] workout/complete error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
