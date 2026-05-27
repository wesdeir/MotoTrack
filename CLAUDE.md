# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Current version: 1.3.0** (must match `package.json` `version` field)

> **Keeping this file current:** After any session that changes architecture, adds/removes files or dependencies, introduces new patterns, or bumps the version — update this file to match. Check that the version number above matches `package.json`, that the file organization tree still reflects reality, and that any new conventions or gotchas are documented. This is the single source of truth for onboarding a new Claude Code session.

## Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # TypeScript check + production build (tsc --noEmit && vite build)
npm run typecheck    # TypeScript only (no emit)
npm run preview      # Preview production build locally
```

No test suite or linter is configured. Validate changes with `npm run typecheck` and `npm run build`.

## What This Is

MotoTrack is an offline-first PWA for tracking vehicle maintenance, fuel economy, and service reminders. Built with React 18 + TypeScript + Vite 5. Data lives entirely in IndexedDB via Dexie — no backend, no accounts, no network calls (except optional VIN decoding via NHTSA public API).

Deployed to GitHub Pages at `/MotoTrack/` via CI. Uses `HashRouter` because GitHub Pages doesn't support client-side routing with `BrowserRouter`.

## Architecture

### Provider Hierarchy (order matters)

```
ThemeProvider          — light/dark/system mode (class-based, toggles <html class="dark">)
  ColorThemeProvider   — 5 accent color themes (ocean/electric/aurora/emerald/sunset)
    TutorialProvider   — 7-step guided tour state + highlight system
      HashRouter       — react-router-dom
        AppRoutes      — onboarding gate + AppShell + page routes
```

### Data Layer

**Dexie 3** wraps IndexedDB. Schema is at `src/db/database.ts` with 4 versions:
- v1: vehicles, maintenanceRecords, fuelRecords, reminders
- v2: added `createdAt` index on vehicles
- v3: added `documents` table (GloveBox)
- v4: added `unlockedAchievements` table (gamification — one row per achievement-unlock per vehicle, with `seen` flag for celebration toast)

All CRUD hooks follow the same pattern (`useMaintenance`, `useFuel`, `useReminders`, `useDocuments`): `useLiveQuery` for reactive reads, async methods for writes. `useVehicle` is the exception — it also manages active vehicle selection via localStorage + cross-tab broadcast.

**Vehicle loading states**: `vehicle === undefined` means Dexie is still loading. `vehicle === null` means no vehicles exist. Always guard both.

**Demo data**: `src/db/seed.ts` contains ~14KB of realistic Honda Civic demo data. It's lazy-imported in two places:
1. `src/db/initDb.ts` — seeds on first launch if DB is empty
2. `src/pages/Onboarding.tsx` — "Explore Demo" button calls `clearAndReseed()`

Always dynamic-import seed.ts: `const { seedDemoData } = await import('./db/seed')`. It must not be in the main chunk.

### Code Splitting

Lazy-loaded chunks:
- **Reports page** (`recharts` ~280KB) — `React.lazy(() => import('./pages/Reports'))` in App.tsx
- **Achievements page** — `React.lazy()` in App.tsx (badge wall, infrequently visited)
- **seed.ts** (~14KB demo data) — dynamic `import()` in initDb.ts and Onboarding.tsx
- **VehicleSetupModal** (~1.8KB) — `React.lazy()` in TutorialBanner.tsx
- **OCR (`tesseract.js`)** — dynamic `import('../../utils/ocr')` from `ReceiptUpload` and `ScanReceiptButton`. The OCR module is ~17 KB; tesseract.js fetches its worker + WASM at runtime, so first-scan has network latency. Cached after that.
- **html2canvas (~200 KB)** — dynamic `import('html2canvas')` from `src/utils/sharePng.ts`. Used by Trophy case PNG share and PDF export. Lazy — first share has the load cost.

### Routing

6 routes via HashRouter: `/` (Dashboard), `/maintenance`, `/fuel`, `/reports`, `/settings`, `/achievements`. All wrapped in `AppShell` which provides the fixed layout frame (`fixed inset-0 flex flex-col`) with scrollable `<main>`, TutorialBanner, BottomNav, and the global AchievementUnlockToast. Only the first 5 are in the bottom nav — Achievements is reached via the Dashboard "Trophy Case" row.

### Two-Path Onboarding

New users (no vehicles + `mototrack-onboarding-seen` not in localStorage) see `Onboarding.tsx`:
- **"Add My Vehicle"** — advances to inline vehicle form (card 3), saves, enters app
- **"Explore Demo"** — loads demo data, starts 7-step tutorial with TutorialBanner

The tutorial auto-navigates between pages and highlights relevant UI elements using the `useTutorialHighlight` hook + CSS `tutorial-highlight` class. On completion, users can set up their own vehicle (clearing demo data) or keep exploring.

### Shared Vehicle Form

Vehicle form logic is used in 3 places (Settings, Onboarding, VehicleSetupModal). All share:
- `src/utils/vehicleForm.ts` — types, validation, form-to-data conversion
- `src/hooks/useVehicleForm.ts` — form state, error handling, VIN decode
- `src/components/features/VehicleFormFields.tsx` — shared JSX fields

Never duplicate vehicle form logic. Use these shared modules.

## Design System

iOS-inspired glassmorphism. Key conventions:

### Tailwind Tokens

- `text-ios-blue`, `bg-ios-blue` — accent color driven by `--tw-accent-rgb` CSS variable (changes per color theme)
- `text-ios-green`, `text-ios-red`, `text-ios-orange` — fixed semantic colors
- `text-ios-gray` — secondary text (`#8E8E93`)
- Glass surfaces: `bg-white/40 backdrop-blur-2xl border border-white/60` (light), `bg-[#080E1C]/70 dark:border-white/[0.08]` (dark)
- Card component (`src/components/ui/Card.tsx`) handles glass styling — use it, don't roll your own
- Shadows: `shadow-glass` / `shadow-glass-dark`

