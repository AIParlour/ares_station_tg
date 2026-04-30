# Ares Station — Continuation Prompt

Copy everything below the line into a new chat to continue development.

---

You are continuing development of **Ares Station**, a Telegram Mini App mystery game set on Mars. The codebase is in `ares_station_tg/` inside my workspace folder. It's pushed to GitHub at `github.com/AIParlour/ares_station_tg`.

Before doing anything, read these files to get up to speed:

1. `ares_station_tg/README.md` — architecture, stack, puzzle types, API endpoints
2. `ares_station_tg/docs/ROADMAP.md` — full roadmap with 12 phases, what's done (✅) vs next (🔲)
3. `ares_station_tg/docs/DECISIONS.md` — 23 design/architecture decisions with rationale
4. `ares_station_tg/docs/PROGRESS.md` — chronological build log (newest first)

Also skim these root-level docs for deeper context on the world and story design:
- `world_bible.md` — full character backstories, Mars lethality, Paradox rules
- `decisions.md` — older session-by-session log with detailed reasoning (sessions 1–8)
- `roadmap.md` — original roadmap with Season 1 no-AI pivot details
- `pre-launch-checklist.md` — earlier checklist (some items resolved, some still relevant)

## Current State

**Phases 0–6 are complete.** The game has:

- 6 days of narrative content with 30 interactive puzzles (5 per day)
- 8 puzzle renderer components: keypad, cipher_wheel, wire, logic, pattern_grid, multi_choice, frequency (deprecated), text_input (fallback)
- Document screen with auto-revealing redacted log segments
- Log-decryption finale (no LLM — all Season 1 content is authored/deterministic)
- Paradox AI endpoint exists (mocked, real Anthropic SDK wired but unused in S1)
- Prisma schema: Player, Day, PlayerDay, ParadoxLog, Transaction
- Station map SVG with 12 sectors, 4 visual states, detail panel
- 4-theme CSS system (standard/artifact/red-alert/premium)
- Full deployment config for Render + Neon (free tier, no credit card)
- Pushed to GitHub (`AIParlour/ares_station_tg`)

## What Needs to Happen Next

**Phase 7 (Pre-Launch) — immediate priorities:**

1. **Local end-to-end playtest** — Seed DB, create test player, verify all 30 puzzles solve correctly with expected answers. Check redacted segment reveals, log-decryption finale, day progression gates.


**After launch**, Phase 8 is the content pipeline for days 7–20.

## Key Technical Details

- **Puzzle answers** are in `_answer` field of each puzzle in `dayN.json`. API does case-insensitive exact string matching.
- **Logic puzzles** submit exact option text as answer (e.g., "VOLKOV", "7 SOLS").
- **FrequencyTunerPuzzle** component exists but is unused — all 5 frequency puzzles replaced with logic.
- **Day gating** is personal-synchronous: completing day N creates day N+1 with `unlockedAt = now() + 24h`.
- **Build** for production: `npm run build:production` → `scripts/build-production.sh` (builds web, copies to `api/dist/public/`, Express serves everything).
- **Database seed**: `npx prisma db seed` reads `day1.json`–`day6.json` and upserts into `days` table.
- **Season 1 has NO LLM dependency.** The log-decryption mechanic replaces Paradox chat. This is a deliberate design decision, not a limitation.
- **Monetisation** planned via Telegram Stars (primary) and TON Connect (secondary). Not yet wired.

## Important Files

```
ares_station_tg/apps/web/src/features/game/puzzle/PuzzleScreen.tsx     — puzzle dispatcher
ares_station_tg/apps/web/src/features/game/puzzle/renderers/            — all 8 puzzle components
ares_station_tg/apps/web/src/features/game/document/DocumentScreen.tsx  — day document + redactions
ares_station_tg/apps/web/src/features/map/StationMap.tsx                — SVG station map
ares_station_tg/apps/api/src/routes/puzzle.ts                           — puzzle check endpoint
ares_station_tg/apps/api/src/routes/paradox.ts                          — Paradox AI endpoint
ares_station_tg/apps/api/src/routes/auth.ts                             — Telegram auth + JWT
ares_station_tg/apps/api/src/content/day1.json – day6.json              — all game content
ares_station_tg/apps/api/prisma/schema.prisma                           — database schema
ares_station_tg/apps/api/prisma/seed.ts                                 — database seeder
ares_station_tg/scripts/build-production.sh                             — production build
ares_station_tg/render.yaml                                             — Render blueprint
ares_station_tg/DEPLOY.md                                               — deployment guide
ares_station_tg/apps/api/BOT_SETUP.md                                   — Telegram bot setup
```

Please start by reading the docs listed above, then proceed with Phase 7 tasks.
