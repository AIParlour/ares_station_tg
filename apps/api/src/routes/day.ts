import { Router } from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

export const dayRouter = Router();

// All day routes require authentication
dayRouter.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/days/current
// Returns the player's current available day (highest day where unlockedAt <= now)
// Never includes the answers field — that stays server-side only.
// ─────────────────────────────────────────────────────────────────────────────
dayRouter.get("/current", async (req, res) => {
  const { playerId } = req.player!;

  try {
    const playerDay = await prisma.playerDay.findFirst({
      where: {
        playerId,
        unlockedAt: { lte: new Date() },  // only days already unlocked
      },
      orderBy: { day: { dayNumber: "desc" } },
      include: { day: true },
    });

    if (!playerDay) {
      return res.status(404).json({ ok: false, error: "No days available" });
    }

    // Flatten content JSON and strip server-only answers
    const day = playerDay.day as any;
    const content = (day.content ?? {}) as Record<string, unknown>;

    return res.json({
      ok: true,
      playerDay: {
        id:           playerDay.id,
        unlockedAt:   playerDay.unlockedAt,
        startedAt:    playerDay.startedAt,
        completedAt:  playerDay.completedAt,
        solvedSlots:  playerDay.solvedSlots,
        unlockWords:  playerDay.unlockWords,
        paradoxWin:   playerDay.paradoxWin,
        attemptsUsed: playerDay.attemptsUsed,
      },
      day: {
        dayId:  day.id,
        number: day.dayNumber,
        ...content, // title, stardate, author, document, puzzles, finale, paradoxLogs
      },
    });
  } catch (err) {
    console.error("[days] DB error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/days/:dayId
// Returns a specific day if the player has it unlocked.
// Used to revisit completed days (collected documents view).
// ─────────────────────────────────────────────────────────────────────────────
dayRouter.get("/:dayId", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId }    = req.params;

  try {
    const playerDay = await prisma.playerDay.findUnique({
      where:   { playerId_dayId: { playerId, dayId } },
      include: { day: true },
    });

    if (!playerDay) {
      return res.status(404).json({ ok: false, error: "Day not found or not unlocked" });
    }

    if (playerDay.unlockedAt > new Date()) {
      // Day exists but the 24h gate hasn't passed yet
      return res.status(403).json({
        ok: false,
        error: "Day locked",
        unlockedAt: playerDay.unlockedAt,
      });
    }

    const dayRow = playerDay.day as any;
    const content = (dayRow.content ?? {}) as Record<string, unknown>;

    return res.json({
      ok: true,
      playerDay: {
        id:           playerDay.id,
        unlockedAt:   playerDay.unlockedAt,
        startedAt:    playerDay.startedAt,
        completedAt:  playerDay.completedAt,
        solvedSlots:  playerDay.solvedSlots,
        unlockWords:  playerDay.unlockWords,
        paradoxWin:   playerDay.paradoxWin,
        attemptsUsed: playerDay.attemptsUsed,
      },
      day: {
        dayId:  dayRow.id,
        number: dayRow.dayNumber,
        ...content,
      },
    });
  } catch (err) {
    console.error("[days] DB error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
