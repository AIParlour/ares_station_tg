/* ─────────────────────────────────────────────────────────────────────────────
   IntroScreen — first-time-only cold open ("Dossier Assembly").

   Format:
     Phase 1 — empty terminal (cursor pulses in the dark)
     Phase 2 — system handshake types in (green)
     Phase 3 — cursor shifts red; Paradox monologue, with each line summoning
               a new artifact onto the dossier (analyst card, station diagram,
               personnel grid, case file, redacted document, redaction reveal)
     Phase 4 — screen jitters; CLASSIFIED stamp punches across the dossier;
               three directives type in (RECOVER. RESTORE. REVEAL.)
     Phase 5 — [BEGIN] button; tap exits to home

   Total runtime ~22s. Tap-to-skip jumps to Phase 5; tap on [BEGIN] exits.
   First-time gate: localStorage["ares_intro_seen"] = "1".

   Deliberately omits any reference to specific content length ("six days") or
   to features that have not yet shipped (Paradox interrogation Q&A loop).
   When interrogation ships, surface those new lines in a separate
   "transmission resumed" overlay rather than retrofitting this screen.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "../../app/Router";
import { haptic, getTelegramWebApp } from "../../shared/hooks/useTelegram";
import styles from "./IntroScreen.module.css";

export const INTRO_SEEN_KEY = "ares_intro_seen";

export function hasSeenIntro(): boolean {
  try { return localStorage.getItem(INTRO_SEEN_KEY) === "1"; }
  catch { return false; }
}

function markIntroSeen() {
  try { localStorage.setItem(INTRO_SEEN_KEY, "1"); }
  catch { /* noop */ }
}

/* ── Beat sequence ────────────────────────────────────────────────────────────
   The runtime walks BEATS in order. Typed beats type one char at a time at
   `charMs`, then hold for `pauseAfterMs`. Atomic beats (shift / jitter /
   stamp / begin) hold for `durationMs` (begin holds forever — exit on tap).
   ───────────────────────────────────────────────────────────────────────────── */

type ArtifactKey = "analyst" | "station" | "crew" | "folder" | "document" | "reveal";

type Beat =
  | { kind: "system";    text: string; charMs: number; pauseAfterMs: number }
  | { kind: "paradox";   text: string; charMs: number; pauseAfterMs: number; artifact?: ArtifactKey }
  | { kind: "shift";     durationMs: number }
  | { kind: "jitter";    durationMs: number }
  | { kind: "stamp";     durationMs: number }
  | { kind: "directive"; text: string; charMs: number; pauseAfterMs: number }
  | { kind: "begin" };

const BEATS: Beat[] = [
  // ── Phase 2 — Uplink (green system text) ───────────────────────────────────
  { kind: "system", text: "> SECONDARY UPLINK ESTABLISHED", charMs: 15, pauseAfterMs: 220 },
  { kind: "system", text: "> ARES STATION",                  charMs: 15, pauseAfterMs: 220 },
  { kind: "system", text: "> AWAITING TERMINAL...",          charMs: 15, pauseAfterMs: 600 },
  { kind: "shift",  durationMs: 600 },

  // ── Phase 3 — Paradox + dossier assembly ───────────────────────────────────
  { kind: "paradox", text: "> Are you the new one?",                                       charMs: 28, pauseAfterMs: 700, artifact: "analyst"  },
  { kind: "paradox", text: "> Time loses meaning here. But I remember.",                   charMs: 28, pauseAfterMs: 700, artifact: "station"  },
  { kind: "paradox", text: "> This station went silent. I am the last voice that remains.", charMs: 28, pauseAfterMs: 800, artifact: "crew"    },
  { kind: "paradox", text: "> They have sent you to recover what was lost.",               charMs: 28, pauseAfterMs: 600, artifact: "folder"   },
  { kind: "paradox", text: "> They were wise to send only one.",                            charMs: 28, pauseAfterMs: 800, artifact: "document" },
  { kind: "paradox", text: "> Each day, a document will surface.",                          charMs: 28, pauseAfterMs: 350 },
  { kind: "paradox", text: "> You will restore what has been redacted.",                    charMs: 28, pauseAfterMs: 700, artifact: "reveal"   },
  { kind: "paradox", text: "> The truth is in the gaps.",                                   charMs: 28, pauseAfterMs: 700 },
  { kind: "paradox", text: "> Find what I have hidden.",                                    charMs: 28, pauseAfterMs: 600 },
  { kind: "jitter",  durationMs: 350 },

  // ── Phase 4 — Stamp + directives ───────────────────────────────────────────
  { kind: "stamp",     durationMs: 900 },
  { kind: "directive", text: "> RECOVER.", charMs: 30, pauseAfterMs: 220 },
  { kind: "directive", text: "> RESTORE.", charMs: 30, pauseAfterMs: 220 },
  { kind: "directive", text: "> REVEAL.",  charMs: 30, pauseAfterMs: 400 },

  // ── Phase 5 — Begin ────────────────────────────────────────────────────────
  { kind: "begin" },
];

