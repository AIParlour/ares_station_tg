# Ares Station — Progress Log

Running log of what was built, changed, and fixed — newest entries first.

---

## 2026-05-01 — Phase 7b Animations

All 7 Phase 7b animations are in. Brutalist sci-fi aesthetic preserved — every
beat reads as a terminal booting up or a system responding. Reduced-motion
`@media (prefers-reduced-motion: reduce)` fallbacks in every new keyframe
block. TypeScript builds clean (web + api), playtest still 84/84, Vite
production build succeeds (88 modules → 296 KB JS / 74 KB CSS).

### Added — Intro sequence (first-time only)

- **`features/intro/IntroScreen.tsx` + `.module.css`** — cold-open scene:
  stars fade in (0.2s) → Mars horizon rises (0.6s) → shuttle streaks down
  with trail (1.4s) → impact flash at 4.2°N 137.4°E (2.55s) → station
  outline draws itself via `stroke-dashoffset` (3–4s) → 13 internal
  lights flicker on cluster-by-cluster (4.6–5.4s) → 8-line Paradox cold
  open types in starting at 5.4s.
- Total runtime ~18s, skippable on tap. Persists `ares_intro_seen=1` in
  localStorage on completion or skip.
- **`LoadingScreen.tsx`** — after auth, routes to `intro` if not seen,
  else `home`. New `intro` RouteName added to `Router.tsx`.

### Added — Page transitions

- **`app/Screen.module.css`** + wrapper in `App.tsx` — every route is
  rendered inside a keyed div whose CSS `screen-fade-in` keyframe (220ms,
  ease-out, with subtle 2px Y translate) replays on every navigation.
  `key` includes serialized route params so two `puzzle` routes with
  different slots also cross-fade.

### Added — HomeScreen staggered entrance

- **`HomeScreen.module.css`** — four nav buttons fade in left-to-right
  via `nth-child` `animation-delay` (60ms / 140ms / 220ms / 300ms). Title
  also gets a one-shot letter-spacing wipe before the existing `ares-pulse`
  resumes.

### Added — Typewriter reveal on StoryScreen

- **`StoryScreen.tsx`** — replaced static body with `TypewriterBody` that
  schedules `chars` and `lineIndex` state via `setTimeout`. 16ms per
  character, 110ms paragraph pause, 50ms break-line pause. Cursor
  `▌` blinks at the active position.
- Tapping anywhere in the body sets a `skippedRef` flag and reveals the
  remaining lines instantly. `TAP TO REVEAL` hint appears 1.2s in.
- `readOnly: true` (re-reads from Collected Documents) bypasses the
  animation — `lineIndex` initializes to `lines.length` on mount.

### Added — Day complete ceremony

- **`StoryScreen.tsx` `DayCompleteOverlay`** — full-screen overlay shown
  when player taps "LOG ARCHIVED — COMPLETE DAY". Sequence: panel slides
  up (100ms delay) → SOL line (480ms) → title (600ms) → red CLASSIFIED
  stamp slams in rotated −6° via overshoot easing (900ms) → "FILED —
  EVIDENCE ARCHIVE" (1500ms). After 2.4s total, calls `completeDay()`
  + `replace({ name: "home" })`.

### Added — Redaction unlock animation

- **`GameProvider.tsx`** — added `pendingReveal: string | null` to game
  state, `clearPendingReveal()` action, and `SOLVE_PUZZLE` now stamps the
  unlock word as the pending reveal. Survives the navigation hop from
  PuzzleScreen → DocumentScreen because it lives in the provider.
- **`DocumentScreen.tsx` `AnimatedReveal`** — when a segment's key
  matches the pending reveal, a glitch phase spews random characters
  (`█▓▒░@#%&*?!=+/\<>[]{};:`) at 45ms intervals for 380ms with subpixel
  jitter, then transitions to a typewriter phase (35ms/char) that types
  out the real text in green with a blinking cursor. After ~1.6s the
  parent drops the `animateKey` and the segment renders with the plain
  unlocked styling.
- Replaces the previous 0.6s amber→green fade in `day-reveal`.

### Added — Puzzle solve flash

- **`PuzzleScreen.tsx`** — on `feedback === "correct"` the wrapper gets
  `puzzle--solved-flash` (700ms inset green box-shadow border pulse) and
  a fixed `puzzle__flash` overlay with a radial green gradient mounts
  (900ms fade-in → fade-out). `puzzle__feedback__correct` text now slides
  in with a green border instead of just the old `ares-pulse` opacity.

### Technical

- All new keyframes are scoped per component CSS module (no `global.css`
  pollution). The two existing globals (`ares-pulse`, `ares-blink`) are
  reused where appropriate (HomeScreen title, intro skip hint).
