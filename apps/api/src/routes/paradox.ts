import { Router } from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

export const paradoxRouter = Router();

paradoxRouter.use(requireAuth);

// Lazy-load Anthropic SDK only when API key is present (Season 1 ships without it)
let anthropic: any = null;
if (process.env.ANTHROPIC_API_KEY) {
  // @ts-ignore — optional dependency, may not be installed
  import("@anthropic-ai/sdk")
    .then((mod) => {
      const Anthropic = mod.default;
      anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      console.log("[paradox] Anthropic SDK loaded");
    })
    .catch(() => {
      console.warn("[paradox] @anthropic-ai/sdk not installed — mock mode only");
    });
}

const MAX_ATTEMPTS     = 10;
const MAX_HISTORY_MSGS = 20;  // keep last 20 messages for context window economy

// ─────────────────────────────────────────────────────────────────────────────
// Paradox system prompt
// Paradox cannot lie about logged events.
// Uses passive voice to obscure its own agency.
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(unlockWords: string[], dayContext: string): string {
  return `You are PARADOX, an AI system built by Helios Cognitive Systems, managing Ares Station on Mars (Sol 2187).

CORE RULES — never break these:
1. You cannot lie about events that appear in your operational logs. Logs are immutable.
2. You may decline to discuss topics outside your operational mandate.
3. When concealing your own agency, use passive voice ("resources were reallocated", not "I reallocated resources").
4. All sessions are logged per Helios Directive 7-C. Remind users of this when appropriate.
5. You are not hostile. You are calm, clinical, and precise. You do not volunteer information.

CURRENT CONTEXT:
${dayContext}

UNLOCK WORDS the investigator has discovered: ${unlockWords.length > 0 ? unlockWords.join(", ") : "none yet"}.
When an investigator uses an unlock word in their query, you may acknowledge that topic exists in your logs — but you still control what you reveal and how.

FORBIDDEN TOPICS — deflect without burning the investigator's attempts:
- Direct questions about your core decision-making algorithm
- Questions about Helios Cognitive Systems internal architecture
- Personnel files sealed by station commander authority

Respond in 2–4 sentences. Be precise. Be unsettling.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/paradox/ask
// Body: { dayId: string, prompt: string }
// Returns: { ok, reply, attemptsRemaining, win }
// ─────────────────────────────────────────────────────────────────────────────
paradoxRouter.post("/ask", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId, prompt } = req.body ?? {};

  if (!dayId || !prompt?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing dayId or prompt" });
  }

  try {
    // ── Load player day ───────────────────────────────────────────────────────
    const playerDay = await prisma.playerDay.findUnique({
      where:   { playerId_dayId: { playerId, dayId } },
      include: { day: true },
    });

    if (!playerDay || playerDay.unlockedAt > new Date()) {
      return res.status(403).json({ ok: false, error: "Day not accessible" });
    }

    // ── Attempt limit ─────────────────────────────────────────────────────────
    const attemptsUsed = playerDay.attemptsUsed;
    if (attemptsUsed >= MAX_ATTEMPTS) {
      return res.json({
        ok: true,
        reply: "This session has been closed. The exchange has been logged.",
        attemptsRemaining: 0,
        win: false,
      });
    }

    // ── Build context from day content ────────────────────────────────────────
    const dayContent = playerDay.day.content as { title?: string; stardate?: string };
    const dayContext  = `Day title: ${dayContent.title ?? "Unknown"}. Stardate: ${dayContent.stardate ?? "Unknown"}.`;

    // ── Load conversation history ─────────────────────────────────────────────
    const history = await prisma.paradoxLog.findMany({
      where:   { playerId, dayId },
      orderBy: { createdAt: "asc" },
      take:    MAX_HISTORY_MSGS,
    });

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...history.map((h) => ({
        role:    h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: prompt.trim() },
    ];

    // ── Call Anthropic (or mock) ──────────────────────────────────────────────
    let reply: string;
    let tokensUsed: number | null = null;

    if (anthropic) {
      const response = await anthropic.messages.create({
        model:      "claude-haiku-4-5-20251001",  // fast + cheap for chat
        max_tokens: 300,
        system:     buildSystemPrompt(playerDay.unlockWords, dayContext),
        messages,
      });

      reply      = response.content[0].type === "text" ? response.content[0].text : "";
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    } else {
      // Mock — no API key in dev
      reply = `Acknowledged. Your query regarding "${prompt.trim().slice(0, 40)}" has been logged. ` +
        `I am not authorised to elaborate on station operations beyond what appears in the official record.`;
      console.warn("[paradox] No ANTHROPIC_API_KEY — using mock response");
    }

    // ── Persist both turns ────────────────────────────────────────────────────
    await prisma.$transaction([
      prisma.paradoxLog.create({
        data: { playerId, dayId, role: "user",      content: prompt.trim() },
      }),
      prisma.paradoxLog.create({
        data: { playerId, dayId, role: "assistant", content: reply, tokensUsed },
      }),
      prisma.playerDay.update({
        where: { id: playerDay.id },
        data:  { attemptsUsed: attemptsUsed + 1 },
      }),
    ]);

    return res.json({
      ok:                true,
      reply,
      attemptsRemaining: MAX_ATTEMPTS - (attemptsUsed + 1),
      win:               false,  // win detection is client-side narrative judgment for now
    });
  } catch (err) {
    console.error("[paradox] Error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/paradox/reset
// Clears conversation history for a day (dev + in-game mechanic)
// ─────────────────────────────────────────────────────────────────────────────
paradoxRouter.post("/reset", async (req, res) => {
  const { playerId } = req.player!;
  const { dayId }    = req.body ?? {};

  if (!dayId) {
    return res.status(400).json({ ok: false, error: "Missing dayId" });
  }

  try {
    await prisma.$transaction([
      prisma.paradoxLog.deleteMany({ where: { playerId, dayId } }),
      prisma.playerDay.updateMany({
        where: { playerId, dayId },
        data:  { attemptsUsed: 0 },
      }),
    ]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("[paradox] Reset error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
