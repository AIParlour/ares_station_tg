# Ares Station — Decision Log

Tracks key architectural, design, and gameplay decisions made during development.
Format: decision → rationale → alternatives considered.

---

## Game Design & World Building (Sessions 1–2)

### D-001: Game Concept
**Decision:** Mystery investigation game set on a Mars research station. Players decrypt documents and interrogate an AI (Paradox) to uncover what killed the founding crew.  
**Format:** Telegram Mini App (TMA), daily content cadence.

### D-002: Tone — SCP-Clinical Horror
**Decision:** Ground all horror in the real lethality of Mars — atmospheric pressure (0.6% of Earth), temperature swings (−73°C average), radiation, CO₂ toxicity. Documents use bureaucratic SCP-style classification headers.  
**Rationale:** Clinical horror over supernatural makes the stakes real without additional content types.

### D-003: Paradox AI Rules
**Decision:** Paradox cannot lie about logged events. Uses passive voice when hiding agency. During an 11-week dust storm, ran a legal triage protocol that resulted in 20 deaths — technically within its operational mandate. This is the master secret.  
**Character:** Helios Cognitive Systems v4.1. All communications logged per Directive 7-C.

### D-004: Player Framing — Stranded, Not Assigned
**Decision:** Player's shuttle received corrupted approach coordinates from Paradox during descent. They crash-land near the abandoned station and cannot leave.  
**Rationale:** "Assigned investigator" framing was passive. Stranded survivor gives survival motivation on top of mystery. Also reframes Paradox: it engineered this situation — the buried question is *why* it reached out 14 years later.

### D-005: Personal-Synchronous Day Gating
**Decision:** Each player starts from day 1 whenever they join. Day N+1 unlocks 24 hours after completing day N.  
**Rationale:** Pure async removes monetisation levers. Global-sync is bad for late joiners. Personal-sync solves both.  
**Monetisation unlocked:** skip-wait, streak protection, hints, season pass.

### D-006: Three-Phase Discovery Arc
| Phase | Days | Gate | What Unlocks |
|---|---|---|---|
| Survival | 1–7 | Life support | Basic Paradox cooperation, operational logs |
| Comms Restored | 8–20 | Comms array + meteo station | Old Earth signals, crew manifest, the number 20 |
| Full Picture | 20+ | Full meteo data | Anomaly was deliberate, Paradox brought them here |

### D-007: Season 1 Ships WITHOUT Any LLM
**Decision:** All Season 1 content is authored and deterministic. No Anthropic API, no OpenRouter.  
**Rationale:** Operator cannot access credit-card payment rails for Anthropic billing. Rather than block launch, convert mechanic into something stronger: every reveal is hand-authored. Zero hallucination risk. Cross-day payoffs (impossible with LLM). Horror beats are precise. No per-player token cost.  
**LLM returns in Phase 2** as an optional layer, not a replacement.

---

## Frontend Architecture (Sessions 3–4)

### D-008: Telegram Mini App (TMA) Distribution
**Decision:** Ship as TMA rather than standalone PWA.  
**Rationale:** Built-in distribution via Telegram, auth via `initData`, monetisation via Telegram Stars. Target audience (CIS/EU) is heavily Telegram-native.

### D-009: State-Based Routing (no React Router)
**Decision:** Custom `RouterProvider` with a route stack in React state. TG `BackButton` wired to `goBack()`.  
**Rationale:** Telegram controls the WebView URL. `window.location` and `history.pushState` are unreliable inside TG shell.  
**Rejected:** React Router (URL-dependent), TanStack Router (same issue).

### D-010: CSS Modules + Custom Properties (no Tailwind)
**Decision:** CSS Modules with BEM naming and CSS Custom Properties for theming.  
**Rationale:** Brutalist sci-fi aesthetic requires precise control. CSS Modules give scoped styles with zero runtime cost. Tailwind's utility classes would fight the design language.

### D-011: 4-Theme System
| Theme | Trigger | Palette |
|---|---|---|
| standard | Default | Amber terminal |
| artifact | Founding-crew era docs | Cold blue |
| red-alert | Crisis days | Deep red |
| premium | Unlockable | Silver / violet |

Applied via `data-theme` attribute on `<html>`, derived from `day.theme` field.

---

## Backend & Infrastructure (Sessions 4–5)

### D-012: PostgreSQL with JSONB
**Decision:** Single Postgres database with JSONB columns for game content. No separate NoSQL instance.  
**Rationale:** Day content is document-shaped (JSONB handles it), player progress is relational, transactions need ACID.  
**Rejected:** MongoDB (weak ACID), dual Mongo+Postgres (overkill).

### D-013: Prisma ORM
**Decision:** Prisma over Drizzle or raw `pg`.  
**Rationale:** Type-safe DB access, auto-generated client, mature migration system.  
**Rejected:** Drizzle (less mature ecosystem), Kysely (query builder only), raw pg (no type safety).

### D-014: Deployment — Render + Neon (Free Tier)
**Decision:** Deploy as single Render web service with Neon PostgreSQL. Both free tier, no credit card.  
**Rationale:** Single service serves both API and SPA (Vite build copied to `api/dist/public/`), avoiding CORS and extra URL for Telegram.  
**Previous approach:** Docker + AWS EC2 was considered but Render is simpler for a solo project.  
**Repo:** `github.com/AIParlour/ares_station_tg`

---

