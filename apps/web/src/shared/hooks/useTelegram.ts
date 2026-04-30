/* ─────────────────────────────────────────────────────────────────────────────
   useTelegram — singleton accessor for window.Telegram.WebApp
   Returns null when running outside Telegram (browser dev mode).
   ───────────────────────────────────────────────────────────────────────────── */

import type { TelegramWebApp } from "../types/telegram";

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

/** Call once at app boot. Sets colours, calls ready() and expand(). */
export function initTelegramWebApp(): TelegramWebApp | null {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  tg.ready();
  tg.expand();
  tg.setBackgroundColor("#0a0a0c");
  tg.setHeaderColor("#0a0a0c");

  return tg;
}

export function haptic(
  type: "impact" | "notification" | "selection",
  payload?: string
): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  if (type === "impact") {
    tg.HapticFeedback.impactOccurred(
      (payload as Parameters<typeof tg.HapticFeedback.impactOccurred>[0]) ?? "light"
    );
  } else if (type === "notification") {
    tg.HapticFeedback.notificationOccurred(
      (payload as Parameters<typeof tg.HapticFeedback.notificationOccurred>[0]) ?? "success"
    );
  } else {
    tg.HapticFeedback.selectionChanged();
  }
}
