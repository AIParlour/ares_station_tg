/* ─────────────────────────────────────────────────────────────────────────────
   StationMap — SVG top-down schematic of Ares Station.
   Sectors render as locked (greyed) or unlocked based on player progression.
   ───────────────────────────────────────────────────────────────────────────── */

import styles from "./MapScreen.module.css";

export type SectorId =
  | "crash-site"
  | "airlock-a1"
  | "module-a"
  | "module-b"
  | "module-c"
  | "module-d"
  | "module-e"
  | "east-e5"
  | "east-e6"
  | "east-e7"
  | "comms-array"
  | "meteo-station";

export interface SectorDef {
  id:       SectorId;
  label:    string;
  sublabel?: string;
  reason?:  string;          // shown when locked
  sealed?:  boolean;         // permanently sealed — different visual from "locked"
  external?: boolean;        // outside the station hull
  event?:   boolean;         // environmental log event detected here
}

export const SECTORS: SectorDef[] = [
  {
    id:       "crash-site",
    label:    "CRASH SITE",
    sublabel: "SHUTTLE WRECKAGE",
    external: true,
  },
  {
    id:       "airlock-a1",
    label:    "AIRLOCK A-1",
    sublabel: "ENTRY POINT",
  },
  {
    id:       "module-a",
    label:    "MODULE A",
    sublabel: "OPERATIONS / LIFE SUPPORT",
  },
  {
    id:       "module-b",
    label:    "MODULE B",
    sublabel: "CREW QUARTERS",
    reason:   "BULKHEAD SEALED — EMERGENCY PROTOCOL 7.3",
  },
  {
    id:       "module-c",
    label:    "MODULE C",
    sublabel: "RESEARCH / HYDROPONICS",
    reason:   "ATMOSPHERIC INTEGRITY CHECK PENDING",
  },
  {
    id:       "module-d",
    label:    "MODULE D",
    sublabel: "MEDICAL BAY",
    reason:   "MEDICAL SYSTEMS OFFLINE",
  },
  {
    id:       "module-e",
    label:    "MODULE E",
    sublabel: "EAST WING ACCESS",
    reason:   "ACCESS RESTRICTED — SEE AUTHORITY DIRECTIVE",
  },
  {
    id:       "east-e5",
    label:    "E-5",
    sealed:   true,
    reason:   "SEALED — MHA-ARES-FA §4.2",
  },
  {
    id:       "east-e6",
    label:    "E-6",
    sealed:   true,
    reason:   "SEALED — MHA-ARES-FA §4.2",
  },
  {
    id:       "east-e7",
    label:    "E-7",
    sealed:   true,
    reason:   "SCHEDULED MAINTENANCE (DAY 4,018)",
  },
  {
    id:       "comms-array",
    label:    "COMMS ARRAY",
    external: true,
    reason:   "OFFLINE — STORM DAMAGE",
  },
  {
    id:       "meteo-station",
    label:    "METEO STATION",
    external: true,
    reason:   "METEOROLOGICAL SYSTEMS OFFLINE",
  },
];

interface StationMapProps {
  unlockedSectors: SectorId[];
  eventSectors?:   SectorId[];   // sectors with recent environmental log events
  onSectorClick?:  (id: SectorId) => void;
}

