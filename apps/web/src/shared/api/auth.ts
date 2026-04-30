import { apiPost } from "./client";
import type { TgUser } from "../types/telegram";

export type AuthSuccess = { ok: true;  user: TgUser; token: string };
export type AuthFailure = { ok: false; error: string };
export type AuthResult  = AuthSuccess | AuthFailure;

export function loginWithTelegram(initData: string): Promise<AuthResult> {
  return apiPost<AuthResult>("/api/auth/telegram", { initData });
}
