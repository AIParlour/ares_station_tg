# Ares Station — Continuation Prompt

Copy everything below the line into a new chat to continue development.

---

You are continuing development of **Ares Station**, a Telegram Mini App mystery game set on Mars. The codebase is in `poc/` inside my workspace folder. Before doing anything, read these files to get up to speed:

1. `poc/README.md` — architecture overview, stack, puzzle types, API endpoints
2. `poc/docs/ROADMAP.md` — what's done (✅) and what's next (🔲)
3. `poc/docs/DECISIONS.md` — 14 architectural/design decisions and their rationale
4. `poc/docs/PROGRESS.md` — chronological build log (newest first)

## Current State

**Everything through Phase 6 is complete.** The game has:

- 6 days of narrative content with 30 interactive puzzles (5 per day)
- 8 puzzle renderer components: keypad, cipher_wheel, wire, logic, pattern_grid, multi_choice, frequency (deprecated), text_input (fallback)
- Document screen with auto-revealing redacted log segments
- Paradox AI finale (mocked, real Anthropic SDK wired but optional)
- Prisma schema with Player, Day, PlayerDay, ParadoxLog, Transaction models
- Full deployment config for Render + Neon (free tier, no credit card)
- Telegram bot setup guide

## What Needs to Happen Next (Phase 7: Pre-Launch)

The immediate priorities are:

1. **Local end-to-end playtest** — Run the full Day 1 → Day 6 flow locally. Seed the database, create a test player, and verify every puzzle solves correctly with the expected answers. Check that redacted segments reveal, Paradox finales work, and day progression gates properly.

2. **Deploy to Render + Neon** — Follow `DEPLOY.md`. Push to GitHub, create Neon DB, deploy on Render. Verify health endpoint, seed data, and cold start behavior.

3. **Register Telegram Mini App** — Follow `apps/api/BOT_SETUP.md`. Create bot via BotFather, set menu button to Render URL, test on mobile.

## Key Technical Details

- **Puzzle answers** are in `_answer` field of each puzzle in `dayN.json`. The API does case-insensitive exact string matching.
- **Logic puzzles** (new) submit the exact option text as the answer (e.g., "VOLKOV", "7 SOLS").
- **FrequencyTunerPuzzle** component still exists in the codebase but is no longer used by any day content — all 5 frequency puzzles were replaced with logic deduction puzzles.
- **Day gating** is personal-synchronous: completing day N creates day N+1 with `unlockedAt = now() + 24h`.
- **Build** for production: `npm run build:production` runs `scripts/build-production.sh` which builds the web app and copies it into `api/dist/public/` so Express serves everything.
- **Database seed**: `npx prisma db seed` reads `day1.json`–`day6.json` and upserts into the `days` table.

## Important Files

```
poc/apps/web/src/features/game/puzzle/PuzzleScreen.tsx     — puzzle dispatcher
poc/apps/web/src/features/game/puzzle/renderers/            — all 8 puzzle components
poc/apps/web/src/features/game/document/DocumentScreen.tsx  — day document + redactions
poc/apps/api/src/routes/puzzle.ts                           — puzzle check endpoint
poc/apps/api/src/routes/paradox.ts                          — Paradox AI endpoint
poc/apps/api/src/content/day1.json – day6.json              — all game content
poc/apps/api/prisma/schema.prisma                           — database schema
poc/apps/api/prisma/seed.ts                                 — database seeder
poc/scripts/build-production.sh                             — production build
```

Please start by reading the docs mentioned above, then proceed with the next task on the roadmap (Phase 7: local playtest, then deploy).
