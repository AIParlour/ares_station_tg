/* ─────────────────────────────────────────────────────────────────────────────
   App — thin entry point.
   Provides: RouterProvider → GameProvider → screen rendering.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { RouterProvider, useRouter } from "./Router";
import { GameProvider } from "../features/game/GameProvider";
import { LoadingScreen }   from "../features/loading/LoadingScreen";
import { HomeScreen }      from "../features/home/HomeScreen";
import { DocumentScreen }  from "../features/game/document/DocumentScreen";
import { PuzzleScreen }    from "../features/game/puzzle/PuzzleScreen";
import { FinaleScreen }    from "../features/game/finale/FinaleScreen";
import { DocumentsScreen } from "../features/documents/DocumentsScreen";
import { ShopScreen }      from "../features/shop/ShopScreen";
import { MapScreen }       from "../features/map/MapScreen";
import { LogBrowserScreen } from "../features/game/logs/LogBrowserScreen";
import { StoryScreen }      from "../features/game/story/StoryScreen";
import { initTelegramWebApp } from "../shared/hooks/useTelegram";

/* ── TG boot (runs once at app start) ──────────────────────────────────────── */

function TelegramBoot() {
  useEffect(() => {
    initTelegramWebApp();
  }, []);
  return null;
}

/* ── Screen switcher ────────────────────────────────────────────────────────── */

function Screens() {
  const { current } = useRouter();

  switch (current.name) {
    case "loading":   return <LoadingScreen />;
    case "home":      return <HomeScreen />;
    case "document":  return <DocumentScreen />;
    case "puzzle":    return <PuzzleScreen />;
    case "finale":    return <FinaleScreen />;
    case "documents": return <DocumentsScreen />;
    case "shop":      return <ShopScreen />;
    case "map":       return <MapScreen />;
    case "logs":      return <LogBrowserScreen />;
    case "story":     return <StoryScreen />;
    default:          return <LoadingScreen />;
  }
}

/* ── Root ───────────────────────────────────────────────────────────────────── */

export function App() {
  return (
    <RouterProvider initial={{ name: "loading" }}>
      <TelegramBoot />
      <GameProvider>
        <Screens />
      </GameProvider>
    </RouterProvider>
  );
}
