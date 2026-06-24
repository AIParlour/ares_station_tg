# Continuation Prompt — Ares Station: Animation Pass

## Project

**Ares Station** — a sci-fi mystery Telegram Mini App set on Mars.
Repo: `github.com/AIParlour/ares_station_tg`
Stack: React 18 + TypeScript + Vite (CSS Modules + CSS Custom Properties), Express + Prisma + Neon PostgreSQL.
Design system: brutalist terminal aesthetic, 4 themes (amber standard, cold blue artifact, red-alert, premium silver/violet). Variables in `apps/web/src/styles/variables.css`.

The app is a TMA (Telegram Mini App) — no browser URL routing, custom state-based router in `apps/web/src/app/Router.tsx`. Navigation via `navigate()` (push) / `replace()` / `goBack()` from `useRouter()`.

---

## What's Already Done

All Phases 0–7 complete including:
- 6 days of content, 30 puzzles, 8 puzzle renderers
- Full backend (auth, day gating, puzzle check, progress)
- Font Awesome icon system installed and wired throughout (`@fortawesome/react-fontawesome`)
- All unicode glyphs replaced with semantic FA icons
- Start button label logic (BEGIN / CONTINUE / CONTINUE TOMORROW + disabled)
- Day gate: next UTC midnight (not +24h)
- Archive button hidden in read-only story re-read mode

---

## Task: Add Animations (Phase 7b)

All animations must respect the **brutalist terminal aesthetic**: no bounce, no spring physics, no rounded motion. Think: CRT scanline flicker, typewriter, signal lock, hard cuts with brief opacity flash. Use `ease-out` or `linear` exclusively. Durations: 80–400ms for UI feedback, up to 1.5s for dramatic reveals.

CSS animation variables already in `variables.css`:
```css
--transition-fast:   0.12s ease;
--transition-normal: 0.22s ease;
```

### Animation 1 — HomeScreen staggered entrance

File: `apps/web/src/features/home/HomeScreen.module.css` (and `.tsx` if needed)

When the HomeScreen mounts, the four menu buttons should fade in and slide up sequentially with a small stagger (e.g. 60ms between each). The title/subtitle/sol block should appear first, then buttons 1→4.

Suggested approach: CSS `@keyframes` + `animation-delay` on nth-child, triggered by a class applied on mount.

---

### Animation 2 — Typewriter reveal on StoryScreen

File: `apps/web/src/features/game/story/StoryScreen.tsx` + `.module.css`

The story body (`day.document` array of `RawDocLine`) should appear paragraph by paragraph with a typewriter effect — each paragraph types out character by character. The next paragraph starts only after the current one finishes.

The "LOG ARCHIVED — COMPLETE DAY" button should only appear after all paragraphs have finished typing.

The `StoryLine` component currently renders each line as a `<p>`. You'll need a mechanism to sequence through the lines and animate each one.

Considerations:
- Skip animation when `readOnly === true` (re-reading from archive — user has already seen it)
- A "skip" tap anywhere on the body should jump to fully revealed state instantly
- Blank lines (breaks) should still create a pause rather than being skipped

---

### Animation 3 — Redaction unlock (enhanced)

File: `apps/web/src/features/game/logs/LogBrowserScreen.module.css`
Also: `apps/web/src/features/game/document/DocumentScreen.module.css`

There's already a basic CSS animation on `.logs__redaction--unlocked` (amber flash → green). Enhance it:

1. Brief glitch/flicker phase: rapidly swap between `█████` and the real text 3–4 times over ~200ms
2. Then typewriter: reveal the real text character by character over ~300ms
3. Final state: green revealed style

This requires JavaScript to drive the animation (CSS alone can't do typewriter on dynamic text). The redaction component is `Segment` in `DocumentScreen.tsx` and `LogEntry` / redaction span in `LogBrowserScreen.tsx`.

---

### Animation 4 — Puzzle solve success flash

File: relevant puzzle renderer CSS modules (e.g. `TextInputPuzzle.module.css`, others)

When a puzzle is solved correctly, before the user navigates back to DocumentScreen, there should be a brief (300–400ms) full-panel success state: the whole puzzle panel flashes the success color (`--color-success`), then fades. This gives the solve moment more weight.

Currently the submit button just changes label. The flash should be on the outermost `.root` container of the puzzle renderer.

---

### Animation 5 — Screen transition fade

File: `apps/web/src/app/App.tsx` (or wherever screens are rendered from)

Add a simple fade-in (opacity 0 → 1, ~150ms) when any screen mounts. This smooths out the hard cuts between routes.

Current screen rendering is a plain switch on `current.name` — you'll need to key the container by route so React re-mounts (and re-triggers the animation) on each navigation.

---

## Key Files Reference

```
apps/web/src/
  app/
    App.tsx                          — screen switcher (switch on current.name)
    Router.tsx                       — navigate/replace/goBack/canGoBack
  styles/
    variables.css                    — all CSS custom properties + themes
  features/
    home/
      HomeScreen.tsx / .module.css
    game/
      story/
        StoryScreen.tsx / .module.css
      document/
        DocumentScreen.tsx / .module.css
      logs/
        LogBrowserScreen.tsx / .module.css
      puzzle/
        PuzzleScreen.tsx / .module.css
        renderers/
          TextInputPuzzle.tsx / .module.css
          MultiChoicePuzzle.tsx / .module.css
          PatternGridPuzzle.tsx / .module.css
          FrequencyTunerPuzzle.tsx / .module.css
          LogicPuzzle.tsx / .module.css
          KeypadPuzzle.tsx / .module.css
          CipherWheelPuzzle.tsx / .module.css
          WireConnectionPuzzle.tsx / .module.css
```

---

## Constraints

- No animation libraries (no framer-motion, no react-spring) — pure CSS + React state
- No `transform: scale()` bouncing or elastic easing
- All animations must work inside Telegram WebView (iOS + Android)
- Typewriter must be pure JS interval/timeout — no Web Animations API (TG WebView support is inconsistent)
- `prefers-reduced-motion` media query should disable all animations gracefully
- Build must stay clean: `npm run build --workspace @hva/web` with 0 TypeScript errors

---

## Verification

After implementing, run:
```bash
npm run build --workspace @hva/web
```
Should complete with 0 errors and the same ~287 KB JS bundle (±10% for animation logic).
