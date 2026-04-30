/* ─────────────────────────────────────────────────────────────────────────────
   State-based router — compatible with Telegram Mini Apps.
   TG controls the WebView URL so we cannot rely on window.location.
   Instead we keep a route stack in React state and wire TG BackButton
   to pop from the stack.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getTelegramWebApp } from "../shared/hooks/useTelegram";

/* ── Route definitions ──────────────────────────────────────────────────────── */

export type RouteName =
  | "loading"
  | "intro"
  | "home"
  | "document"
  | "puzzle"
  | "finale"
  | "documents"
  | "shop"
  | "map"
  | "logs"
  | "story";

export interface RouteState {
  name: RouteName;
  params?: Record<string, unknown>;
}

/* ── Context ────────────────────────────────────────────────────────────────── */

interface RouterContextValue {
  current: RouteState;
  navigate: (route: RouteState) => void;
  replace: (route: RouteState) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

/* ── Provider ───────────────────────────────────────────────────────────────── */

interface RouterProviderProps {
  initial?: RouteState;
  children: ReactNode;
}

export function RouterProvider({
  initial = { name: "loading" },
  children,
}: RouterProviderProps) {
  const [stack, setStack] = useState<RouteState[]>([initial]);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  /* Sync TG BackButton visibility with stack depth */
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    if (canGoBack) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }, [canGoBack]);

  /* Wire TG BackButton click → goBack */
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    const handler = () => goBack();
    tg.BackButton.onClick(handler);
    return () => { tg.BackButton.offClick(handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((route: RouteState) => {
    setStack((prev) => [...prev, route]);
  }, []);

  const replace = useCallback((route: RouteState) => {
    setStack((prev) => [...prev.slice(0, -1), route]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return (
    <RouterContext.Provider value={{ current, navigate, replace, goBack, canGoBack }}>
      {children}
    </RouterContext.Provider>
  );
}