- `useGame()` API expanded with `clearPendingReveal()`. Existing callers
  that don't need it are unaffected (TS-checked).

---

## 2026-04-30 — Phase 7 UX Fixes & Icon System

### Changed

- **HomeScreen.tsx** — Start button label is now state-driven:
  - No progress → `BEGIN INVESTIGATION`
  - Any solved puzzle or completed day → `CONTINUE INVESTIGATION`
  - All current-day puzzles solved → `CONTINUE INVESTIGATION TOMORROW` (button disabled until next day unlocks)
- **puzzle.ts** — Day gate changed from `now + 24h` (personal-synchronous) to `next 00:00:00 UTC`. Simpler, predictable, shared cadence for all players. Dev mode (no `BOT_TOKEN`) still unlocks instantly.
- **StoryScreen.tsx** — "LOG ARCHIVED — COMPLETE DAY" button hidden when `readOnly: true` param is set (re-reading from Collected Documents)
- **DocumentsScreen.tsx** — Archive entries now navigate with `readOnly: true` param so the complete button is suppressed

### Added

- **Font Awesome icon system** — Installed `@fortawesome/fontawesome-svg-core`, `free-solid-svg-icons`, `free-regular-svg-icons`, `react-fontawesome` as workspace-level deps.
- All unicode glyphs and emoji replaced with meaningful FA icons:
  - `‹` → `faChevronLeft` (TopBar back)
  - `▶` → `faMagnifyingGlass` (investigation button — it's a search, not media playback)
  - `◉` → `faMap` (station map)
  - `📁` → `faFolderOpen` (collected documents)
  - `◈` → `faCartShopping` (station store)
  - puzzle solved/unsolved → `faLockOpen` / `faLock`
  - story unlock button → `faFileLines` / `faLock`
  - archive button → `faFloppyDisk`
  - finale send → `faPaperPlane`
  - already-decrypted banner → `faLockOpen`
  - submit success states → `faCircleCheck`
  - LogicPuzzle radio → `faCircleDot` (selected) / `faCircle` regular (unselected)

---

## 2026-04-30 — Phase 7 Playtest (Task 1 Complete)

### Validated
- **All 30 puzzles** across Days 1–6 validated by `scripts/playtest.mjs` (84/84 checks pass)
- **Cipher wheel encodings** confirmed correct for all 6 puzzles (shifts 2, 4, 5, 6, 6, 4)
- **Wire answer format** verified against `WireConnectionPuzzle.tsx` logic
- **Pattern grid sort order** verified against `PatternGridPuzzle.tsx` `buildAnswer()`
- **Paradox log key coverage** confirmed: every `unlockWord` appears as a redacted key in ≥1 log segment for each day
- **TypeScript builds** clean: 0 errors in both `apps/api` and `apps/web`

### Fixed
- **day3.json s3 hint** — clarified cipher direction: "Shift each letter back by 6" (was ambiguous)

### Added
- **`scripts/playtest.mjs`** — comprehensive static content validator; run with `node scripts/playtest.mjs`
- **`docs/PLAYTEST.md`** — full playtest report with answer key and sign-off

---

## 2026-04-30 — GitHub Push & Rename

### Changed
- **Renamed** project folder from `poc/` to `ares_station_tg/`
- **Pushed** to GitHub: `github.com/AIParlour/ares_station_tg`
- **Updated** all documentation: merged root-level decision log (sessions 1–8) with in-repo docs, consolidated roadmap with full Season 1 vision

---

## 2026-04-21 — Logic Puzzle Type & Frequency Replacement

### Added
- **LogicPuzzle component** (`renderers/LogicPuzzle.tsx` + `.module.css`)
  - Scenario display, numbered evidence clues with left-border styling
  - Selectable options with elimination toggle (× to eliminate, ↩ to restore)
  - Diamond indicators (◇ unselected, ◆ selected, ━ eliminated)
  - Strikethrough + dashed border for eliminated options
  - Correct/wrong animations matching existing design system

### Changed
- **PuzzleScreen.tsx** — Added `LogicPuzzle` import, `logic: "LOGIC ANALYSIS"` type label, `case "logic"` to dispatcher
- **day1.json s4** — Frequency → Logic: "Whose bunk had nameplate removed?" (port/starboard + alibi elimination → VOLKOV)
- **day2.json s5** — Frequency → Logic: "Who walked the corridor at 03:17?" (height/stride + injury elimination → REEVES)
- **day3.json s1** — Frequency → Logic: "Whose handprint on hull panel?" (palm width + splint elimination → VASQUEZ)
- **day4.json s3** — Frequency → Logic: "Who was humming in ventilation?" (location access + vocal range → VOLKOV)
- **day5.json s5** — Frequency → Logic: "What is the transmission cycle?" (pattern analysis + brownout anomaly → 7 SOLS)

### Notes
- FrequencyTunerPuzzle kept in codebase but no longer referenced by content
- Logic puzzle answers use exact option text — compatible with existing string-match API

---

## 2026-04-21 — Puzzle Difficulty Redesign

### Changed
- **All 30 puzzles across day1–day6** rewritten for significantly higher difficulty
- Cipher wheel: shift clues derived from story details, longer encoded strings
- Keypad: multi-step math puzzles (not single operations)
- Wire: indirect connections requiring domain knowledge
- Multi-choice: all options made plausible, answer requires cross-referencing clues
- Pattern grid: patterns based on station systems, not obvious shapes

---

## 2026-04-21 — Deployment Configuration

### Added
- **`scripts/build-production.sh`** — 6-step production build
- **`render.yaml`** — Render Blueprint for single free-tier web service (Frankfurt)
- **`DEPLOY.md`** — Step-by-step: Neon DB → GitHub → Render → Telegram
- **`package.json`** — Added `build:production`, `start`, `db:migrate`, `db:seed`

### Technical
- Single service: Express serves API + Vite SPA from `dist/public/`
- `NPM_CONFIG_PRODUCTION=false` on Render to keep devDeps (tsx for seeding)

---

## 2026-04-21 — Auto-Reveal Redacted Segments

### Changed
- **DocumentScreen.tsx** — Redacted segments auto-reveal when `unlocked.has(segment.key)` is true
- **DocumentScreen.module.css** — Removed cursor:pointer from locked redactions, enhanced reveal animation (0.6s amber→green)

---

## 2026-04-21 — SVG Logo

### Added
- **`public/logo.svg`** — Monoline A chevron + filled circle (Paradox eye). 64×64 viewBox, `currentColor`

---

## 2026-04-21 — 7 Puzzle Renderer Components

### Added
All renderers in `apps/web/src/features/game/puzzle/renderers/`:
- **KeypadPuzzle** — Numeric terminal keypad with LED display
- **CipherWheelPuzzle** — Rotary decoder with draggable alphabet ring
- **WireConnectionPuzzle** — Drag-to-connect SVG wire pairs
- **FrequencyTunerPuzzle** — Slider with signal strength indicator
- **PatternGridPuzzle** — Toggleable cell grid
- **MultiChoicePuzzle** — Single-select option panel
- **TextInputPuzzle** — Fallback free-text input

### Architecture
- Each renderer: standalone `.tsx` + `.module.css`
- Common `PuzzleRendererProps` interface in `types.ts`
- `PuzzleScreen.tsx` dispatches via `switch(puzzle.type)`

---

## 2026-04-21 — Database & Day Content Pipeline

### Added
- **Prisma schema** — Player, Day, PlayerDay, ParadoxLog, Transaction
- **Seed script** (`prisma/seed.ts`) — Reads day1–day6 JSON, upserts into Day table
- **6 day JSON files** (`content/day1.json` – `day6.json`)

### Puzzle Type Distribution
| Day | s1 | s2 | s3 | s4 | s5 |
|-----|------|------|------|------|------|
| 1 | keypad | cipher_wheel | multi_choice | logic | wire |
| 2 | cipher_wheel | multi_choice | pattern_grid | keypad | logic |
| 3 | logic | multi_choice | cipher_wheel | pattern_grid | wire |
| 4 | keypad | multi_choice | logic | wire | cipher_wheel |
| 5 | multi_choice | wire | keypad | cipher_wheel | logic |
| 6 | keypad | cipher_wheel | pattern_grid | multi_choice | wire |

---

## Earlier Sessions (1–8) — Foundation

### Built
- Game concept, world bible (v0.7), founding crew backstories
- Paradox AI rules and character definition
- Three-phase discovery arc (survival → comms → full picture)
- Week 1 environmental log arc (7 days authored)
- Station map SVG (12 sectors, 4 visual states, detail panel)
- 4-theme CSS system (standard/artifact/red-alert/premium)
- LogBrowserScreen (tap-to-decrypt Paradox logs, replaces LLM chat)
- Docker Compose (dev + production) for local/EC2 deployment
- Telegram auth (HMAC-SHA256 `initData` validation, JWT sessions)
- All backend routes (auth, day, puzzle, paradox, progress)

### Key Fixes
- CSS token naming (`--spacing-*` vs `--space-*` mismatch)
- TS2307 on `@anthropic-ai/sdk` (added `@ts-ignore` on dynamic import)
- TS7053 index signature on puzzle solve (added `Record<string, boolean>` cast)
- CipherWheelPuzzle `alphabet` type (made non-optional in parsed return)