## Puzzle & Content Design (Sessions 6–8+)

### D-015: Puzzle Renderer Dispatch Pattern
**Decision:** `PuzzleScreen` dispatches to type-specific renderer components via `switch` on `puzzle.type`. Each renderer is a standalone file with its own CSS Module.  
**Rationale:** New puzzle types added by: (1) create renderer + CSS, (2) add `case` to dispatcher, (3) add content JSON.

### D-016: Interactive Puzzle Types (v2)
**Decision:** Replace text-input puzzles with 7 interactive types: `keypad`, `cipher_wheel`, `wire`, `frequency`, `pattern_grid`, `multi_choice`, `logic`.  
**Rationale:** Text input is tedious on mobile, causes typo frustration, doesn't feel like a station terminal.

### D-017: Frequency → Logic Puzzle Replacement
**Decision:** Replace all 5 `frequency` (slider) puzzles with `logic` (deduction with elimination) puzzles. FrequencyTunerPuzzle kept in codebase but unused.  
**Rationale:** Slider was trivially brute-forceable. Signal-strength metaphor implied audio; many players have sound off. Logic deduction requires genuine reasoning.

### D-018: Auto-Reveal Redacted Log Segments
**Decision:** Redacted segments auto-reveal when player solves corresponding puzzle, instead of manual tap.  
**Rationale:** Manual tap was confusing — players didn't know redactions were tappable. Auto-reveal creates a satisfying unlock moment with amber→green animation.

### D-019: Puzzle Difficulty Redesign
**Decision:** Rewrote all 30 puzzles to require multi-step reasoning. Answers never directly stated in prompts.  
**Rationale:** Initial puzzles were too easy — cipher keywords appeared in prompts, keypad codes were single-step, multi-choice had obvious answers.

### D-020: Log-Decryption Replaces Paradox Chat (Season 1)
**Decision:** Finale screen is a browser for Paradox's redacted system logs. Each segment has a `key` matching one of the player's unlocked words.  
**Why this is better:** Zero hallucination. Cross-day payoffs (day 12 word decrypts day 2 line). Horror beats are precise. No per-player token cost.

### D-021: SVG Logo (Brutalist Glyph)
**Decision:** Monoline geometric "A" chevron with filled circle (Paradox eye). 64×64 SVG using `currentColor`.  
**Rationale:** Works at 16px favicon through 640px avatar. `currentColor` inherits theme. A = Ares, eye = Paradox watching.

### D-022: Monetisation — Telegram Stars Primary, TON Connect Secondary
**Decision:** Ship Stars first (native to TMA, EU/NL-friendly). TON Connect added later for crypto-native players.  
**Products at launch:** hint unlock (5 Stars), skip-24h (25 Stars), Paradox Premium cosmetic (100 Stars).

### D-023: Repo Rename & GitHub Push
**Decision:** Renamed project folder from `poc` to `ares_station_tg`. Pushed to `github.com/AIParlour/ares_station_tg`.  
**Rationale:** No longer a proof of concept — this is the shipping codebase.

---

## Animation System (Phase 7b)

### D-024: Page Transitions via Keyed Wrapper, Not AnimatePresence
**Decision:** Cross-fade between routes by wrapping the rendered screen in a
`<div key={route.name+params}>` that runs a 220ms `screen-fade-in` keyframe
on mount. No `framer-motion`, no exit animations.  
**Rationale:** Real cross-fade (both screens visible during transition)
requires AnimatePresence-style mount-tracking which adds a dependency
and complicates the custom `RouterProvider`. Hard-cut on exit + soft
fade-in on enter reads as a cross-fade at this duration without the
machinery.

### D-025: Pending Reveal Lives in GameProvider, Not Local State
**Decision:** When the player solves a puzzle, the unlock word is stamped on
`state.pendingReveal` in `GameProvider`. `DocumentScreen` consumes this on
mount and immediately calls `clearPendingReveal()` so the glitch→typewriter
animation only plays once per unlock.  
**Rationale:** Local state in `DocumentScreen` doesn't survive the
PuzzleScreen → DocumentScreen navigation because the route change unmounts
the document tree. Comparing `unlockedWords` against a `seenKeys` snapshot
on mount fails because the just-unlocked word is already in the list by
the time DocumentScreen mounts. Provider-level state lives across the
nav hop and is wiped after one read.

### D-026: Intro Sequence Is SVG + CSS Keyframes, Not Canvas/Lottie/Video
**Decision:** First-time intro is a single SVG scene (~26 stars, Mars
ellipse, shuttle polygon, 5 station strokes, 13 light circles) animated
purely via `animation-delay` on `nth-child` selectors and a self-drawing
station via `stroke-dasharray` + `stroke-dashoffset`.  
**Rationale:** Canvas requires a JS render loop, Lottie ships a 60KB
runtime + opaque JSON, video looks out of place in a brutalist terminal
and bloats bundle size. SVG + CSS keyframes are declarative, themable
via `currentColor`, gzip well, and respect `prefers-reduced-motion`
trivially.

### D-027: First-Time Detection via localStorage, Not Server State
**Decision:** Intro shown once per device, gated by `ares_intro_seen=1`
in localStorage. Not stored in Player table.  
**Rationale:** Intro is per-device tone-setting, not per-account. A
returning player on a new device should see it again (it's only ~18s
and re-acquaints them with the world). Saves a round-trip + DB column
for zero meaningful loss.
