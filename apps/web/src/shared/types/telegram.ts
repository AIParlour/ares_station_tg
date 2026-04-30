/* ─────────────────────────────────────────────────────────────────────────────
   Telegram Web App SDK types
   Mirrors the official API surface. Only the subset we actually use.
   https://core.telegram.org/bots/webapps
   ───────────────────────────────────────────────────────────────────────────── */

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type TgInitDataUnsafe = {
  user?: TgUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  start_param?: string;
};

export type TgHapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type TgHapticNotification = "error" | "success" | "warning";

export interface TgMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): this;
  show(): this;
  hide(): this;
  enable(): this;
  disable(): this;
  showProgress(leaveActive?: boolean): this;
  hideProgress(): this;
  onClick(fn: () => void): this;
  offClick(fn: () => void): this;
}

export interface TgBackButton {
  isVisible: boolean;
  show(): this;
  hide(): this;
  onClick(fn: () => void): this;
  offClick(fn: () => void): this;
}

export interface TgHapticFeedback {
  impactOccurred(style: TgHapticStyle): this;
  notificationOccurred(type: TgHapticNotification): this;
  selectionChanged(): this;
}

export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;

  /** Raw initData query string — send to backend for HMAC validation */
  initData: string;
  initDataUnsafe: TgInitDataUnsafe;

  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;

  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;

  setBackgroundColor(color: string): void;
  setHeaderColor(color: string): void;

  MainButton: TgMainButton;
  BackButton: TgBackButton;
  HapticFeedback: TgHapticFeedback;

  onEvent(eventType: string, fn: () => void): void;
  offEvent(eventType: string, fn: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
