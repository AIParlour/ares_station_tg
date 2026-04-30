/* ─────────────────────────────────────────────────────────────────────────────
   useTelegramAuth — handles the TG initData → backend validation flow.
   Returns the resolved user or an error string.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { loginWithTelegram } from "../api/auth";
import { setAuthToken } from "../api/client";
import { getTelegramWebApp } from "./useTelegram";
import type { TgUser } from "../types/telegram";

type AuthState =
  | { status: "pending" }
  | { status: "ok";    user: TgUser }
  | { status: "error"; message: string };

export function useTelegramAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "pending" });

  useEffect(() => {
    const tg = getTelegramWebApp();
    const initData = tg?.initData ?? "";
    const unsafeUser = tg?.initDataUnsafe?.user ?? null;

    // Dev / browser mode: no initData → send synthetic initData
    // Backend skips HMAC when BOT_TOKEN is absent and creates a real player + JWT
    const effectiveInitData = initData || "user=" + encodeURIComponent(
      JSON.stringify({ id: 1, first_name: "Dev", username: "dev_user" })
    );

    if (!initData) {
      console.warn("[useTelegramAuth] No initData — dev/browser mode, using synthetic auth");
    }

    loginWithTelegram(effectiveInitData)
      .then((res) => {
        if (res.ok) {
          setAuthToken(res.token);
          setState({ status: "ok", user: res.user });
        } else {
          // Validation failed — fall back to unsafe user if available (dev leniency only)
          if (unsafeUser) {
            console.warn("[useTelegramAuth] Backend validation failed; using unsafe user");
            setState({ status: "ok", user: unsafeUser });
          } else {
            setState({ status: "error", message: res.error ?? "Authentication failed." });
          }
        }
      })
      .catch(() => {
        // Backend unreachable — trust unsafe user to avoid blocking dev workflows.
        // Remove the fallback in production once infra is stable.
        if (unsafeUser) {
          setState({ status: "ok", user: unsafeUser });
        } else {
          setState({ status: "error", message: "Could not reach server. Please try again." });
        }
      });
  }, []);

  return state;
}
