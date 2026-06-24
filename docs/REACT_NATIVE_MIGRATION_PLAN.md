# Ares Station — Telegram Web App to React Native Migration Plan

Status: in progress — Phase 1 started, Phase 0 intentionally deferred  
Target: Expo SDK 54 / React Native, initially iOS through TestFlight and the App Store  
Migration style: incremental full replacement, with the Telegram Mini App used only as a temporary reference implementation until native parity is proven

## 1. Objective

Create a native React Native edition of Ares Station while preserving:

- the same story content and daily progression;
- the same puzzle rules, answers, unlock words, scoring, and drill generators;
- the same server-authoritative gameplay and economy;
- the same screen hierarchy and interaction flow;
- the same brutalist terminal visual identity, themes, typography, motion, and feedback.

This is a platform migration and product handover, not a redesign or an account migration. Native starts with fresh player accounts. Native-specific changes are allowed only where the web implementation cannot map directly to iOS/Android, where App Store policy requires a different integration, or where Telegram-only infrastructure must be removed.

## 2. Non-negotiable migration rules

1. The backend remains the source of truth for identity, progression, answers, balances, purchases, and unlock timing.
2. Day JSON files remain the single source of truth for story and puzzle content.
3. Puzzle and drill algorithms must not be independently rewritten in web and native. They move into shared packages and receive shared tests.
4. The Telegram app stays releasable only until native parity and rollback criteria pass; after that, it can be deprecated and shut down.
5. A screen is considered migrated only after behavior, content, visual, accessibility, and device checks pass.
6. Native platform services sit behind interfaces. Game screens must not import Telegram, Apple, secure storage, notification, or purchase SDKs directly.
7. Do not use a WebView to ship the existing app as the final native product. A WebView may be used only as a temporary internal comparison tool.
8. No new gameplay feature should be built Telegram-first once Phase 1 starts. New feature work either lands in shared packages or native.

## 3. Recommended target architecture

Consolidate the native app into the existing `ares_station_tg` monorepo after the migration foundation is proven:

```text
ares_station_tg/
├── apps/
│   ├── api/                     existing Express + Prisma backend
│   ├── web/                     legacy Telegram Mini App, retained as reference until decommission
│   └── mobile/                  Expo / React Native app
├── packages/
│   ├── domain/                  Day, Puzzle, Progress, Drill types
│   ├── game-engine/             pure reducers, progression selectors, answer formatting
│   ├── puzzle-engine/           puzzle parsers and non-visual puzzle logic
│   ├── drill-engine/            generators, scoring, mastery thresholds
│   ├── api-client/              platform-neutral HTTP client and response types
│   ├── content-schema/          JSON validation and content invariants
│   ├── design-tokens/           colors, spacing, type scale, themes, motion values
│   └── test-fixtures/           canonical player/day states and expected results
└── docs/
```

The existing `ares_station_mobile` Expo scaffold is useful for early experiments, but the production native app should eventually live in the same monorepo as the API and legacy web app. This avoids logic drift during migration and lets one change be tested against native plus the temporary Telegram reference until the Telegram client is retired.

## 4. What can be reused and what must be rebuilt

| Area | Reuse level | Migration treatment |
|---|---:|---|
| Express API and Prisma data | High | Keep; add provider-neutral authentication and native purchase verification |
| Day 1–6 JSON content | Complete | Reuse unchanged; add schema validation tests |
| Answer checking and progression | Complete | Keep server-side behavior unchanged |
| TypeScript domain types | High | Move to shared package; correct outdated puzzle unions |
| Game reducer and selectors | High | Extract pure logic; replace browser storage side effects |
| Drill generators and scoring | High | Extract pure functions into shared package |
| API response types | High | Share; make API base URL configurable |
| CSS design tokens | Medium | Convert to typed TypeScript tokens |
| React screen component markup | Low | Rebuild with React Native primitives |
| CSS Modules | None at runtime | Translate deliberately to `StyleSheet`, not automatically |
| SVG station map | Medium | Port geometry to `react-native-svg` |
| Wire puzzle SVG overlay | Medium | Rebuild measurement and touch logic using `onLayout` and native SVG |
| Animations | Medium | Recreate timing and appearance with Reanimated/native animations |
| Telegram auth and SDK | None on native | Replace with platform auth and a platform-services adapter |
| Telegram haptics | Behavior only | Map to `expo-haptics` |
| `localStorage` | None | Replace tokens with SecureStore and preferences with AsyncStorage |
| Telegram Stars | None on iOS | Replace digital purchases with StoreKit in-app purchases |
| Telegram daily bot reminders | Temporary only | Replace with native push notifications and in-app countdowns; retire bot reminders after deprecation |

