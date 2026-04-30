import { Router } from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

export const puzzleRouter = Router();

puzzleRouter.use(requireAuth);

/** Returns 00:00:00.000 UTC of the next calendar day. */
function nextUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/puzzle/check
// Body: { dayId: string, slot: string, answer: string }
// Returns: { correct, unlockWord?, hint?, revealText? }
//
// On correct answer:
//   - Updates player_days.solvedSlots and unlockWords
//   - If ALL puzzles solved → marks completedAt, creates next-day row with
//     unlockedAt = now() + 24h (personal-synchronous gate)
// ─────────────────────────────────────────────────────────────────────────────
puzzleRouter.post("/check", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId, slot, answer } = req.body ?? {};

  if (!dayId || !slot || !answer) {
    return res.status(400).json({ ok: false, error: "Missing dayId, slot or answer" });
  }

  try {
    // ── Load player's access to this day ──────────────────────────────────────
    const playerDay = await prisma.playerDay.findUnique({
      where:   { playerId_dayId: { playerId, dayId } },
      include: { day: true },
    });

    if (!playerDay || playerDay.unlockedAt > new Date()) {
      return res.status(403).json({ ok: false, error: "Day not accessible" });
    }

    // ── Extract server-side answer key ────────────────────────────────────────
    const answers = playerDay.day.answers as Record<
      string,
      { answer: string; unlockWord: string; hint: string }
    >;

    const expected = answers[slot];
    if (!expected) {
      return res.status(404).json({ ok: false, error: "Unknown puzzle slot" });
    }

    // ── Already solved — idempotent response ──────────────────────────────────
    const solved = playerDay.solvedSlots as Record<string, boolean>;
    if (solved[slot]) {
      return res.json({ ok: true, correct: true, unlockWord: expected.unlockWord, alreadySolved: true });
    }

    // ── Compare answer ────────────────────────────────────────────────────────
    const given    = String(answer).trim().toUpperCase();
    const expected_answer = expected.answer.toUpperCase();

    if (given !== expected_answer) {
      return res.json({ ok: true, correct: false, hint: expected.hint });
    }

    // ── Correct — update progress ─────────────────────────────────────────────
    const newSolved      = { ...solved, [slot]: true };
    const newUnlockWords = [...playerDay.unlockWords, expected.unlockWord];

    // Check if all puzzles are now solved
    const dayContent   = playerDay.day.content as { puzzles: Array<{ slot: string }> };
    const totalSlots   = dayContent.puzzles.map((p) => p.slot);
    const allSolved    = totalSlots.every((s) => (newSolved as Record<string, boolean>)[s]);

    await prisma.$transaction(async (tx) => {
      // Update current playerDay
      await tx.playerDay.update({
        where: { id: playerDay.id },
        data: {
          solvedSlots:  newSolved,
          unlockWords:  newUnlockWords,
          startedAt:    playerDay.startedAt ?? new Date(),
          completedAt:  allSolved ? new Date() : undefined,
        },
      });

      // If all puzzles solved, unlock the next day (personal-synchronous gate)
      if (allSolved) {
        const nextDay = await tx.day.findFirst({
          where: {
            season:    playerDay.day.season,
            dayNumber: playerDay.day.dayNumber + 1,
          },
        });

        if (nextDay) {
          // Check the player doesn't already have a row for it (safety guard)
          const existing = await tx.playerDay.findUnique({
            where: { playerId_dayId: { playerId, dayId: nextDay.id } },
          });

          if (!existing) {
            // In dev mode (no BOT_TOKEN), unlock immediately for faster testing.
            // In production, unlock at the next 00:00:00 UTC (midnight gate).
            const unlockAt = process.env.BOT_TOKEN
              ? nextUtcMidnight()
              : new Date();
            await tx.playerDay.create({
              data: { playerId, dayId: nextDay.id, unlockedAt: unlockAt },
            });
          }
        }
      }
    });

    return res.json({
      ok:         true,
      correct:    true,
      unlockWord: expected.unlockWord,
      allSolved,
    });
  } catch (err) {
    console.error("[puzzle] DB error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