const SHIFT_BEAT_INDEX  = BEATS.findIndex((b) => b.kind === "shift");
const JITTER_BEAT_INDEX = BEATS.findIndex((b) => b.kind === "jitter");
const STAMP_BEAT_INDEX  = BEATS.findIndex((b) => b.kind === "stamp");
const BEGIN_BEAT_INDEX  = BEATS.findIndex((b) => b.kind === "begin");
const LAST_BEAT_INDEX   = BEATS.length - 1;

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function useFirstName(): string {
  const tg = getTelegramWebApp();
  const name = tg?.initDataUnsafe?.user?.first_name?.trim();
  return name && name.length > 0 ? name.toUpperCase() : "OPERATIVE";
}

interface TypedLine { text: string; chars: number; complete: boolean; }

interface DerivedState {
  systemLines:       TypedLine[];
  paradoxLines:      TypedLine[];
  directives:        TypedLine[];
  revealedArtifacts: Set<ArtifactKey>;
  paradoxActive:     boolean;
  jittering:         boolean;
  stampShowing:      boolean;
  beginShowing:      boolean;
}

/** Walk the beat list up to (and including) the current beat, building the
 *  visible state. Pure function — easy to reason about, no effects. */
function deriveState(beatIndex: number, chars: number): DerivedState {
  const systemLines:  TypedLine[] = [];
  const paradoxLines: TypedLine[] = [];
  const directives:   TypedLine[] = [];
  const revealedArtifacts = new Set<ArtifactKey>();

  // Completed beats first
  for (let i = 0; i < beatIndex; i++) {
    const b = BEATS[i];
    if (b.kind === "system")
      systemLines.push({ text: b.text, chars: b.text.length, complete: true });
    else if (b.kind === "paradox") {
      paradoxLines.push({ text: b.text, chars: b.text.length, complete: true });
      if (b.artifact) revealedArtifacts.add(b.artifact);
    }
    else if (b.kind === "directive")
      directives.push({ text: b.text, chars: b.text.length, complete: true });
  }

  // Current (in-progress) typed beat
  const cur = BEATS[beatIndex];
  if (cur && (cur.kind === "system" || cur.kind === "paradox" || cur.kind === "directive")) {
    const fullChars = cur.text.length;
    const typed     = Math.min(chars, fullChars);
    const complete  = typed >= fullChars;

    if (cur.kind === "system")
      systemLines.push({ text: cur.text, chars: typed, complete });
    else if (cur.kind === "paradox") {
      paradoxLines.push({ text: cur.text, chars: typed, complete });
      // Artifact arrives the moment its summoning line finishes typing
      if (cur.artifact && complete) revealedArtifacts.add(cur.artifact);
    }
    else if (cur.kind === "directive")
      directives.push({ text: cur.text, chars: typed, complete });
  }

  return {
    systemLines,
    paradoxLines,
    directives,
    revealedArtifacts,
    paradoxActive: beatIndex >= SHIFT_BEAT_INDEX,
    jittering:     beatIndex === JITTER_BEAT_INDEX,
    stampShowing:  beatIndex >= STAMP_BEAT_INDEX,
    beginShowing:  beatIndex >= BEGIN_BEAT_INDEX,
  };
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export function IntroScreen() {
  const { replace } = useRouter();
  const analystName = useFirstName();

  const [beatIndex, setBeatIndex] = useState(0);
  const [chars, setChars]         = useState(0);
  const skippedRef = useRef(false);

  const finish = useCallback(() => {
    markIntroSeen();
    haptic("impact", "medium");
    replace({ name: "home" });
  }, [replace]);

  /* ── Drive the timeline ────────────────────────────────────────────────── */
  useEffect(() => {
    const beat = BEATS[beatIndex];
    if (!beat) return;
    if (beat.kind === "begin") return; // terminal — wait for tap

    if (beat.kind === "shift" || beat.kind === "jitter" || beat.kind === "stamp") {
      const t = window.setTimeout(() => {
        setBeatIndex((n) => n + 1);
        setChars(0);
      }, beat.durationMs);
      return () => window.clearTimeout(t);
    }

    // Typed beat — system / paradox / directive
    const fullLen = beat.text.length;
    if (chars < fullLen) {
      const t = window.setTimeout(() => setChars((c) => c + 1), beat.charMs);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setBeatIndex((n) => n + 1);
      setChars(0);
    }, beat.pauseAfterMs);
    return () => window.clearTimeout(t);
  }, [beatIndex, chars]);

  /* ── Tap handler ───────────────────────────────────────────────────────────
     First tap during the timeline jumps straight to the BEGIN beat (so the
     player can read at their own pace). Second tap (now on BEGIN) exits.
     ───────────────────────────────────────────────────────────────────────── */
  const handleTap = useCallback(() => {
    const beat = BEATS[beatIndex];
    if (beat?.kind === "begin") {
      finish();
      return;
    }
    if (skippedRef.current) return;
    skippedRef.current = true;
    haptic("selection");
    setBeatIndex(LAST_BEAT_INDEX);
    setChars(0);
  }, [beatIndex, finish]);

  const derived      = deriveState(beatIndex, chars);
  const currentBeat  = BEATS[beatIndex];
  const currentKind  = currentBeat?.kind;

  return (
    <div
      className={`${styles.intro} ${derived.paradoxActive ? styles["intro--paradox"] : ""}`}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label="Intro sequence: tap to advance"
    >
      <div className={styles.intro__scanlines} aria-hidden />
      <div className={styles.intro__grain}     aria-hidden />

      <header className={styles.intro__header}>
        <span>CASE FILE // ASSIGNED</span>
        <span className={styles.intro__header__name}>ANALYST: {analystName}</span>
      </header>

      <DossierStage
        revealed={derived.revealedArtifacts}
        analystName={analystName}
        jittering={derived.jittering}
        stampShowing={derived.stampShowing}
      />

      <Terminal
        systemLines={derived.systemLines}
        paradoxLines={derived.paradoxLines}
        directives={derived.directives}
        currentSystemTyping={currentKind === "system"}
        currentParadoxTyping={currentKind === "paradox"}
        currentDirectiveTyping={currentKind === "directive"}
        beginShowing={derived.beginShowing}
      />

      {!derived.beginShowing && (
        <div className={styles.intro__skip}>TAP TO SKIP</div>
      )}
    </div>
  );
}

