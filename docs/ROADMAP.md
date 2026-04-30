# Ares Station — Roadmap

## Season 1: The Vanishing (Days 1–6)

### Phase 1: Core Build ✅
- [x] Monorepo setup (Vite + React FE, Express BE, npm workspaces)
- [x] Custom state-based router (no React Router)
- [x] CSS Modules + Custom Properties theming (brutalist sci-fi)
- [x] Day content pipeline (JSON → Prisma seed → JSONB)
- [x] Document screen with scrollable log entries
- [x] Redacted log segments with auto-reveal on puzzle solve
- [x] Puzzle check API with answer validation

### Phase 2: Puzzle Renderers ✅
- [x] PuzzleScreen dispatcher architecture
- [x] KeypadPuzzle — numeric code entry terminal
- [x] CipherWheelPuzzle — rotary alphabet decoder
- [x] WireConnectionPuzzle — drag-to-connect pairs
- [x] FrequencyTunerPuzzle — slider with signal indicator (deprecated in content)
- [x] PatternGridPuzzle — grid cell toggle pattern
- [x] MultiChoicePuzzle — single-select terminal options
- [x] LogicPuzzle — deduction with scenario, clues, elimination
- [x] TextInputPuzzle — fallback free-text input

### Phase 3: Content & Difficulty ✅
- [x] 6 days of narrative content (30 puzzles total)
- [x] Puzzle difficulty redesign — multi-step reasoning, no direct answers
- [x] Replace frequency puzzles with logic deduction puzzles (5 puzzles)
- [x] Each day: 5 puzzles, redacted log with unlock keys, Paradox finale

### Phase 4: Database & Auth ✅
- [x] Prisma schema (Player, Day, PlayerDay, ParadoxLog, Transaction)
- [x] PostgreSQL with JSONB for day content/answers
- [x] Telegram `initData` JWT authentication
- [x] Player progression tracking (solvedSlots, unlockWords)
- [x] Personal-synchronous 24h day gating

### Phase 5: Paradox AI Finale ✅
- [x] POST /api/paradox/ask endpoint
- [x] Constraint-word and forbidden-word validation
- [x] Mocked Paradox responses (real Anthropic SDK wired but optional)
- [x] Win detection via target phrase substring match
- [x] Conversation history via ParadoxLog model

### Phase 6: Deployment Setup ✅
- [x] Production build script (FE → API static serving)
- [x] Render blueprint (render.yaml)
- [x] Neon PostgreSQL integration
- [x] Deploy guide (DEPLOY.md)
- [x] Bot setup guide (BOT_SETUP.md)
- [x] SVG logo for favicon/avatar

### Phase 7: Pre-Launch 🔲 (Current)
- [ ] Local end-to-end playtest (Day 1 → Day 6)
- [ ] Deploy to Render + Neon (free tier)
- [ ] Register Telegram Mini App with BotFather
- [ ] Verify cold start behavior and seed data
- [ ] Smoke test via Telegram on mobile device

### Phase 8: Post-Launch Polish 🔲
- [ ] Update README.md with current architecture
- [ ] In-game currency system (Transaction model wired to UI)
- [ ] "Skip wait" purchase flow
- [ ] Hint purchase flow
- [ ] Streak tracking and streak-save mechanic
- [ ] Daily notification push via Telegram bot
- [ ] Analytics events (puzzle solve times, Paradox attempts, drop-off points)

### Phase 9: Season 2+ 🔲
- [ ] New narrative arc and day content
- [ ] Additional puzzle types (if needed)
- [ ] Real Anthropic Claude integration for dynamic Paradox responses
- [ ] Webhook mode for Telegram bot (replace polling)
- [ ] Localization (Russian, other languages)
- [ ] Community features (leaderboards, shared discoveries)