### Color Themes

5 themes defined in `ColorThemeContext.tsx`. Each applies a `theme-{id}` class to `<html>` which sets `--tw-accent-rgb` in `index.css`. The accent color flows through `ios-blue` Tailwind token automatically.

### Dark Mode

Class-based (`darkMode: 'class'` in Tailwind config). `ThemeContext` manages `light`/`dark`/`system` and toggles `<html class="dark">`. Use `dark:` prefix for dark-mode variants.

Dark-mode backgrounds use deep navy palette (`#080E1C`, `#0D1525`, etc.) not pure black.

### Safe Areas

iOS safe areas handled via CSS env(): `padding-top: calc(1rem + var(--safe-top))` on Dashboard, `padding-bottom: env(safe-area-inset-bottom)` on BottomNav. `--safe-top` is set in index.css from `env(safe-area-inset-top)`.

### UI Components

All in `src/components/ui/`: `Button`, `Card`, `Modal`, `FormField` (with `Input`/`Select`/`Textarea`), `StatCard`, `PageHeader`, `EmptyState`, `Badge`, `ConfirmDialog`, `ReceiptUpload`, `ReceiptViewer`. Always use these — don't create parallel versions.

## Key Patterns

### Formatting

All display formatting goes through `src/utils/formatters.ts`: `formatCurrency()`, `formatOdometer()`, `formatDate()`, `formatLPer100km()`, etc. Uses `Intl.NumberFormat('en-CA')` and `date-fns`. Don't hand-roll formatting.

### Reminders

Reminder status (`ok`/`due-soon`/`due-now`/`overdue`) and progress are computed in `useReminders` hook, returned as `ReminderWithStatus`. `urgentCount` is exposed for the BottomNav badge. Reminder logic lives in `src/utils/reminderLogic.ts`.

Smart interval suggestions after maintenance saves are handled by `ReminderSuggestion.tsx` — uses `getDefaultInterval()` from that component to look up standard intervals per category.

### Fuel Economy

Economy is computed by `enrichFuelRecords()` in `useFuel` hook — `lPer100km`, `kmPerL`, `costPerKm` are derived fields, not stored in DB. Anomaly detection (`detectEconomyAnomalies` in `fuelCalc.ts`) flags fill-ups 15%+ worse than trailing 5-fill average.

### Receipt/Document Images

