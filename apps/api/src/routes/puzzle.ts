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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/puzzle/hint
// Body: { dayId: string, slot: string, tier: "full_decrypt" }
//
// v1 supports tier="full_decrypt" only. Behaviour mirrors the success branch
// of /check but is gated on currency rather than answer correctness:
//   - Validates the player has enough ⬡ for the tier.
//   - Atomically: deducts ⬡, inserts a Transaction (type "hint_purchase"),
//     marks the slot solved, creates the next-day row if it just unlocked,
//     and returns the unlockWord so the client can fire the decrypt animation.
// Signal Boost (tier="signal_boost") is reserved for Phase B.2 and currently
// returns 400.
// ─────────────────────────────────────────────────────────────────────────────

const HINT_COSTS: Record<string, number> = {
  full_decrypt: 50,
  signal_boost: 25,   // not wired yet — server-side cost defined for forward compat
};

puzzleRouter.post("/hint", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId, slot, tier } = req.body ?? {};

  // ── Validation ────────────────────────────────────────────────────────────
  if (!dayId || !slot || !tier) {
    return res.status(400).json({ ok: false, error: "Missing dayId, slot, or tier" });
  }
  if (tier !== "full_decrypt") {
    return res.status(400).json({
      ok: false,
      error: tier === "signal_boost"
        ? "Signal Boost not yet implemented"
        : `Unknown tier: ${tier}`,
    });
  }
  const cost = HINT_COSTS[tier];

  try {
    // ── Load player + day ─────────────────────────────────────────────────────
    const [player, playerDay] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerId } }),
      prisma.playerDay.findUnique({
        where:   { playerId_dayId: { playerId, dayId } },
        include: { day: true },
      }),
    ]);

    if (!player) {
      return res.status(404).json({ ok: false, error: "Player not found" });
    }
    if (!playerDay || playerDay.unlockedAt > new Date()) {
      return res.status(403).json({ ok: false, error: "Day not accessible" });
    }

    // ── Slot validation ──────────────────────────────────────────────────────
    const answers = playerDay.day.answers as Record<
      string,
      { answer: string; unlockWord: string; hint: string }
    >;
    const expected = answers[slot];
    if (!expected) {
      return res.status(404).json({ ok: false, error: "Unknown puzzle slot" });
    }

    const solved = playerDay.solvedSlots as Record<string, boolean>;
    if (solved[slot]) {
      // No point selling a hint for a solved puzzle.
      return res.status(409).json({ ok: false, error: "Puzzle already solved" });
    }

    // ── Balance check ────────────────────────────────────────────────────────
    if (player.balance < cost) {
      return res.status(402).json({
        ok:       false,
        error:    "Insufficient balance",
        required: cost,
        balance:  player.balance,
      });
    }

    // ── Compute solved snapshot + next-day creation eligibility ──────────────
    const newSolved      = { ...solved, [slot]: true };
    const newUnlockWords = [...playerDay.unlockWords, expected.unlockWord];

    const dayContent = playerDay.day.content as { puzzles: Array<{ slot: string }> };
    const totalSlots = dayContent.puzzles.map((p) => p.slot);
    const allSolved  = totalSlots.every((s) => (newSolved as Record<string, boolean>)[s]);

    // ── Atomic write: progress + currency + ledger + (optional) next day ─────
    const newBalance = player.balance - cost;

    await prisma.$transaction(async (tx) => {
      // Mark slot solved (mirror /check's success branch)
      await tx.playerDay.update({
        where: { id: playerDay.id },
        data: {
          solvedSlots: newSolved,
          unlockWords: newUnlockWords,
          startedAt:   playerDay.startedAt ?? new Date(),
          completedAt: allSolved ? new Date() : undefined,
        },
      });

      // Deduct currency
      await tx.player.update({
        where: { id: playerId },
        data:  { balance: { decrement: cost } },
      });

      // Append-only ledger
      await tx.transaction.create({
        data: {
          playerId,
          type:     "hint_purchase",
          amount:   -cost,
          dayId,
          metadata: { slot, tier },
        },
      });

      // If this hint just completed the day, gate the next one (same as /check)
      if (allSolved) {
        const nextDay = await tx.day.findFirst({
          where: {
            season:    playerDay.day.season,
            dayNumber: playerDay.day.dayNumber + 1,
          },
        });
        if (nextDay) {
          const existing = await tx.playerDay.findUnique({
            where: { playerId_dayId: { playerId, dayId: nextDay.id } },
          });
          if (!existing) {
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
      ok:          true,
      tier,
      unlockWord:  expected.unlockWord,
      newBalance,
      allSolved,
    });
  } catch (err) {
    console.error("[puzzle] hint error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
