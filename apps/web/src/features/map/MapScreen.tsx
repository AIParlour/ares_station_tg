/* ─────────────────────────────────────────────────────────────────────────────
   MapScreen — Station map screen.
   Derives unlocked sectors from game state and renders StationMap SVG.
   Clicking a sector opens a detail panel with lock reason / status.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Classification } from "../../shared/ui/Classification/Classification";
import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { useRouter } from "../../app/Router";
import { useGame } from "../game/GameProvider";
import { StationMap, SECTORS } from "./StationMap";
import type { SectorId } from "./StationMap";
import styles from "./MapScreen.module.css";

/* ── Sector unlock logic ─────────────────────────────────────────────────────── */

/**
 * Derives which sectors are accessible based on current game state.
 * Ties to the three-phase discovery arc:
 *   Phase 1 (survival):     crash-site, airlock-a1, module-a
 *   Phase 1+ (puzzles):     module-b, module-c / module-d as words accumulate
 *   Phase 2 (comms):        comms-array, meteo-station
 *   Phase 3 (full picture): module-e, east wing
 */
function deriveUnlockedSectors(
  dayLoaded: boolean,
  unlockedWords: string[],
): SectorId[] {
  const unlocked: SectorId[] = [];

  // Always accessible — player origin
  unlocked.push("crash-site", "airlock-a1");

  if (!dayLoaded) return unlocked;

  // Phase 1: life support restored (day 1 active)
  unlocked.push("module-a");

  const words = unlockedWords.length;

  // Each solved puzzle opens more of the station
  if (words >= 1) unlocked.push("module-b");
  if (words >= 3) unlocked.push("module-c", "module-d");

  // Phase 2: comms array + meteo station restored
  if (words >= 5) {
    unlocked.push("comms-array", "meteo-station");
  }

  // Phase 3: east wing access
  if (words >= 8) {
    unlocked.push("module-e");
  }

  return unlocked;
}

/* ── MapScreen ───────────────────────────────────────────────────────────────── */

export function MapScreen() {
  const { goBack } = useRouter();
  const { state } = useGame();
  const [selectedId, setSelectedId] = useState<SectorId | null>(null);

  const unlockedSectors = deriveUnlockedSectors(
    state.day !== null,
    state.unlockedWords,
  );

  // eventSectors: any sector mentioned in environmental logs for today's day
  // In the POC we derive this from unlockedWords length as a proxy for story day
  const eventSectors: SectorId[] = deriveEventSectors(state.unlockedWords.length);

  const selectedSector = selectedId ? SECTORS.find((s) => s.id === selectedId) : null;
  const isUnlocked     = selectedId ? unlockedSectors.includes(selectedId) : false;
  const hasEvent       = selectedId ? eventSectors.includes(selectedId) : false;

  const handleSectorClick = (id: SectorId) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleClose = () => setSelectedId(null);

  return (
    <div className={styles.map__screen}>
      <Classification level="standard" />
      <TopBar title="STATION SCHEMATIC" onBack={goBack} />

      <div className={styles.map__scroll}>
        <p className={styles.map__title}>ARES STATION // SECTOR MAP // ACCESS LEVEL: PROVISIONAL</p>

        <StationMap
          unlockedSectors={unlockedSectors}
          eventSectors={eventSectors}
          onSectorClick={handleSectorClick}
        />

        <Legend />
      </div>

      {/* Sector detail panel */}
      {selectedSector && (
        <div className={styles.map__detail}>
          <div className={styles.map__detail__header}>
            <div>
              <div className={styles.map__detail__title}>{selectedSector.label}</div>
              {selectedSector.sublabel && (
                <div className={styles.map__detail__subtitle}>{selectedSector.sublabel}</div>
              )}
            </div>
            <button
              className={styles.map__detail__close}
              onClick={handleClose}
              aria-label="Close sector detail"
            >
              CLOSE
            </button>
          </div>

          <StatusBadge sector={selectedSector} unlocked={isUnlocked} />

          {hasEvent && (
            <div className={styles.map__detail__event}>
              ⬤ ENVIRONMENTAL EVENT DETECTED
            </div>
          )}

          {!isUnlocked && selectedSector.reason && (
            <div className={styles.map__detail__reason}>
              {selectedSector.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function StatusBadge({
  sector,
  unlocked,
}: {
  sector: (typeof SECTORS)[number];
  unlocked: boolean;
}) {
  if (sector.sealed) {
    return (
      <div className={`${styles.map__detail__status} ${styles["map__detail__status--sealed"]}`}>
        PERMANENTLY SEALED
      </div>
    );
  }
  if (unlocked && sector.external) {
    return (
      <div className={`${styles.map__detail__status} ${styles["map__detail__status--external"]}`}>
        EXTERNAL — ACCESSIBLE
      </div>
    );
  }
  if (unlocked) {
    return (
      <div className={`${styles.map__detail__status} ${styles["map__detail__status--unlocked"]}`}>
        ACCESS GRANTED
      </div>
    );
  }
  return (
    <div className={`${styles.map__detail__status} ${styles["map__detail__status--locked"]}`}>
      ACCESS RESTRICTED
    </div>
  );
}

function Legend() {
  return (
    <div className={styles.map__legend}>
      <span className={styles.map__legend__item}>
        <span className={`${styles.map__legend__dot} ${styles["map__legend__dot--unlocked"]}`} />
        ACCESSIBLE
      </span>
      <span className={styles.map__legend__item}>
        <span className={`${styles.map__legend__dot} ${styles["map__legend__dot--locked"]}`} />
        RESTRICTED
      </span>
      <span className={styles.map__legend__item}>
        <span className={`${styles.map__legend__dot} ${styles["map__legend__dot--sealed"]}`} />
        SEALED
      </span>
      <span className={styles.map__legend__item}>
        <span className={`${styles.map__legend__dot} ${styles["map__legend__dot--event"]}`} />
        EVENT LOGGED
      </span>
    </div>
  );
}

/* ── Event sector derivation ─────────────────────────────────────────────────── */

/**
 * Maps story progression (word count proxy) to active environmental event sectors.
 * Mirrors the week-1 daily log arc:
 *   Day 1-2: module-a (pressure differential)
 *   Day 3:   module-c, module-b (movement, sound)
 *   Day 4:   module-d (oxygen)
 *   Day 5:   module-c (vocalisation)
 *   Day 6:   module-b, module-d (simultaneous)
 *   Day 7+:  module-b, module-c, module-d (all active)
 */
function deriveEventSectors(wordCount: number): SectorId[] {
  if (wordCount === 0) return ["module-a"];
  if (wordCount === 1) return ["module-a", "module-c"];
  if (wordCount === 2) return ["module-c", "module-b"];
  if (wordCount === 3) return ["module-d"];
  if (wordCount === 4) return ["module-c"];
  if (wordCount >= 5) return ["module-b", "module-c", "module-d"];
  return [];
}