## 5. Platform interfaces

Create these interfaces before migrating screens:

```ts
interface AuthService {
  restoreSession(): Promise<Session | null>;
  signIn(): Promise<Session>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

interface StorageService {
  getPreference(key: string): Promise<string | null>;
  setPreference(key: string, value: string): Promise<void>;
  removePreference(key: string): Promise<void>;
}

interface FeedbackService {
  selection(): void;
  success(): void;
  error(): void;
  impact(style: "light" | "medium" | "heavy"): void;
}

interface NotificationService {
  requestPermission(): Promise<boolean>;
  registerDevice(): Promise<void>;
}

interface PurchaseService {
  listProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<void>;
}
```

Implementations during migration:

- legacy web: Telegram SDK, browser storage, Telegram Stars;
- native iOS: Sign in with Apple, SecureStore/AsyncStorage, Expo Haptics, APNs/Expo Notifications, StoreKit;
- native Android later: Google identity or email/guest strategy, Android secure storage, FCM, Google Play Billing.

## 6. Native authentication and fresh player accounts

### Current limitation

The `Player` table assumes every player has a unique `tgUserId`. A native app does not receive Telegram `initData`, synthetic Telegram users must never be used in production, and existing Telegram users do not need to be migrated.

### Target model

Keep `Player.id` as the permanent game account ID and move native login identities into a provider-neutral table:

```prisma
model AuthIdentity {
  id         String   @id @default(uuid())
  playerId   String
  provider   String   // apple | google | guest | email, if added later
  subject    String   // provider's stable unique user identifier
  createdAt  DateTime @default(now())

  player Player @relation(fields: [playerId], references: [id])

  @@unique([provider, subject])
  @@unique([playerId, provider])
}
```

Native auth migration:

1. Allow `Player` records to be created without `tgUserId`, or replace the Telegram-specific identity requirement with `AuthIdentity`.
2. Add `/api/auth/apple`, validating Apple's identity JWT server-side.
3. Make the JWT payload depend on internal `playerId`, not on Telegram identity.
4. Store the native session/refresh token in Expo SecureStore.
5. Keep `/api/auth/telegram` only while the Telegram app is still running.
6. Add a simple shutdown flag for Telegram signups/logins when the native launch is accepted.

No Telegram-to-native transfer code is needed. Existing Telegram database rows can remain archived for legal/support/debug reasons, but they are not imported into native accounts.

## 7. Visual parity strategy

The web client currently has roughly 7,500 lines of CSS. Exact preservation requires a controlled design-system port, not screen-by-screen improvisation.

### Token conversion

Convert CSS variables into typed objects:

```ts
const themes = {
  standard: { background, surface, border, text, success, error, ... },
  artifact: { ... },
  redAlert: { ... },
  premium: { ... },
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const radii = { sm: 2, md: 4, lg: 8 };
const motion = { fast: 120, normal: 220, ... };
```

### Shared native primitives

Build these before feature screens:

- `Screen`
- `TerminalText`
- `TerminalButton`
- `TerminalInput`
- `Panel`
- `Divider`
- `TopBar`
- `Classification`
- `RedactedText`
- `StatusBadge`
- `CountdownBar`

Each primitive should support all four themes, safe areas, dynamic type limits, disabled/focus states, VoiceOver labels, and reduced motion.

### Parity method

For every migrated screen:

1. Capture reference screenshots from the Telegram app at fixed states and viewport sizes.
2. Render the same fixture state in iPhone SE, standard iPhone, and large iPhone simulators.
3. Compare layout, spacing, wrapping, colors, borders, and animation timing.
4. Record intentional native differences in a parity ledger.