Stored as base64 data URLs in IndexedDB. Compressed via `src/utils/imageUtils.ts` before storage. Shared upload component: `ReceiptUpload.tsx`. Shared viewer: `ReceiptViewer.tsx`. GloveBox documents use the same pattern.

### Gamification

Eight retention features wired into `useAchievements`. Persistence is minimal — only `unlockedAchievements` + `healthScoreSnapshots` are stored; everything else derives from live data.

- **Vehicle Health Score** (`src/utils/healthScore.ts`): pure 0–100 calc across four categories (reminders, activity recency, service engagement, documentation). Shown on the Dashboard via `HealthScoreCard.tsx` with a tap-through breakdown modal. Now also computed inside `useAchievements` and exposed to `AchievementContext` so score-based predicates work.
- **Achievements** (`src/utils/achievements.ts`, `src/hooks/useAchievements.ts`): catalog of **~70 achievements across 9 categories** (service, fuel, reminders, docs, milestone, mastery, streak, health, secret) with predicate functions. The hook watches the active vehicle's data and writes unlock rows to `db.unlockedAchievements` (one per achievement-id × vehicle-id pair, idempotent via the `[vehicleId+achievementId]` compound index). Fresh unlocks have `seen=false` until the user dismisses `AchievementUnlockToast` or visits the Achievements page. Catalog includes themed badges for DIY work and performance/mod culture (keyword-matched against notes + parts).
- **Hidden achievements** (`AchievementDefinition.hidden`): secret badges render as `???` with a `?` icon and "Hidden achievement — keep exploring" until unlocked. The 4 Easter-egg badges (`lucky-sevens`, `late-night-logger`, `off-by-one`, `new-years-resolution`) are hidden by default. AlmostThereCard filters them out so progress doesn't tease.
- **XP / Levels** (`src/utils/achievements.ts`): each unlocked badge contributes XP per tier (`XP_BY_TIER` = 10/25/50/100). `calculateLevel(totalXp)` resolves the current `LEVELS` tier — 10 levels from Rookie Driver → Garage Royalty. Surfaced in the Achievements page header card with a progress bar to the next title.
- **Streaks** (`src/utils/streaks.ts`): `calculateStreak(maintenance, fuel)` returns current/longest consecutive ISO-week active streak (Monday-anchored, lenient about the current week). Streak achievements live in their own `streak` category. Surfaced as "Active streak: N weeks 🔥" inside the Dashboard vehicle card.
- **"Almost There" widget** (`src/components/features/AlmostThereCard.tsx`): top 3 non-hidden locked achievements with the highest progress fraction (above a 20% floor).
- **Showcase / Pinned badges** (`ShowcaseCard.tsx` on Dashboard, `togglePin` in `useAchievements`): users can pin up to `PIN_LIMIT` (3) unlocked badges. Pinning when at the cap evicts the oldest pin. Stored as `pinned`/`pinnedAt` columns on `unlockedAchievements` (no separate table — Dexie tolerates the new optional fields without a schema bump). Empty slots show "Pin a badge" hint when the user has any unlocks.
- **Filters + sort on Achievements page**: pill row (All / Unlocked / In Progress / Locked) plus sort select (Category / Newest / Closest / Tier). When sort = Category, the grouped sections render; other sorts flatten to a single 3-col grid.
- **Scaled confetti per tier** (`Confetti.tsx`): all unlocks now burst — t1 = 12 monochrome accent pieces / t2 = 24 two-color / t3 = 40 (current) / t4 = 60 + a brief screen flash. Gated by `useCelebrateUnlocks` preference (Settings → Preferences → "Celebrate unlocks"). Also fires `navigator.vibrate` where supported.
- **Health-score snapshots** (DB v6 `healthScoreSnapshots` table): one row per vehicle per day, written from `useAchievements` whenever the score is computed. Pruned at 60-day rolling window. Powers the `phoenix` achievement (climb from <40 to 80+ within 30 days) AND the health sparkline on `HealthScoreCard`.
- **Health sparkline** (`HealthSparkline.tsx`): pure-SVG line chart of the snapshots. Renders inline in `HealthScoreCard` (compact, 22px) and expanded in its modal (80px with y-axis ticks + area fill). Tier-coloured stroke/fill matched to current health tier. Renders nothing if fewer than 2 snapshots exist.
- **Achievement chains** (`AchievementDefinition.chainId` + `chainOrder`, `CHAINS` constant in `achievements.ts`, `ChainsView` in `Achievements.tsx`): 11 visual progression series (service-count, fuel-count, premium-fuel, brakes, mileage, tenure, streak, diy, spend, receipts, health). Each chain renders as a horizontal row of badges connected by progress fill, with the next-to-unlock highlighted with a glow ring. Accessed via the "Chains" sort mode.
- **Milestone full-screen celebrations** (`MilestoneCelebration.tsx`, `MilestoneCelebrationManager.tsx`): when the active vehicle crosses an odometer milestone (every 50k from 50k → 1M), a full-screen takeover fires — rolling number animation, tier-4 confetti (legendary visuals at 100k/200k/300k/500k/1M). Tracks last-celebrated odometer per-vehicle (`Vehicle.lastCelebratedOdometer`). Existing pre-v0.9 vehicles get silently initialized to their current odometer's nearest past milestone on first launch — no retroactive blast.
- **Tutorial** (`TutorialBanner.tsx`, `TutorialContext.tsx`): 10-step guided tour for demo-data users. Covers Dashboard, health, quick actions, level/achievements, showcase, maintenance log, reminders, fuel, reports, finish. Completion sets `mototrack-tutorial-completion-pending` in localStorage; `useAchievements` watches for the flag and grants the `welcome-wrench` hidden achievement against whichever vehicle is settled (works for both the immediate-finish path AND the "Set Up My Vehicle" path where the active vehicle swaps after the handler fires). Flag is cleared once granted. Highlight system uses `useTutorialHighlight(id)` and the `tutorial-highlight` CSS class.
- **Onboarding → app transition** (`App.tsx`): `handleOnboardingDone` calls `navigate('/', { replace: true })` so users who cleared all data from `/settings` (or any non-root route) land on Dashboard when Routes re-mount. Otherwise the tutorial's first-step highlight would point at nothing.

