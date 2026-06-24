import { Router } from "express";
import { createHmac } from "node:crypto";
import { prisma } from "../db/client.js";
import { signToken } from "../middleware/auth.js";

export const authRouter = Router();

const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
const SEASON    = 1;  // current active season

// ─────────────────────────────────────────────────────────────────────────────
// Telegram initData HMAC-SHA256 validation
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// ─────────────────────────────────────────────────────────────────────────────
function validateInitData(initData: string, botToken: string): {
  valid: boolean;
  user?: Record<string, unknown>;
} {
  try {
    const params = new URLSearchParams(initData);
    const hash   = params.get("hash");
    if (!hash) return { valid: false };

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed  = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (computed !== hash) return { valid: false };

    // Reject stale tokens older than 24 h
    const authDate = Number(params.get("auth_date") ?? 0);
    if (Math.floor(Date.now() / 1000) - authDate > 86_400) return { valid: false };

    const userRaw = params.get("user");
    const user    = userRaw ? JSON.parse(userRaw) : undefined;
    return { valid: true, user };
  } catch {
    return { valid: false };
  }
}
authRouter.post("/telegram", async (req, res) => {
  const { initData } = req.body ?? {};
  if (!initData || typeof initData !== "string") {
    return res.status(400).json({ ok: false, error: "Missing initData" });
  }

  let tgUser: Record<string, unknown>;

  if (!BOT_TOKEN) {
    // Dev mode — skip HMAC, trust whatever comes in
    console.warn("[auth] No BOT_TOKEN — running in dev mode, skipping validation");
    try {
      const params = new URLSearchParams(initData);
      tgUser = params.get("user")
        ? JSON.parse(params.get("user")!)
        : { id: 1, first_name: "Dev", username: "devuser" };
    } catch {
      tgUser = { id: 1, first_name: "Dev", username: "devuser" };
    }
  } else {
    const result = validateInitData(initData, BOT_TOKEN);
    if (!result.valid || !result.user) {
      return res.status(401).json({ ok: false, error: "Invalid initData" });
    }
    tgUser = result.user;
  }

  const tgUserId    = String(tgUser.id);
  const firstName   = String(tgUser.first_name ?? "Unknown");
  const lastName    = tgUser.last_name   ? String(tgUser.last_name)   : undefined;
  const username    = tgUser.username    ? String(tgUser.username)    : undefined;
  const langCode    = tgUser.language_code ? String(tgUser.language_code) : undefined;
  const isPremiumTg = Boolean(tgUser.is_premium ?? false);

  try {
    // ── Upsert player ──────────────────────────────────────────────────────────
    const existingPlayer = await prisma.player.findUnique({ where: { tgUserId } });

    const player = await prisma.player.upsert({
      where:  { tgUserId },
      update: { firstName, lastName, username, languageCode: langCode, isPremiumTg, lastSeenAt: new Date() },
      create: { tgUserId, firstName, lastName, username, languageCode: langCode, isPremiumTg },
    });

    const isNewPlayer = !existingPlayer;

    // ── Enroll new player in season's first day ────────────────────────────────
    if (isNewPlayer) {
      const firstDay = await prisma.day.findFirst({
        where:   { season: SEASON },
        orderBy: { dayNumber: "asc" },
      });

      if (firstDay) {
        await prisma.playerDay.create({
          data: {
            playerId:   player.id,
            dayId:      firstDay.id,
            unlockedAt: new Date(),  // immediately available
          },
        });
      }
    }

    // ── Issue JWT ──────────────────────────────────────────────────────────────
    const token = signToken({ playerId: player.id, tgUserId: player.tgUserId });

    return res.json({
      ok: true,
      token,
      isNewPlayer,
      user: { id: player.tgUserId, firstName: player.firstName, username: player.username },
    });
  } catch (err) {
    console.error("[auth] DB error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