Pixel identity across browser and native text engines is unrealistic. The acceptance target is perceptual identity: same hierarchy, density, palette, rhythm, and interaction feedback.

## 8. Known limitations and workarounds

### CSS and DOM cannot be shared

**Limitation:** React Native does not support CSS Modules, pseudo-selectors, browser layout measurement, DOM SVG, or HTML controls.

**Workaround:** Share tokens and state logic; rebuild UI with React Native primitives. Use explicit pressed/focused/disabled state instead of CSS pseudo-selectors.

### Font metrics will differ

**Limitation:** `"Courier New"` availability and glyph metrics differ across iOS, Android, and web.

**Workaround:** Bundle one licensed monospaced font with `expo-font` and use it as the canonical native font. Legacy Telegram font adjustments are optional and only needed for screenshot comparison during migration.

### SVG behavior differs

**Limitation:** The station map and wire puzzle rely on browser SVG and `getBoundingClientRect()`.

**Workaround:** Use `react-native-svg`. For wires, capture item positions with `onLayout`, normalize them into board coordinates, and draw lines in an absolute SVG overlay. Keep the existing tap-left/tap-right connection mechanic; do not introduce drag-only controls.

### Canvas waveform is web-specific

**Limitation:** `FrequencyTunerPuzzle` uses canvas and device pixel ratio.

**Workaround:** It is deprecated in current content, so exclude it from the first parity milestone. If restored later, implement it with React Native Skia or `react-native-svg`.

### Animations cannot be copied directly

**Limitation:** CSS keyframes, `requestAnimationFrame`, and browser timers behave differently, especially in backgrounded apps.

**Workaround:** Use Reanimated for visual transitions and wall-clock timestamps for gameplay timers. Pause or recompute timers on `AppState` changes. Preserve existing duration constants in shared motion tokens.

### Storage behavior changes

**Limitation:** `localStorage` is synchronous; native storage is asynchronous.

**Workaround:** Hydrate preferences before rendering the route tree. Store JWT/refresh credentials in SecureStore. Store non-sensitive flags such as intro-seen in AsyncStorage. Server progress remains authoritative.

### API relative paths stop working

**Limitation:** Native `fetch("/api/...")` has no browser origin.

**Workaround:** Add environment-based absolute API URLs and a shared request client. Development builds should point to a reachable LAN/tunnel/staging URL, never `localhost` unless using a simulator-specific setup.

### Telegram identity is unavailable

**Limitation:** Native iOS cannot validate Telegram Mini App `initData`.

**Workaround:** Add provider-neutral native identities and Sign in with Apple. Do not emulate Telegram identity and do not import Telegram users.

### Telegram Stars do not carry into the App Store

**Limitation:** Digital hints, currency, and skip-wait purchases in an iOS app must use Apple's in-app purchase system under normal App Store rules.

**Workaround:** Define native product IDs and verify Apple transactions server-side. Telegram Stars are not migrated into native balances. Never place a Telegram Stars purchase link inside the iOS app.

### Native release cadence is slower

**Limitation:** Some native dependency/configuration changes require a new App Store binary.

**Workaround:** Keep story content server-driven. Use EAS Update only for changes permitted by Apple and compatible with the installed native runtime. Treat new native modules and entitlements as binary releases.

### Push notification permissions are optional

**Limitation:** Users may reject native notification permission.

**Workaround:** The game remains functional without notifications. Ask only after the player understands the daily cadence, and provide an in-app countdown. Register tokens server-side per native device. Telegram bot reminders can be deleted with the Telegram app.

### Reduced motion and accessibility

**Limitation:** Current CSS has some reduced-motion support but native accessibility semantics will not transfer.

**Workaround:** Add a native motion preference hook, VoiceOver labels, minimum touch targets, focus order, and non-color success/error cues as each component is migrated.

## 9. Modular migration phases

Every phase below must leave the native app and the legacy Telegram client buildable until the documented decommission point.

### Phase 0 — Ownership and release setup

Goal: remove account and signing ambiguity before application code depends on it.

Current decision: deferred temporarily. Code migration can begin without this phase, but native signing, TestFlight, StoreKit, push notifications, and App Store release work must not depend on assumptions about the Apple Developer account.

Tasks:

- Confirm whether the friend's Apple Developer membership is an organization or individual account.
- If it is an organization, add the developer with the minimum roles needed for certificates, builds, TestFlight, and app management.
- If it is an individual account, document that the friend remains the legal App Store seller/account holder and may need to perform signing or credential actions.
- Agree in writing on app ownership, revenue, banking, privacy responsibility, source-code access, credentials, and any future App Store account transfer.
- Reserve the final bundle identifier and app name.
- Confirm control of the Expo/EAS project, repository, domain, privacy-policy URL, and backend credentials.
- Create development and preview EAS build profiles.

Exit criteria:

- A blank signed development build installs on a real iPhone.
- A blank build reaches internal TestFlight.
- Ownership and future App Store account-transfer expectations are documented.

### Phase 1 — Monorepo and shared-core foundation

Goal: create shared modules without changing gameplay.

Current progress:

- `packages/domain` exists and is consumed by API, web, and mobile.
- `packages/content-schema` validates Day 1–6 JSON content.
- `apps/mobile` exists as an Expo SDK 54 workspace package and imports `@hva/domain`.
- Root scripts include `dev:mobile`, `typecheck:mobile`, `test:content`, and ordered shared/API/web builds.

Tasks:

- Move or recreate the Expo app as `apps/mobile`.
- Add shared TypeScript packages for domain types, API contracts, design tokens, puzzle logic, and drill logic.
- Update web imports to consume one small shared package at a time.
- Correct the current `PuzzleType` definitions so they match actual content types.
- Add runtime validation for all day JSON files.
- Move static content invariants from the standalone playtest script into repeatable package tests.

Exit criteria:

- Web build and 84/84 content checks still pass.
- Mobile app imports shared day/types packages.
- No feature behavior has changed.

### Phase 2 — Native platform shell

Goal: establish the app skeleton before gameplay screens.

Current progress:

- Expo Router no longer uses the default starter tabs/demo routes.
- Native stack routes exist for loading, home, and shared-domain debug screens.
- Ares theme tokens and a React Navigation theme bridge exist.
- Terminal UI primitives exist: `Screen`, `TerminalText`, `TerminalPanel`, `TerminalButton`, `StatusBadge`, `Divider`, `TopBar`, and `Classification`.
- Platform-service boundaries exist for config, feedback/haptics, temporary storage, and app lifecycle.
- Mobile `web.output` is `single` to avoid static web SSR requirements while the app is native-first.

Tasks:

- Configure Expo Router for native file-based routes and deep links.
- Add theme provider using shared tokens.
- Add safe-area, status-bar, keyboard, error-boundary, and loading-state handling.
- Implement native platform services: storage, haptics, app lifecycle, network status.
- Add configurable API base URL.
- Add SecureStore session persistence and AsyncStorage preferences.
- Build the shared terminal primitives.

Exit criteria:

- App launches offline into a controlled error state.
- App restores theme and intro preference.
- Navigation, back gestures, safe areas, and keyboard behavior work on real iPhone.

### Phase 3 — Native authentication

Goal: make native sessions secure for fresh native players.

Tasks:

- Introduce `AuthIdentity` or equivalent native identity support.
- Add Sign in with Apple to mobile.
- Verify Apple identity tokens on the backend.
- Add refresh/revocation/logout behavior.
- Add in-app account deletion endpoint and UI.
- Add backend controls for Telegram signup/login shutdown.

Exit criteria:

- New Apple user receives a real backend player and JWT.
- Tokens survive restart securely.
- Logout and account deletion are tested.

### Phase 4 — Read-only vertical slice

Goal: prove content and visual parity with the lowest-risk screens.

Migrate:

1. Loading/auth screen
2. Classification and TopBar
3. Home
4. Document list/read-only document rendering
5. Intro

Tasks:

- Port all document line types, redactions, tables, headings, and themes.
- Replace local completed-day history with server progress where possible.
- Recreate intro timing and skip behavior only after the shared primitives and
  basic content layout have established the native visual system.

Exit criteria:

- A real user signs in and reads the current day.
- Day JSON is unchanged.
- Reference screenshot parity is approved for the migrated screens.

### Phase 5 — Simple puzzle vertical slice