### v1.0 — Friction killers + moments

- **Photo OCR for receipts** (`src/utils/ocr.ts`, `ScanReceiptButton.tsx`, `ReceiptUpload.onScanned`): tesseract.js parses gas-pump and service receipts client-side (offline-first preserved). Lazy-loaded — the OCR module is its own chunk (~17 KB; tesseract worker + WASM fetched at runtime). `scanReceipt(file)` returns `{ amount, date, litres, pricePerLitre, odometer }` after regex extraction. `MaintenanceForm` wires OCR through its existing `ReceiptUpload` via the new `onScanned` callback — attaching a receipt auto-fills the form. `FuelForm` (which doesn't persist receipts) uses the standalone `ScanReceiptButton` for fill-only OCR. Both forms only auto-fill EMPTY fields — never overwrite user input.
- **OEM maintenance schedule import** (`src/utils/recommendedSchedule.ts`, `RecommendedRemindersModal.tsx`): generic baseline schedule (oil, tires, brakes, filters, coolant, etc.) with make-specific overrides for ~15 common manufacturers (Toyota, Honda, BMW, Tesla EV-aware, etc.). Surfaced on the Maintenance → Reminders empty state as "Add Recommended Reminders" — opens a modal with check/uncheck for each item, then bulk-creates active reminders. New reminders start without `lastServiceDate` so they're in "no baseline yet" state until the user logs the corresponding service.
- **Year-in-Review** (`YearInReview.tsx`, `YearInReviewManager.tsx`, `src/utils/yearStats.ts`): Spotify-Wrapped-style modal slideshow with annual stats (km driven, services, fuel, achievements, top category). Auto-triggers on first launch in a new calendar year for vehicles with ≥3 log entries from the previous year. Per-vehicle flag (`mototrack-yir-shown-${year}-${vehicleId}`) blocks re-fire. Settings → Preferences → "Replay last year's wrap" dispatches a window event the manager listens for, bypassing the flag.
- **Vehicle Anniversary** (`VehicleAnniversaryCelebration.tsx`, `VehicleAnniversaryManager.tsx`): full-screen celebration when the vehicle's `createdAt` anniversary date passes. Once-per-year per vehicle via `Vehicle.lastAnniversaryCelebrated` (calendar year number). Shows mini-stats over the trailing 365 days. Pure delight moment — no new achievement (existing `year-one`/`two-year-club`/`five-year-pro` chain covers the milestone side).

### v1.1 — Safety

- **NHTSA recall alerts** (`src/utils/recalls.ts`, `useRecalls.ts`, `RecallCard.tsx`): fetches active recalls for the active vehicle's year/make/model from NHTSA's free public API. Tries the full model first ("F-150", "Model 3") then falls back to the first word ("Civic" from "Civic SiR (EP3)") and merges results — handles users who packed trim info into the model string. 7-day cache in localStorage keyed by `${year}:${make}:${model}`. Banner appears on the Dashboard above the Health Score; do-not-drive recalls (`parkIt`) escalate the visual to red. Tap-through modal shows each recall with NHTSA campaign link + per-recall "Mark Resolved" (stored in localStorage as `mototrack-recall-ack:${vehicleId}:${campaignNumber}`). All data is best-effort — fetch failures fall through silently to "no recalls shown."

### v1.3 — Tank size + EPA integration

- **OEM tank capacity lookup** (`src/utils/epaVehicleData.ts`): queries EPA's free FuelEconomy.gov API to find the fuel tank capacity for a given year/make/model. NHTSA's vPIC decode doesn't include tank size, so EPA fills the gap. Two-step lookup: `menu/options` returns matching vehicle IDs, then `vehicle/{id}` returns full data with `tankSize1` (gallons → converted to litres, rounded to 0.1). Tries the full model first, then a first-word fallback for "Civic SiR (EP3)" → "Civic". 30-day cache in localStorage. Returns null on no-match or fetch failure.
- **Auto-populate flow** (`useVehicleForm.handleDecodeVin`): after successful VIN decode, fires a background lookup using the decoded year/make/model. Populates `tankSizeLitres` only if the user hasn't already entered one. Manual "Look up" button next to the field (in `VehicleFormFields`) lets users without a VIN trigger the same query using whatever year/make/model they've typed.
- **Range estimate on Dashboard**: when both `tankSizeLitres` and a rolling average L/100km exist, the vehicle card shows `Tank: 50 L · ~714 km range` — computed as `tankSize × 100 / avgLPer100km`. Both inputs are optional; the row hides if tank size is missing, and the range portion hides if no fuel records exist yet.
- **Schema:** `Vehicle.tankSizeLitres?: number` — optional, no migration needed.

### v1.2 — In-app depth

- **Easter-egg achievements**: two new hidden badges with `predicate: () => false`, granted via `grantAchievement(vehicleId, id)` from listeners. `konami` (Konami code via global keyboard listener in `KonamiListener.tsx` mounted in AppShell — desktop / Bluetooth-keyboard only) and `insider` (7 rapid taps on the version label in Settings → About via inline `VersionTap` component). Both fully reset on key mismatch or pause.
- **Almost-there progress toasts** (`AchievementProgressToast.tsx`): watches in-progress non-hidden achievements via `useAchievements`. When progress crosses 50% or 90% for the first time, queues a bottom-of-screen toast with the badge icon + "Halfway there"/"Almost there" + current progress label. Per-vehicle per-achievement state in localStorage as `mototrack-progress-notified:${vehicleId}:${achievementId} = pct`. Bootstrap-safe: first paint for a new vehicle records current thresholds without firing toasts — prevents blasting 40 toasts when loading the demo dataset.
- **Trophy case PNG share** (`TrophyShareCard.tsx`, `src/utils/sharePng.ts`): Share button in the Achievements page header (only shown when ≥1 unlock). Renders a dedicated off-screen `TrophyShareCard` (600px logical, branded layout with level circle / top 12 badges / vehicle / footer) and captures it via lazy-loaded `html2canvas` (`scale: 2` for retina). Shares through Web Share API where available, falls back to download. The share card is portrait-oriented and uses inline styles so html2canvas can render reliably without Tailwind dependency.
- **Achievement timeline** (`TimelineView` in `Achievements.tsx`): new `timeline` sort mode. Vertical chronological feed of unlocks grouped by Today / Yesterday / This Week / This Month / Earlier. Header shows trailing-7-day unlock count + lifetime total. Locked achievements excluded since the feed is about history.

**Schema versions to remember:** v1 base · v2 vehicles createdAt index · v3 documents · v4 unlockedAchievements · (v5 skipped — `pinned` added as no-index optional column) · v6 healthScoreSnapshots.

**Date capture for time-aware achievements:** `parseFormDate` in `formatters.ts` is used by Maintenance/Fuel forms. If the picked YYYY-MM-DD matches today, it stamps `Date.now()` (ms precision) so achievements like Late-Night Logger can fire. For backdated entries it parses as midnight. For edits without changing the date it preserves the record's original time.

**Important:** data wipes (`Settings.handleClearAll`, `seed.clearDemoData`, `seed.clearAndReseed`, `useVehicle.deleteVehicle`) and the backup/restore include BOTH `unlockedAchievements` AND `healthScoreSnapshots`. Keep both in sync when adding more state. Everything else (XP, level, streak, Almost There, Showcase) derives from those two tables + the live data, so wiping them resets the gamification layer.

## Build & Deploy

- `__APP_VERSION__` is injected at build time from `package.json` version via Vite `define`
- When `CI=true` (GitHub Actions), `base` is set to `/MotoTrack/` for GitHub Pages
- PWA configured via `vite-plugin-pwa` with Workbox precaching and `autoUpdate` registration
- Version bumps: edit `package.json` version field, commit with message like `chore: bump version to X.Y.Z`
- SemVer convention: 1.0+ — bumped from `0.x` once the catalog of "ship to community" features landed (OCR, OEM schedules, year-in-review, vehicle anniversaries). Future versions: `1.MINOR.PATCH` — minor for new features, patch for fixes/polish.

## File Organization

```
src/
  components/
    ui/            — Reusable design system components
    features/      — Domain-specific components (FuelItem, MaintenanceItem, ReminderCard,
                     HealthScoreCard, HealthSparkline, AlmostThereCard, ShowcaseCard,
                     AchievementUnlockToast, AchievementProgressToast, Confetti,
                     MilestoneCelebration, MilestoneCelebrationManager,
                     RecommendedRemindersModal,
                     YearInReview, YearInReviewManager,
                     VehicleAnniversaryCelebration, VehicleAnniversaryManager,
                     RecallCard, KonamiListener, TrophyShareCard, etc.)
    layout/        — AppShell, BottomNav
  context/         — React contexts (Theme, ColorTheme, Tutorial)
  db/              — Dexie database, seed data, init logic
  hooks/           — Custom hooks (useVehicle, useFuel, useMaintenance, useReminders,
                     useDocuments, useAchievements, usePreferences)
  models/          — TypeScript interfaces and type constants
  pages/           — Route-level page components
    Maintenance/   — MaintenancePage, MaintenanceForm, TimelineView
    Fuel/          — FuelPage, FuelForm
    Achievements   — Badge wall (single file: Achievements.tsx)
  utils/           — Pure functions (formatters, calculations, VIN decoder, image utils,
                     PDF export, healthScore, achievements, streaks, ocr,
                     recommendedSchedule, yearStats, recalls, sharePng,
                     epaVehicleData)
```

## Gotchas

- `@` path alias is configured in both `tsconfig.json` and `vite.config.ts` — but the codebase uses relative imports everywhere. Either convention works, just be consistent per file.
- Dexie `useLiveQuery` returns `undefined` while loading, then the actual data. Always handle the loading state.
- The `parts: PartUsed[]` field on MaintenanceRecord has full form UI in MaintenanceForm (collapsible "Parts Used" section). `partsCost` auto-syncs from parts array sum.
- Timer/interval cleanup: any `setTimeout` in components must be cleaned up in a `useEffect` return. We fixed memory leaks from toast timers in VehicleSetupModal and Settings — follow the same pattern.
- Tutorial hooks ordering: in TutorialBanner, all hooks must run before any early `return null` — React's rules of hooks.