export function StationMap({ unlockedSectors, eventSectors = [], onSectorClick }: StationMapProps) {

  const isUnlocked = (id: SectorId) => unlockedSectors.includes(id);
  const hasEvent   = (id: SectorId) => eventSectors.includes(id);
  const sector     = (id: SectorId) => SECTORS.find((s) => s.id === id)!;

  const sectorClass = (id: SectorId) => {
    const s = sector(id);
    if (s.sealed)           return styles.map__sector__sealed;
    if (!isUnlocked(id))    return styles.map__sector__locked;
    if (s.external)         return styles.map__sector__external;
    return styles.map__sector__unlocked;
  };

  return (
    <svg
      viewBox="0 0 300 520"
      className={styles.map__svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Defs ──────────────────────────────────────────────────────────── */}
      <defs>
        <filter id="event-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <pattern id="sealed-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#3f1a1a" strokeWidth="2" />
        </pattern>
      </defs>

      {/* ── EXTERNAL: Comms Array ──────────────────────────────────────── */}
      <SectorRect
        x={20} y={18} w={80} h={36}
        id="comms-array"
        className={sectorClass("comms-array")}
        hasEvent={hasEvent("comms-array")}
        onClick={onSectorClick}
      >
        <text x="60" y="33" className={styles.map__label}>COMMS</text>
        <text x="60" y="45" className={styles.map__sublabel}>ARRAY</text>
      </SectorRect>

      {/* ── EXTERNAL: Meteo Station ───────────────────────────────────── */}
      <SectorRect
        x={200} y={18} w={80} h={36}
        id="meteo-station"
        className={sectorClass("meteo-station")}
        hasEvent={hasEvent("meteo-station")}
        onClick={onSectorClick}
      >
        <text x="240" y="33" className={styles.map__label}>METEO</text>
        <text x="240" y="45" className={styles.map__sublabel}>STATION</text>
      </SectorRect>

      {/* ── Connector lines: external to east wing ───────────────────── */}
      <Connector x1={60}  y1={54} x2={80}  y2={80} locked={!isUnlocked("comms-array")} />
      <Connector x1={240} y1={54} x2={220} y2={80} locked={!isUnlocked("meteo-station")} />

      {/* ── EAST WING: Sealed modules ─────────────────────────────────── */}
      <SectorRect
        x={42} y={78} w={52} h={38}
        id="east-e5"
        className={sectorClass("east-e5")}
        hasEvent={hasEvent("east-e5")}
        onClick={onSectorClick}
      >
        <text x="68" y="101" className={styles.map__label}>E-5</text>
      </SectorRect>

      <SectorRect
        x={124} y={78} w={52} h={38}
        id="east-e6"
        className={sectorClass("east-e6")}
        hasEvent={hasEvent("east-e6")}
        onClick={onSectorClick}
      >
        <text x="150" y="101" className={styles.map__label}>E-6</text>
      </SectorRect>

      <SectorRect
        x={206} y={78} w={52} h={38}
        id="east-e7"
        className={sectorClass("east-e7")}
        hasEvent={hasEvent("east-e7")}
        onClick={onSectorClick}
      >
        <text x="232" y="101" className={styles.map__label}>E-7</text>
      </SectorRect>

      {/* ── Connector: sealed modules to Module E ─────────────────────── */}
      <Connector x1={150} y1={116} x2={150} y2={140} locked={true} />

      {/* ── MODULE E: East wing access ───────────────────────────────── */}
      <SectorRect
        x={94} y={138} w={112} h={44}
        id="module-e"
        className={sectorClass("module-e")}
        hasEvent={hasEvent("module-e")}
        onClick={onSectorClick}
      >
        <text x="150" y="156" className={styles.map__label}>MODULE E</text>
        <text x="150" y="169" className={styles.map__sublabel}>EAST WING ACCESS</text>
      </SectorRect>

      {/* ── Connectors: E to horizontal corridor ─────────────────────── */}
      <Connector x1={94}  y1={160} x2={60}  y2={205} locked={!isUnlocked("module-e")} />
      <Connector x1={206} y1={160} x2={240} y2={205} locked={!isUnlocked("module-e")} />
      <Connector x1={150} y1={182} x2={150} y2={206} locked={!isUnlocked("module-e")} />

      {/* ── MODULE C ─────────────────────────────────────────────────── */}
      <SectorRect
        x={6} y={204} w={98} h={48}
        id="module-c"
        className={sectorClass("module-c")}
        hasEvent={hasEvent("module-c")}
        onClick={onSectorClick}
      >
        <text x="55" y="223" className={styles.map__label}>MODULE C</text>
        <text x="55" y="237" className={styles.map__sublabel}>RESEARCH</text>
        <text x="55" y="248" className={styles.map__sublabel}>HYDROPONICS</text>
      </SectorRect>

      {/* ── HORIZONTAL CORRIDOR ──────────────────────────────────────── */}
      <rect
        x={104} y={214} width={92} height={28}
        className={`${styles.map__corridor} ${!isUnlocked("module-a") ? styles["map__corridor--locked"] : ""}`}
        rx={2}
      />
      <text x="150" y="233" className={styles.map__corridor__label}>CORRIDOR</text>

      {/* ── MODULE D ─────────────────────────────────────────────────── */}
      <SectorRect
        x={196} y={204} w={98} h={48}
        id="module-d"
        className={sectorClass("module-d")}
        hasEvent={hasEvent("module-d")}
        onClick={onSectorClick}
      >
        <text x="245" y="223" className={styles.map__label}>MODULE D</text>
        <text x="245" y="237" className={styles.map__sublabel}>MEDICAL BAY</text>
      </SectorRect>

      {/* ── Connector: corridor to Module B ──────────────────────────── */}
      <Connector x1={150} y1={242} x2={150} y2={268} locked={!isUnlocked("module-b")} />

      {/* ── MODULE B ─────────────────────────────────────────────────── */}
      <SectorRect
        x={80} y={266} w={140} h={48}
        id="module-b"
        className={sectorClass("module-b")}
        hasEvent={hasEvent("module-b")}
        onClick={onSectorClick}
      >
        <text x="150" y="286" className={styles.map__label}>MODULE B</text>
        <text x="150" y="300" className={styles.map__sublabel}>CREW QUARTERS</text>
      </SectorRect>

      {/* ── Connector: Module B to Module A ──────────────────────────── */}
      <Connector x1={150} y1={314} x2={150} y2={338} locked={!isUnlocked("module-a")} />

      {/* ── MODULE A ─────────────────────────────────────────────────── */}
      <SectorRect
        x={60} y={336} w={180} h={56}
        id="module-a"
        className={sectorClass("module-a")}
        hasEvent={hasEvent("module-a")}
        onClick={onSectorClick}
      >
        <text x="150" y="358" className={styles.map__label}>MODULE A</text>
        <text x="150" y="372" className={styles.map__sublabel}>OPERATIONS</text>
        <text x="150" y="383" className={styles.map__sublabel}>LIFE SUPPORT</text>
      </SectorRect>

      {/* ── Connector: Module A to Airlock ───────────────────────────── */}
      <Connector x1={150} y1={392} x2={150} y2={412} locked={false} />

      {/* ── AIRLOCK A-1 ──────────────────────────────────────────────── */}
      <SectorRect
        x={110} y={410} w={80} h={30}
        id="airlock-a1"
        className={sectorClass("airlock-a1")}
        hasEvent={hasEvent("airlock-a1")}
        onClick={onSectorClick}
      >
        <text x="150" y="430" className={styles.map__label}>AIRLOCK A-1</text>
      </SectorRect>

      {/* ── Connector: Airlock to Crash Site ─────────────────────────── */}
      <line
        x1={150} y1={440} x2={150} y2={458}
        className={styles.map__connector__external}
        strokeDasharray="4 3"
      />

      {/* ── CRASH SITE (external) ────────────────────────────────────── */}
      <SectorRect
        x={96} y={456} w={108} h={36}
        id="crash-site"
        className={sectorClass("crash-site")}
        hasEvent={hasEvent("crash-site")}
        onClick={onSectorClick}
      >
        <text x="150" y="470" className={styles.map__label}>CRASH SITE</text>
        <text x="150" y="482" className={styles.map__sublabel}>SHUTTLE WRECKAGE</text>
      </SectorRect>

      {/* ── YOU ARE HERE marker ──────────────────────────────────────── */}
      <circle cx={150} cy={474} r={3} className={styles.map__you} />

    </svg>
  );
}

/* ── Helper components ───────────────────────────────────────────────────── */

interface SectorRectProps {
  x: number; y: number; w: number; h: number;
  id: SectorId;
  className: string;
  hasEvent: boolean;
  onClick?: (id: SectorId) => void;
  children?: React.ReactNode;
}

function SectorRect({ x, y, w, h, id, className, hasEvent, onClick, children }: SectorRectProps) {
  return (
    <g
      className={`${styles.map__sector} ${className} ${hasEvent ? styles["map__sector--event"] : ""}`}
      onClick={() => onClick?.(id)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <rect x={x} y={y} width={w} height={h} rx={3} />
      {hasEvent && (
        <rect
          x={x} y={y} width={w} height={h} rx={3}
          className={styles.map__event__pulse}
          filter="url(#event-glow)"
        />
      )}
      {children}
    </g>
  );
}

interface ConnectorProps {
  x1: number; y1: number; x2: number; y2: number;
  locked: boolean;
}

function Connector({ x1, y1, x2, y2, locked }: ConnectorProps) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      className={locked ? styles.map__connector__locked : styles.map__connector}
    />
  );
}
