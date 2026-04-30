# Ares Station — Progress Log

Running log of what was built, changed, and fixed — newest entries first.

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
- **PuzzleScreen.tsx** — Added `LogicPuzzle` import, `logic: "LOGIC ANALYSIS"` type label, and `case "logic"` to renderer dispatcher
- **day1.json s4** — Frequency → Logic: "Whose bunk had nameplate removed?" (port/starboard + alibi elimination → VOLKOV)
- **day2.json s5** — Frequency → Logic: "Who walked the corridor at 03:17?" (height/stride + injury elimination → REEVES)
- **day3.json s1** — Frequency → Logic: "Whose handprint on hull panel?" (palm width + splint elimination → VASQUEZ)
- **day4.json s3** — Frequency → Logic: "Who was humming in ventilation?" (location access + vocal range → VOLKOV)
- **day5.json s5** — Frequency → Logic: "What is the transmission cycle?" (pattern analysis + brownout anomaly → 7 SOLS)

### Notes
- FrequencyTunerPuzzle component kept in codebase but no longer referenced by any content
- Logic puzzle answers use exact option text — compatible with existing string-match API
- TypeScript compiles cleanly with all changes

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
- **`scripts/build-production.sh`** — 6-step production build (install → prisma generate → build web → build api → copy web to api/dist/public → copy content)
- **`render.yaml`** — Render Blueprint for single free-tier web service (Frankfurt region)
- **`DEPLOY.md`** — Step-by-step guide: Neon DB → GitHub → Render → Telegram registration
- **`package.json`** — Added `build:production`, `start`, `db:migrate`, `db:seed` scripts; `engines: node >=20`

### Technical
- Single service architecture: Express serves both API routes and Vite-built SPA from `dist/public/`
- `NPM_CONFIG_PRODUCTION=false` on Render to keep devDependencies (tsx for seeding)
- `api/src/index.ts` updated with static file serving + SPA fallback in production

---

## 2026-04-21 — Auto-Reveal Redacted Segments

### Changed
- **DocumentScreen.tsx** — Removed manual tap-to-reveal. Redacted segments now auto-reveal when `unlocked.has(segment.key)` is true
- **DocumentScreen.module.css** — Removed cursor:pointer and hover states from locked redactions. Enhanced reveal animation (0.6s amber→green)
- Removed: `revealed` state, `toast` state, `handleSegmentTap` function, toast UI

---

## 2026-04-21 — SVG Logo

### Added
- **`public/logo.svg`** — Monoline geometric A chevron + filled circle (Paradox eye). 64×64 viewBox, `currentColor`, works at 16px–640px

---

## 2026-04-21 — 7 Puzzle Renderer Components

### Added
All puzzle renderers in `apps/web/src/features/game/puzzle/renderers/`:
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
- **Prisma schema** — Player, Day, PlayerDay, ParadoxLog, Transaction models
- **Seed script** (`prisma/seed.ts`) — Reads day1–day6 JSON, upserts into Day table
- **6 day JSON files** (`content/day1.json` – `day6.json`) — Full narrative content with puzzles

### Puzzle Type Distribution
| Day | s1 | s2 | s3 | s4 | s5 |
|-----|------|------|------|------|------|
| 1 | keypad | cipher_wheel | multi_choice | logic | wire |
| 2 | cipher_wheel | multi_choice | pattern_grid | keypad | logic |
| 3 | logic | multi_choice | cipher_wheel | pattern_grid | wire |
| 4 | keypad | multi_choice | logic | wire | cipher_wheel |
| 5 | multi_choice | wire | keypad | cipher_wheel | logic |
| 6 | keypad | cipher_wheel | pattern_grid | multi_choice | wire |
