# Ares Station — Progress Log

Running log of what was built, changed, and fixed — newest entries first.

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
