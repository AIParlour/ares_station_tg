# Ares Station — Roadmap

> Living document. Append, don't rewrite history.
> See `DECISIONS.md` for reasoning behind each item.

---

## Season 1: The Vanishing

### Phase 0 — Foundation ✅
- [x] FE architecture: state-based router, GameProvider, theme system, screen skeletons
- [x] BE: Express + Prisma + Postgres, HMAC Telegram auth, JWT sessions
- [x] Gameplay gate: per-player `PlayerDay` with `unlockedAt` (personal-synchronous)
- [x] Day / puzzle / progress endpoints with server-only `answers` column
- [x] Station map SVG with locked sectors and sector-detail panel
- [x] World bible, weekly environmental log content, decisions log

### Phase 1 — Core Build ✅
- [x] Monorepo setup (Vite + React FE, Express BE, npm workspaces)
- [x] Custom state-based router (no React Router, TG BackButton wired)
- [x] CSS Modules + Custom Properties theming (brutalist sci-fi, 4 themes)
- [x] Day content pipeline (JSON → Prisma seed → JSONB)
- [x] Document screen with scrollable log entries
- [x] Redacted log segments with auto-reveal on puzzle solve
- [x] Puzzle check API with answer validation

### Phase 2 — Puzzle Renderers ✅
- [x] PuzzleScreen dispatcher architecture
- [x] KeypadPuzzle — numeric code entry terminal
- [x] CipherWheelPuzzle — rotary alphabet decoder
- [x] WireConnectionPuzzle — drag-to-connect pairs
- [x] FrequencyTunerPuzzle — slider with signal indicator (deprecated in content)
- [x] PatternGridPuzzle — grid cell toggle pattern
- [x] MultiChoicePuzzle — single-select terminal options
- [x] LogicPuzzle — deduction with scenario, clues, elimination
- [x] TextInputPuzzle — fallback free-text input

### Phase 3 — Content & Difficulty ✅
- [x] 6 days of narrative content (30 puzzles total)
- [x] Puzzle difficulty redesign — multi-step reasoning, no direct answers
- [x] Replace frequency puzzles with logic deduction puzzles (5 puzzles)
- [x] Each day: 5 puzzles, redacted log with unlock keys, Paradox finale

### Phase 4 — Database & Auth ✅
- [x] Prisma schema (Player, Day, PlayerDay, ParadoxLog, Transaction)
- [x] PostgreSQL with JSONB for day content/answers
- [x] Telegram `initData` JWT authentication
- [x] Player progression tracking (solvedSlots, unlockWords)
- [x] Personal-synchronous 24h day gating

### Phase 5 — Paradox Finale (No-AI) ✅
- [x] Log-decryption finale (tap-to-decrypt Paradox system logs)
- [x] LogBrowserScreen with keyring, toast, haptic feedback
- [x] POST /api/paradox/ask endpoint (mocked, real SDK wired but optional)
- [x] Constraint-word and forbidden-word validation
- [x] Conversation history via ParadoxLog model

### Phase 6 — Deployment Setup ✅
- [x] Production build script (FE → API static serving)
- [x] Render blueprint (render.yaml)
- [x] Neon PostgreSQL integration
- [x] Deploy guide (DEPLOY.md)
- [x] Bot setup guide (BOT_SETUP.md)
- [x] SVG logo for favicon/avatar
- [x] Pushed to GitHub (`AIParlour/ares_station_tg`)
- [x] Renamed from `poc` to `ares_station_tg`

### Phase 7 — Pre-Launch 🔲 (Current)
- [x] Local end-to-end playtest (Day 1 → Day 6) — 84/84 checks pass, see `docs/PLAYTEST.md`
- [ ] Deploy to Render + Neon (free tier)
- [ ] Register Telegram Mini App with BotFather
- [ ] Verify cold start behavior and seed data
- [ ] Smoke test via Telegram on mobile device

---

## Season 1 — Post-Launch

### Phase 8 — Content Pipeline for 20 Days 🔲
Season 1 arc is three phases:
- Days 1–6: survival, curiosity, atmospheric dread
- Days 7–14: comms restored, crew personal logs surface, contradictions
- Days 15–20: interrogation, truth, endgame

- [ ] Day content files for days 7–20 (each: document, 3–5 puzzles, paradox logs)
- [ ] Cross-day unlocks: a word from day 5 can decrypt a block in day 1's logs
- [ ] Content style guide for puzzle authoring (difficulty curve, unlock word pool)
- [ ] Phase 2 days: add `crewLogs[]` authored voice from dead crew
- [ ] Phase 3 days: add `challenges[]` for structured interrogation UI

### Phase 9 — Challenge Interface (Act III) 🔲
Replaces free-form chat for days 15+. Grid of unlocked words × targets; each combination has an authored Paradox response.

- [ ] `challenges` field in day content JSON
- [ ] `ChallengeScreen.tsx` — grid UI for constructing challenges
- [ ] Breakdown animation (glitch text, cut-in crew voice fragments)
- [ ] Attempt budget per day (soft currency sink)

### Phase 10 — Monetisation 🔲
- [ ] Telegram Stars integration (`openInvoice()` flow)
- [ ] Webhook handler for `pre_checkout_query` + `successful_payment`
- [ ] Products: hint unlock (5 Stars), skip-24h (25 Stars), Paradox Premium (100 Stars)
- [ ] `ShopScreen` wired to payment flow
- [ ] TON Connect secondary (ship after Stars works)

### Phase 11 — Polish & Operations 🔲
- [ ] In-game currency system (Transaction model wired to UI)
- [ ] Streak tracking and streak-save mechanic
- [ ] Daily notification push via Telegram bot (webhook mode)
- [ ] Analytics events (puzzle solve times, Paradox attempts, drop-off points)
- [ ] Error monitoring (Sentry free tier or GlitchTip)
- [ ] Intro sequence animation (ship descent → lights → Paradox cold open)
- [ ] Log-entry bookmarking / "fully decrypted" badge
- [ ] Animated decrypt (typewriter reveal)

---

## Phase 12 — After Season 1 Ships 🔲

### Optional LLM Mode
When payment access resolves, LLM Paradox returns as an additional mode:
- [ ] Re-enable `/api/paradox` route behind feature flag
- [ ] `[EXPERIMENTAL] CONVERSE WITH PARADOX` on finale screen
- [ ] Uses `claude-haiku` on OpenRouter (cheapest)
- [ ] Rate-limited per player per day

### Season 2+
- [ ] New narrative arc, new cast
- [ ] Localization (Russian, other languages)
- [ ] Community features (leaderboards, shared discoveries)

---

## Out of Scope (for now)
- Real-time multiplayer — game is single-player by design
- Mobile app outside Telegram — TMA is the distribution channel
- Voice / audio — authoring cost too high for solo project
- PvP Paradox attacks — fun idea, later season material