Goal: complete one real puzzle loop end to end.

Migrate in this order:

1. Multi-choice
2. Keypad
3. Text input
4. Logic
5. Pattern grid

Tasks:

- Keep answer formatting and API calls shared.
- Preserve solved, wrong, checking, already-solved, hint, and reveal states.
- Recreate success flash, haptics, and return-to-document behavior.
- Verify next-day gating is unchanged.

Exit criteria:

- Day 1 can be partially completed on native.
- Solving on native updates the server-authoritative player state immediately.
- Wrong and correct answers produce the same server results.

### Phase 6 — Complex puzzle parity

Goal: migrate the interaction-heavy puzzle types.

Migrate:

1. Cipher wheel
2. Wire connections
3. Any retained frequency interaction

Tasks:

- Use Gesture Handler/Reanimated only where tap interactions are insufficient.
- Port SVG geometry with `react-native-svg`.
- Add orientation and small-screen layout tests.
- Preserve exact answer serialization sent to the API.

Exit criteria:

- All 30 current story puzzles are playable on native.
- Shared fixtures prove answer serialization matches web.
- Day 1–6 playtest passes on a physical device.

### Phase 7 — Story completion and archive

Goal: finish the complete narrative loop.

Migrate:

- Animated redaction reveal
- Story typewriter
- Day-complete ceremony
- Paradox log browser
- Collected documents archive
- Locked-day countdown

Tasks:

- Recompute countdown from server timestamps.
- Handle app background/foreground transitions.
- Persist only presentation preferences locally; progress stays server-side.

Exit criteria:

- A player can complete and archive a full day on native.
- Reload, reinstall, and second-device behavior do not lose authoritative progress.

### Phase 8 — Map and Operator Drills

Goal: reach feature parity beyond the main story.

Tasks:

- Port the station map using `react-native-svg`.
- Extract all drill generators, scoring, thresholds, and timer rules into shared packages.
- Port drill hub, four drills, workout chain, and results.
- Pause/recalculate rounds on app backgrounding.
- Finish any still-stubbed drill backend endpoints before declaring parity.

Exit criteria:

- Map states match web for the same progress fixture.
- Deterministic drill seeds produce the same puzzles on web and native.
- Score/mastery/workout API behavior is identical.

### Phase 9 — Native notifications

Goal: add native daily reminder support.

Tasks:

- Add device-token registration and revocation endpoints.
- Store multiple devices per player.
- Request notification permission after first-day completion, not at first launch.
- Send daily unlock notifications with deep links to the current day.
- Delete or ignore Telegram bot reminder logic when the Telegram app is retired.

Exit criteria:

- Notification opens the correct native route.
- Denying permission has no gameplay impact.
- Duplicate notifications are prevented per platform/device.

### Phase 10 — Native economy and purchases

Goal: preserve gameplay economy while complying with native stores.

Tasks:

- Define platform-neutral products: hint, skip wait, currency pack, premium.
- Add StoreKit products in App Store Connect.
- Implement purchase UI with a native IAP library and development build.
- Verify Apple transactions server-side before ledger credit.
- Add idempotency using provider transaction IDs.
- Add restore-purchases for non-consumables.
- Remove Telegram Stars from the native purchase path.
- Decide whether Telegram purchase code is deleted immediately or left untouched until the legacy app is removed.

Exit criteria:

- Sandbox purchases, cancellation, pending state, duplicate receipt, refund, and restore flows pass.
- No balance is granted solely from a client success callback.
- The shop shows only products legal and available on the current platform.

### Phase 11 — Native quality and TestFlight beta

Goal: prove production readiness before replacing anything.

Tasks:

- Test on minimum supported iOS, small and large phones, slow network, offline startup, background/resume, and interrupted purchases.
- Add crash reporting, structured API errors, analytics consent, and performance traces.
- Run VoiceOver, reduced-motion, dynamic-type, contrast, and touch-target checks.
- Prepare privacy policy, support URL, account deletion, App Privacy answers, age rating, screenshots, and review notes.
- Run internal TestFlight, then external TestFlight.

Exit criteria:

- No critical parity defects.
- Full Day 1–6 native regression passes.
- Crash-free and API-error targets are met during beta.
- App Review materials and demo account/instructions are ready.

