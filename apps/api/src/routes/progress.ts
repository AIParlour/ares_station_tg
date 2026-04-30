import { Router } from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

export const progressRouter = Router();

progressRouter.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress
// Returns the full list of days the player has encountered, with status.
// Used by the Collected Documents screen and home screen state.
// ─────────────────────────────────────────────────────────────────────────────
progressRouter.get("/", async (req, res) => {
  const { playerId } = req.player!;

  try {
    const playerDays = await prisma.playerDay.findMany({
      where:   { playerId },
      orderBy: { day: { dayNumber: "asc" } },
      include: {
        day: {
          select: {
            id:          true,
            season:      true,
            dayNumber:   true,
            publishedAt: true,
            content:     true,
            // answers excluded — never sent to client
          },
        },
      },
    });

    const now = new Date();

    const days = playerDays.map((pd) => {
      const isLocked    = pd.unlockedAt > now;
      const isCompleted = Boolean(pd.completedAt);
      const isStarted   = Boolean(pd.startedAt);

      const status = isLocked
        ? "locked"
        : isCompleted
        ? "completed"
        : isStarted
        ? "in_progress"
        : "available";

      return {
        dayId:         pd.dayId,
        season:        pd.day.season,
        dayNumber:     pd.day.dayNumber,
        status,
        unlockedAt:    pd.unlockedAt,
        startedAt:     pd.startedAt,
        completedAt:   pd.completedAt,
        solvedSlots:   pd.solvedSlots,
        unlockWords:   pd.unlockWords,
        paradoxWin:    pd.paradoxWin,
        attemptsUsed:  pd.attemptsUsed,
        // Minimal day content for list view (no full document)
        title: (pd.day.content as { title?: string }).title ?? "",
      };
    });

    const player = await prisma.player.findUnique({
      where:  { id: playerId },
      select: { balance: true, firstName: true, username: true },
    });

    return res.json({ ok: true, player, days });
  } catch (err) {
    console.error("[progress] DB error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/skip-wait
// Body: { dayId: string }
// Deducts currency and sets unlockedAt = now() on a locked day.
// ─────────────────────────────────────────────────────────────────────────────
const SKIP_COST = 50; // in-game currency units

progressRouter.post("/skip-wait", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId }    = req.body ?? {};

  if (!dayId) {
    return res.status(400).json({ ok: false, error: "Missing dayId" });
  }

  try {
    const [player, playerDay] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerId } }),
      prisma.playerDay.findUnique({ where: { playerId_dayId: { playerId, dayId } } }),
    ]);

    if (!player || !playerDay) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    if (playerDay.unlockedAt <= new Date()) {
      return res.json({ ok: true, message: "Day already unlocked" });
    }

    if (player.balance < SKIP_COST) {
      return res.status(402).json({ ok: false, error: "Insufficient balance" });
    }

    await prisma.$transaction([
      // Unlock the day immediately
      prisma.playerDay.update({
        where: { id: playerDay.id },
        data:  { unlockedAt: new Date() },
      }),
      // Deduct currency
      prisma.player.update({
        where: { id: playerId },
        data:  { balance: { decrement: SKIP_COST } },
      }),
      // Append-only ledger entry
      prisma.transaction.create({
        data: {
          playerId,
          type:   "skip_wait",
          amount: -SKIP_COST,
          dayId,
        },
      }),
    ]);

    return res.json({ ok: true, newBalance: player.balance - SKIP_COST });
  } catch (err) {
    console.error("[progress] skip-wait error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
