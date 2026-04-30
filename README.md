# Ares Station — Mars Mystery Investigation Game

A Telegram Mini App where players investigate the disappearance of the Ares Station crew. Each day delivers a classified document, 5 interactive puzzles, and a finale — decrypting Paradox's redacted system logs using keywords earned from solved puzzles.

**Repo:** `github.com/AIParlour/ares_station_tg`

## Stack

- **Frontend:** Vite + React + TypeScript, CSS Modules with custom properties (4 themes)
- **Backend:** Express + TypeScript, Prisma ORM
- **Database:** PostgreSQL (Neon free tier) with JSONB content storage
- **Deployment:** Render (single web service serving both API and SPA)
- **Distribution:** Telegram Mini App via BotFather

## Run Locally

```bash
cd ares_station_tg
npm install
cp apps/api/.env.example apps/api/.env   # add DATABASE_URL
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npx prisma db seed --schema apps/api/prisma/schema.prisma
npm run dev
```

Both services boot via `concurrently`:
- API: http://localhost:8787
- Web: http://localhost:5173

## Architecture

```
ares_station_tg/
├── apps/
│   ├── api/               Express API + Prisma
│   │   ├── prisma/        Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── content/   day1.json – day6.json (puzzle & narrative data)
│   │   │   ├── routes/    day, puzzle, paradox, auth, player, progress
│   │   │   └── index.ts   Express server + static SPA serving
│   │   └── BOT_SETUP.md
│   └── web/               Vite + React SPA
│       └── src/
│           ├── app/       Router, Layout, theme manager
│           ├── features/
│           │   ├── game/
│           │   │   ├── document/   DocumentScreen (day log + auto-reveal redactions)
│           │   │   ├── puzzle/     PuzzleScreen + 8 renderer components
│           │   │   ├── finale/     FinaleScreen (Paradox chat — Phase 2 ref)
│           │   │   └── briefing/   BriefingScreen
│           │   ├── map/           StationMap SVG (12 sectors, 4 visual states)
│           │   ├── documents/     Archive of completed days
│           │   └── shop/          Store UI (not yet wired to payment)
│           └── shared/    API client, types, UI components, hooks
├── scripts/
│   └── build-production.sh
├── docs/
│   ├── DECISIONS.md       Architecture & design decision log (23 decisions)
│   ├── ROADMAP.md         Feature roadmap with status (12 phases)
│   └── PROGRESS.md        Chronological build log
├── render.yaml            Render deployment blueprint
└── DEPLOY.md              Step-by-step deployment guide
```

## Puzzle Types

8 interactive renderers, dispatched by `puzzle.type`:

| Type | Label | Mechanic |
|------|-------|----------|
| `keypad` | CODE ENTRY | Numeric terminal keypad |
| `cipher_wheel` | SIGNAL DECODE | Rotary alphabet decoder |
| `wire` | SYSTEM LINK | Drag-to-connect pairs |
| `logic` | LOGIC ANALYSIS | Scenario + clues + elimination |
| `pattern_grid` | PATTERN MATCH | Toggleable cell grid |
| `multi_choice` | DATA ANALYSIS | Single-select options |
| `frequency` | FREQUENCY SCAN | Slider (deprecated — replaced by logic) |
| *(default)* | — | Free-text input fallback |

## Season 1 Design

Season 1 ("The Vanishing") ships without any LLM dependency. All content is authored and deterministic.

The finale uses a **log-decryption mechanic**: players decrypt Paradox's redacted system logs using keywords earned from puzzles. This is intentionally better than LLM chat for the genre — zero hallucination, cross-day payoffs, precise horror beats, no per-player token cost.

LLM Paradox returns in Phase 2 as an optional experimental layer.

## API Endpoints

```
GET  /api/days/current           → current day content (answers excluded)
GET  /api/days/:dayId            → specific day content
POST /api/puzzle/check           → { dayId, slot, answer } → { correct, unlockWord }
POST /api/paradox/ask            → { dayId, prompt } → { reply, win, attemptsRemaining }
POST /api/auth/telegram          → validate initData → JWT
GET  /api/progress               → player progression
POST /api/progress/skip-wait     → skip 24h gate (currency debit)
GET  /api/health                 → { ok: true }
```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Render + Neon setup (free, no credit card).
See [BOT_SETUP.md](./apps/api/BOT_SETUP.md) for Telegram bot registration.

## Docs

- [Decision Log](./docs/DECISIONS.md) — why things are built this way
- [Roadmap](./docs/ROADMAP.md) — what's done and what's next
- [Progress Log](./docs/PROGRESS.md) — chronological build history