### Phase 12 — App Store launch and Telegram shutdown

Goal: launch native as a fresh app and retire the Telegram app safely.

Tasks:

- Release native as the replacement client.
- Optional: announce that the Telegram version is ending and the native app is starting fresh.
- Monitor native onboarding, progression, purchases, crashes, API errors, and notification delivery.
- Keep Telegram web operational only if you want a short rollback window.
- Disable Telegram signups, progression, purchases, and bot reminders after native production launch is stable.
- Remove or lock Telegram auth endpoints after rollback and data-retention requirements are satisfied.

Exit criteria:

- Native production users can play the same current content.
- New native accounts progress correctly from zero.
- Telegram shutdown and rollback procedures are documented.

## 10. Recommended screen order

Use this order because it increases technical risk gradually:

1. Loading
2. Home
3. TopBar / Classification / shared primitives
4. Documents
5. Document/story rendering
6. Multi-choice puzzle
7. Keypad puzzle
8. Logic puzzle
9. Pattern grid
10. Cipher wheel
11. Wire puzzle
12. Paradox logs
13. Day completion/archive
14. Map
15. Drills
16. Shop/purchases
17. Notifications

Do not start with the intro, wire puzzle, map, or purchases as the first native screen. They are visually prominent but poor foundation tests because they combine multiple platform-specific problems at once.

## 11. Testing and parity gates

### Shared automated tests

- all content JSON validates;
- no answers leak into public content;
- every puzzle unlock word is reachable;
- every redacted log key is obtainable;
- answer normalization and serialization match;
- drill generator seeds and scoring match;
- reducer transitions match canonical fixtures;
- API response contracts compile against native and the legacy client until Telegram decommission.

### Native component tests

- each screen renders empty, loading, error, ready, locked, completed, and narrow-screen states;
- touch targets and labels are present;
- timers handle background/resume;
- keyboard never hides primary actions;
- reduced motion removes non-essential motion.

### End-to-end parity scenarios

1. New user onboarding
2. Fresh Apple sign-in and session restore
3. Fetch current day
4. Wrong answer and hint
5. Correct answer and unlock animation
6. Solve all puzzles
7. Read/decrypt logs
8. Complete and archive day
9. Wait for or skip next-day gate
10. Complete drill and update mastery
11. Purchase, duplicate receipt, restore, and refund
12. Delete account

## 12. Definition of native parity

Native parity is achieved when:

- Day 1–6 use the same content files and produce the same outcomes;
- every currently used puzzle type is playable;
- native progression exactly matches the legacy Telegram game rules for a fresh player;
- all themes and principal animations have approved visual parity;
- map, archive, logs, shop, and drills are available natively or explicitly feature-flagged for launch;
- authentication, purchases, notifications, and account deletion meet platform requirements;
- Telegram shutdown controls are tested before decommission;
- a full real-device playthrough succeeds without a web fallback.

## 13. Recommended immediate next step

Start only Phase 0 and Phase 1:

1. settle Apple account ownership/access;
2. install a signed blank build on a real iPhone;
3. move the Expo app into the main monorepo;
4. extract domain types, content validation, API contracts, and drill/puzzle pure logic;
5. keep every existing web test green until the native app reaches parity and Telegram shutdown is safe.

Do not begin screen conversion until these foundations pass. Once they do, Phase 2 creates the native shell and Phase 4 delivers the first visible parity slice.

## 14. External platform notes

- Expo SDK 54 SecureStore is suitable for small encrypted credentials, but not as the source of truth for progress.
- Expo's Apple Authentication response includes a signed identity JWT; the backend must verify it using Apple's public keys.
- Expo Router provides typed routes and automatic deep-link handling.
- Native remote notifications require platform credentials and should be tested in development/release builds, not assumed from Expo Go behavior.
- Apple requires in-app account deletion when the app supports account creation.
- Digital content and currency sold inside iOS should use Apple's in-app purchase mechanism.
- If the app is published under a friend's account, that account controls legal agreements, store presence, and—depending on account type—team/certificate access. A later transfer is possible only when Apple's transfer criteria are satisfied, so ownership must be settled before launch.
