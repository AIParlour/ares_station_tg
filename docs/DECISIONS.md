# Ares Station — Decision Log

Tracks key architectural, design, and gameplay decisions made during development.

---

## D-001: Monorepo Structure
**Date:** 2026-04  
**Decision:** Single monorepo with npm workspaces — `apps/web` (Vite + React + TS) and `apps/api` (Express + TS).  
**Rationale:** Simplifies deployment (single Render service), shared types, single `npm install`. No need for Turborepo at this scale.

## D-002: Telegram Mini App (TMA)
**Date:** 2026-04  
**Decision:** Ship as a Telegram Mini App rather than standalone PWA.  
**Rationale:** Built-in distribution via Telegram, auth via `initData`, monetisation via Telegram Stars. Target audience (CIS/EU) is heavily Telegram-native.

## D-003: CSS Modules + Custom Properties (no Tailwind)
**Date:** 2026-04  
**Decision:** Use CSS Modules with BEM naming and CSS Custom Properties for theming. No CSS framework.  
**Rationale:** Brutalist sci-fi aesthetic requires precise control. CSS Modules give scoped styles with zero runtime cost. Custom Properties enable theming without JS. Tailwind's utility classes would fight the design language.

## D-004: State-Based Routing (no React Router)
**Date:** 2026-04  
**Decision:** Custom minimal router using `useState` with a route stack, no external routing library.  
**Rationale:** TMA runs as a single WebView with no URL bar. Browser history is unnecessary overhead. Stack-based navigation maps cleanly to the game's linear flow (Briefing → Document → Puzzle → Finale).

## D-005: JSONB Content Storage
**Date:** 2026-04  
**Decision:** Store day content and answer keys as JSONB columns in PostgreSQL (`Day.content` and `Day.answers`).  
**Rationale:** Day content is schemaless and versioned per episode. JSONB avoids relational complexity while still allowing server-side queries. Answer keys live in a separate column never exposed to the client API.

## D-006: Puzzle Renderer Dispatch Pattern
**Date:** 2026-04  
**Decision:** `PuzzleScreen` dispatches to type-specific renderer components via a `switch` on `puzzle.type`. Each renderer is a standalone file with its own CSS Module.  
**Rationale:** New puzzle types can be added by: (1) creating a renderer component + CSS, (2) adding a `case` to the dispatcher, (3) adding content JSON. No changes to shared code needed.

## D-007: Interactive Puzzle Types (v2)
**Date:** 2026-04  
**Decision:** Replace text-input puzzles with 7 interactive types: `keypad`, `cipher_wheel`, `wire`, `frequency`, `pattern_grid`, `multi_choice`, `logic`.  
**Rationale:** Text input is tedious on mobile, causes typo frustration, and doesn't feel like a "station terminal." Each type maps to a different cognitive skill — pattern recognition, spatial reasoning, deduction, decoding.

## D-008: Frequency → Logic Puzzle Replacement
**Date:** 2026-04  
**Decision:** Replace all 5 `frequency` (slider) puzzles with `logic` (deduction with elimination) puzzles. The FrequencyTunerPuzzle component is kept in the codebase but no longer used in content.  
**Rationale:** The slider was trivially brute-forceable (just slide until the indicator maxes). Also, the signal-strength metaphor implied audio, and many players would have sound off. Logic deduction puzzles require reading clues, eliminating options, and genuine reasoning — much more engaging.

## D-009: Auto-Reveal Redacted Log Segments
**Date:** 2026-04  
**Decision:** Redacted log segments auto-reveal when the player solves the corresponding puzzle, instead of requiring a manual tap.  
**Rationale:** Manual tap-to-reveal was confusing — players didn't know the redactions were tappable, and the interaction felt disconnected from solving puzzles. Auto-reveal creates a satisfying "unlock" moment with a visible amber→green animation.

## D-010: Deployment Stack (Render + Neon, Free Tier)
**Date:** 2026-04  
**Decision:** Deploy as a single Render web service with Neon PostgreSQL. Both free tier, no credit card required.  
**Rationale:** Constraint: developer cannot have a credit card. Render free tier provides a single web service with auto-deploy from GitHub. Neon provides 0.5GB free PostgreSQL. Single service serves both API and SPA (Vite build copied to `api/dist/public/`), avoiding CORS and extra URL configuration for Telegram.

## D-011: Puzzle Difficulty Redesign
**Date:** 2026-04  
**Decision:** Rewrote all 30 puzzles to require multi-step reasoning. Answers are never directly stated in prompts.  
**Rationale:** Initial puzzles were too easy — cipher keywords appeared in the prompt, keypad codes were single-step, multi-choice had obvious answers. Redesigned so players must: extract clues from story context, perform calculations or logical elimination, and connect information across multiple clues.

## D-012: SVG Logo (Brutalist Glyph)
**Date:** 2026-04  
**Decision:** Logo is a monoline geometric "A" chevron with a filled circle (Paradox eye). 64×64 SVG using `currentColor`.  
**Rationale:** Needs to work at 16px favicon size and as TG avatar. Monoline geometry scales perfectly. `currentColor` inherits theme. The "A" represents Ares, the eye represents Paradox watching.

## D-013: Prisma ORM + PostgreSQL
**Date:** 2026-04  
**Decision:** Prisma as ORM, PostgreSQL as database.  
**Rationale:** Prisma provides type-safe DB access with auto-generated client, migrations, and seed scripts. PostgreSQL supports JSONB natively for flexible day content storage. Schema: Player, Day, PlayerDay (progression gate), ParadoxLog, Transaction (currency ledger).

## D-014: Personal-Synchronous Day Gating
**Date:** 2026-04  
**Decision:** Each player unlocks days on their own 24-hour timer (not global calendar).  
**Rationale:** Players join at different times. Global drops would punish latecomers. Personal timers mean every player gets the full Day 1→6 experience. "Skip wait" purchases available for impatient players.
