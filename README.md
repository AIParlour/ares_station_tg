# Ares Station — Mars Mystery Investigation Game

A Telegram Mini App where players investigate the disappearance of the Ares Station crew. Each day delivers a classified document, 5 interactive puzzles, and a finale interrogation of Paradox — the station's AI that knows more than it admits.

## Stack

- **Frontend:** Vite + React + TypeScript, CSS Modules with custom properties
- **Backend:** Express + TypeScript, Prisma ORM
- **Database:** PostgreSQL (Neon free tier) with JSONB content storage
- **Deployment:** Render (single web service serving both API and SPA)
- **Distribution:** Telegram Mini App via BotFather

## Run Locally

```bash
cd poc
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
poc/
├── apps/
│   ├── api/               Express API + Prisma
│   │   ├── prisma/        Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── content/   day1.json – day6.json (puzzle & narrative data)
│   │   │   ├── routes/    day, puzzle, paradox, auth, player endpoints
│   │   │   └── index.ts   Express server + static SPA serving
│   │   └── BOT_SETUP.md
│   └── web/               Vite + React SPA
│       └── src/
│           ├── app/       Router, Layout
│           ├── features/
│           │   └── game/
│           │       ├── document/   DocumentScreen (day log + redacted segments)
│           │       ├── puzzle/     PuzzleScreen + 8 renderer components
│           │       ├── finale/     FinaleScreen (Paradox interrogation)
│           │       └── briefing/   BriefingScreen
│           └── shared/    API client, types, UI components, hooks
├── scripts/
│   └── build-production.sh
├── docs/
│   ├── DECISIONS.md       Architecture & design decision log
│   ├── ROADMAP.md         Feature roadmap with status
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
| `frequency` | FREQUENCY SCAN | Slider with signal indicator (deprecated) |
| *(default)* | — | Free-text input fallback |

## Day Content Format

Each `dayN.json` contains:
- `title`, `stardate`, `theme` — metadata
- `document[]` — log entries with optional redacted segments (auto-reveal on puzzle solve)
- `puzzles[]` — 5 puzzles with `slot`, `type`, `prompt`, `data`, `_answer`, `unlockWord`
- `finale` — Paradox interrogation config (goal, constraintWords, forbidden, targetPhrase)

## API Endpoints

```
GET  /api/day/today              → current day content (answers excluded)
POST /api/puzzle/check           → { dayId, slot, answer } → { correct, unlockWord }
POST /api/paradox/ask            → { dayId, prompt } → { reply, win, attemptsRemaining }
POST /api/auth/telegram          → validate initData → JWT
GET  /api/player/me              → player profile + progression
GET  /api/health                 → { ok: true }
```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Render + Neon setup (free, no credit card).
See [BOT_SETUP.md](./apps/api/BOT_SETUP.md) for Telegram bot registration.

## Docs

- [Decision Log](./docs/DECISIONS.md) — why things are built this way
- [Roadmap](./docs/ROADMAP.md) — what's done and what's next
- [Progress Log](./docs/PROGRESS.md) — chronological build history