/* ── Dossier ───────────────────────────────────────────────────────────────── */

function DossierStage({
  revealed,
  analystName,
  jittering,
  stampShowing,
}: {
  revealed: Set<ArtifactKey>;
  analystName: string;
  jittering: boolean;
  stampShowing: boolean;
}) {
  return (
    <div className={`${styles.dossier} ${jittering ? styles["dossier--jittering"] : ""}`}>
      <div className={styles.dossier__row}>
        {revealed.has("analyst") && <AnalystCard name={analystName} />}
        {revealed.has("station") && <StationDiagram />}
      </div>

      {revealed.has("crew") && <PersonnelGrid />}

      <CaseFile
        showFolder={revealed.has("folder")}
        showDocument={revealed.has("document")}
        showReveal={revealed.has("reveal")}
      />

      {stampShowing && <ClassifiedStamp />}
    </div>
  );
}

function AnalystCard({ name }: { name: string }) {
  return (
    <div className={`${styles.card} ${styles["card--analyst"]}`}>
      <div className={styles.card__icon}>
        <svg viewBox="0 0 32 32" aria-hidden focusable="false">
          <circle cx="16" cy="11" r="5" fill="currentColor" opacity="0.55" />
          <path d="M 5 30 Q 5 19 16 19 Q 27 19 27 30 Z" fill="currentColor" opacity="0.55" />
        </svg>
      </div>
      <div className={styles.card__body}>
        <div className={styles.card__label}>ANALYST</div>
        <div className={styles.card__value}>{name}</div>
        <div className={styles.card__sub}>PROVISIONAL CLEARANCE</div>
      </div>
    </div>
  );
}

