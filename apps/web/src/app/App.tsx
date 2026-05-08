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
import { IntroScreen }      from "../features/intro/IntroScreen";
import { DrillsHubScreen }    from "../features/drills/DrillsHubScreen";
import { CipherDrillScreen }  from "../features/drills/cipher/CipherDrillScreen";
import { SensorDrillScreen }  from "../features/drills/sensor/SensorDrillScreen";
import { PatternDrillScreen } from "../features/drills/pattern/PatternDrillScreen";
import { DriftDrillScreen }   from "../features/drills/drift/DriftDrillScreen";
import { WorkoutScreen }      from "../features/drills/workout/WorkoutScreen";
import { initTelegramWebApp } from "../shared/hooks/useTelegram";
import screenStyles from "./Screen.module.css";

/* ── TG boot (runs once at app start) ──────────────────────────────────────── */

function TelegramBoot() {
  useEffect(() => {
    initTelegramWebApp();
  }, []);
  return null;
}

/* ── Screen switcher ────────────────────────────────────────────────────────── */

function renderScreen(route: { name: string; params?: Record<string, unknown> }) {
  switch (route.name) {
    case "loading":   return <LoadingScreen />;
    case "intro":     return <IntroScreen />;
    case "home":      return <HomeScreen />;
    case "document":  return <DocumentScreen />;
    case "puzzle":    return <PuzzleScreen />;
    case "finale":    return <FinaleScreen />;
    case "documents": return <DocumentsScreen />;
    case "shop":      return <ShopScreen />;
    case "map":       return <MapScreen />;
    case "logs":      return <LogBrowserScreen />;
    case "story":     return <StoryScreen />;
    case "drills":    return <DrillsHubScreen />;
    case "drillRun": {
      const drillType = route.params?.drillType;
      switch (drillType) {
        case "cipher":  return <CipherDrillScreen />;
        case "sensor":  return <SensorDrillScreen />;
        case "pattern": return <PatternDrillScreen />;
        case "drift":   return <DriftDrillScreen />;
        default:        return <DrillsHubScreen />;
      }
    }
    case "workoutRun": return <WorkoutScreen />;
    default:          return <LoadingScreen />;
  }
}

/**
 * Screens — wraps the current route in a keyed div so React re-mounts
 * the wrapper on every navigation. The wrapper's CSS keyframe fade-in
 * therefore replays on each route change → soft cross-fade transitions
 * rather than hard cuts.
 */
function Screens() {
  const { current } = useRouter();
  // Key includes params so navigating between two `puzzle` routes with
  // different slots also triggers the fade.
  const key = `${current.name}::${stableKey(current.params)}`;

  return (
    <div key={key} className={screenStyles.screen}>
      {renderScreen(current)}
    </div>
  );
}

function stableKey(params?: Record<string, unknown>): string {
  if (!params) return "";
  const keys = Object.keys(params).sort();
  return keys.map((k) => `${k}=${String(params[k])}`).join("&");
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
