/* ─────────────────────────────────────────────────────────────────────────────
   Ares Station — Telegram Bot

   Responsibilities:
     1. /start command → welcome message + "Open Ares Station" Mini App button
     2. Daily push notifications → remind players when a new day unlocks
     3. Bot menu button → opens the Mini App directly

   Uses grammY (https://grammy.dev) — lightweight, TypeScript-first bot framework.
   The bot starts alongside the Express API server in the same process.
   ───────────────────────────────────────────────────────────────────────────── */

import { Bot, InlineKeyboard } from "grammy";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ── Config ──────────────────────────────────────────────────────────────────── */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL ?? "https://t.me/AresStationBot/app";

/* ── Start bot (called from index.ts) ────────────────────────────────────────── */

export async function startBot() {
  if (!BOT_TOKEN) {
    console.log("[ares-bot] BOT_TOKEN not set — bot disabled (dev mode)");
    return null;
  }

  const bot = new Bot(BOT_TOKEN);

  /* ── /start — Welcome + Launch Mini App ──────────────────────────────────── */

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .webApp("▶ OPEN ARES STATION", MINI_APP_URL);

    await ctx.reply(
      "🔴 *ARES STATION — INCIDENT INVESTIGATION TERMINAL*\n\n" +
      "You have been assigned to investigate the disappearance of " +
      "the Ares Station crew\\. Paradox, the station AI, is online " +
      "but evasive\\.\n\n" +
      "Decrypt classified system logs\\. Solve puzzles to earn " +
      "decryption keys\\. Uncover what happened on Sol 5,118\\.\n\n" +
      "_New investigation data unlocks every 24 hours\\._",
      {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      }
    );
  });

  /* ── /help ───────────────────────────────────────────────────────────────── */

  bot.command("help", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .webApp("▶ OPEN ARES STATION", MINI_APP_URL);

    await ctx.reply(
      "🔴 *ARES STATION — HELP*\n\n" +
      "*How to play:*\n" +
      "1\\. Open the Mini App\n" +
      "2\\. Read the Paradox system logs\n" +
      "3\\. Solve puzzles to earn decryption keys\n" +
      "4\\. Use keys to decrypt redacted log entries\n" +
      "5\\. Complete all puzzles to unlock Dr\\. Leskov's personal log\n\n" +
      "_A new day unlocks every 24 hours after you complete the current one\\._",
      {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      }
    );
  });

  /* ── Fallback for any other text ─────────────────────────────────────────── */

  bot.on("message:text", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .webApp("▶ OPEN ARES STATION", MINI_APP_URL);

    await ctx.reply(
      "📡 _All communications must go through the investigation terminal\\._",
      {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      }
    );
  });

  /* ── Error handling ──────────────────────────────────────────────────────── */

  bot.catch((err) => {
    console.error("[ares-bot] Error:", err.message);
  });

  /* ── Launch ──────────────────────────────────────────────────────────────── */

  await bot.start({
    onStart: () => console.log("[ares-bot] Bot is running"),
    drop_pending_updates: true,
  });

  return bot;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Daily Notifications

   Sends a push message to players whose next day just unlocked.
   Called on a schedule (e.g. every 5 minutes via setInterval in index.ts).
   ───────────────────────────────────────────────────────────────────────────── */

export async function sendDailyNotifications(bot: Bot) {
  try {
    // Find players with a day that unlocked in the last 5 minutes
    // and hasn't been started yet (no startedAt)
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const freshUnlocks = await prisma.playerDay.findMany({
      where: {
        unlockedAt: {
          gte: fiveMinAgo,
          lte: now,
        },
        startedAt: null,
      },
      include: {
        player: true,
        day: true,
      },
    });

    const keyboard = new InlineKeyboard()
      .webApp("▶ BEGIN INVESTIGATION", MINI_APP_URL);

    for (const pd of freshUnlocks) {
      const dayNum = pd.day.dayNumber;
      const content = pd.day.content as Record<string, unknown>;
      const title = (content.title as string) ?? `Day ${dayNum}`;

      try {
        await bot.api.sendMessage(
          Number(pd.player.tgUserId),
          `🔴 *NEW INVESTIGATION DATA AVAILABLE*\n\n` +
          `Day ${dayNum}: _${escapeMarkdown(title)}_\n\n` +
          `New Paradox system logs have been declassified\\. ` +
          `Decrypt them to continue the investigation\\.`,
          {
            parse_mode: "MarkdownV2",
            reply_markup: keyboard,
          }
        );
        console.log(`[ares-bot] Notified player ${pd.player.tgUserId} — day ${dayNum}`);
      } catch (err: unknown) {
        // Player may have blocked the bot — that's fine
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("bot was blocked") || msg.includes("chat not found")) {
          console.log(`[ares-bot] Player ${pd.player.tgUserId} unreachable — skipping`);
        } else {
          console.error(`[ares-bot] Failed to notify ${pd.player.tgUserId}:`, msg);
        }
      }
    }

    if (freshUnlocks.length > 0) {
      console.log(`[ares-bot] Notification sweep: ${freshUnlocks.length} players notified`);
    }
  } catch (err) {
    console.error("[ares-bot] Notification sweep failed:", err);
  }
}

/* ── Helpers ──────────────────────────────────────────────────────────────────── */

/** Escape special chars for Telegram MarkdownV2 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