function StationDiagram() {
  return (
    <div className={`${styles.card} ${styles["card--station"]}`}>
      <svg viewBox="0 0 60 60" className={styles.station__svg} aria-hidden focusable="false">
        <g className={styles.station__rotor}>
          <circle cx="30" cy="30" r="3"  fill="none" stroke="currentColor" strokeWidth="0.8" />
          <line   x1="30" y1="30" x2="30" y2="9"   stroke="currentColor" strokeWidth="0.7" />
          <line   x1="30" y1="30" x2="48" y2="40"  stroke="currentColor" strokeWidth="0.7" />
          <line   x1="30" y1="30" x2="12" y2="40"  stroke="currentColor" strokeWidth="0.7" />
          <rect   x="27" y="4"  width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <rect   x="46" y="36" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <rect   x="6"  y="36" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </g>
        <circle cx="30" cy="30" r="2" className={styles.station__pulse} />
      </svg>
      <div className={styles.card__label}>ARES STATION</div>
    </div>
  );
}

function PersonnelGrid() {
  return (
    <div className={`${styles.card} ${styles["card--crew"]}`}>
      <div className={styles.card__label}>PERSONNEL — STATUS UNKNOWN</div>
      <div className={styles.crew__grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.crew__cell}>
            <svg viewBox="0 0 32 32" aria-hidden focusable="false" className={styles.crew__face}>
              <circle cx="16" cy="12" r="5" fill="currentColor" opacity="0.45" />
              <path d="M 6 28 Q 6 18 16 18 Q 26 18 26 28 Z" fill="currentColor" opacity="0.45" />
            </svg>
            <div className={styles.crew__bar} />
            <div className={styles.crew__id}>0{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseFile({
  showFolder,
  showDocument,
  showReveal,
}: {
  showFolder: boolean;
  showDocument: boolean;
  showReveal: boolean;
}) {
  if (!showFolder) return null;

  const cls = [
    styles.card,
    styles["card--file"],
    showDocument ? styles["card--file-open"] : "",
    showReveal   ? styles["card--file-revealed"] : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <div className={styles.file__tab}>S1-D001</div>
      <div className={styles.file__label}>CASE FILE — EVIDENCE FRAGMENT</div>

      {showDocument && (
        <div className={styles.file__page}>
          <p className={styles.file__line}>
            <Bar peeled={showReveal} text="Something" />
            {" is wrong "}
            <Bar peeled={showReveal} text="with the relay" />
          </p>
          <p className={styles.file__line}>
            <Bar peeled={false} />
            {" lying about "}
            <Bar peeled={false} />
          </p>
        </div>
      )}
    </div>
  );
}

function Bar({ peeled, text }: { peeled: boolean; text?: string }) {
  if (peeled && text) {
    return <span className={styles.file__bar__revealed}>{text}</span>;
  }
  return <span className={styles.file__bar} />;
}

function ClassifiedStamp() {
  return (
    <div className={styles.stamp} aria-hidden>
      <span>CLASSIFIED</span>
    </div>
  );
}

/* ── Terminal ──────────────────────────────────────────────────────────────── */

function Terminal({
  systemLines,
  paradoxLines,
  directives,
  currentSystemTyping,
  currentParadoxTyping,
  currentDirectiveTyping,
  beginShowing,
}: {
  systemLines: TypedLine[];
  paradoxLines: TypedLine[];
  directives: TypedLine[];
  currentSystemTyping: boolean;
  currentParadoxTyping: boolean;
  currentDirectiveTyping: boolean;
  beginShowing: boolean;
}) {
  return (
    <div className={styles.terminal}>
      {systemLines.map((line, i) => {
        const isCurrent = currentSystemTyping && i === systemLines.length - 1 && !line.complete;
        return (
          <p key={`sys-${i}`} className={`${styles.terminal__line} ${styles["terminal__line--system"]}`}>
            {line.text.slice(0, line.chars)}
            {isCurrent && <span className={styles.terminal__cursor}>▌</span>}
          </p>
        );
      })}

      {paradoxLines.map((line, i) => {
        const isCurrent = currentParadoxTyping && i === paradoxLines.length - 1 && !line.complete;
        return (
          <p key={`para-${i}`} className={`${styles.terminal__line} ${styles["terminal__line--paradox"]}`}>
            {line.text.slice(0, line.chars)}
            {isCurrent && <span className={styles.terminal__cursor}>▌</span>}
          </p>
        );
      })}

      {directives.map((line, i) => {
        const isCurrent = currentDirectiveTyping && i === directives.length - 1 && !line.complete;
        return (
          <p key={`dir-${i}`} className={`${styles.terminal__line} ${styles["terminal__line--directive"]}`}>
            {line.text.slice(0, line.chars)}
            {isCurrent && <span className={styles.terminal__cursor}>▌</span>}
          </p>
        );
      })}

      {beginShowing && (
        <button className={styles.terminal__begin} type="button">
          [ BEGIN ]
        </button>
      )}
    </div>
  );
}
