# TODO / Roadmap

Living document — what's queued up next, in priority order. Resume from here.

---

## Active: Achievement system expansion → v0.8.0

Foundation already shipped in v0.7.0 (35 achievements, 8 levels, streaks, almost-there widget, tier-3+ confetti). Below is the full all-in plan to triple the catalog and add five new mechanics.

### 0. Quick bug fix (do first)

`HealthScoreCard` hint text renders as collapsed/overlapping glyphs on first paint on iOS PWA. Cause: `line-clamp-2` on a `display: -webkit-box` element inside a flex parent — the line-height calc races with font metrics, two lines of glyphs land in the same vertical slot. Tap re-render fixes it.

- File: `src/components/features/HealthScoreCard.tsx` line ~82
- Fix: drop `line-clamp-2` (none of the hints exceed ~70 chars; natural 2–3 line wrap is fine). Alternatively bump to `line-clamp-3`.

### Phase A — Catalog expansion → ~65 achievements

Pure data, no schema change. Goal: every player profile (frugal / premium / DIY / shop-loyal / high-mileage / weekend warrior) has badges tailored to them.

**New categories:** promote **streak** out of milestone, add **health** (score-based), add **secret** (hidden Easter eggs). Final: `service, fuel, reminders, docs, milestone, mastery, streak, health, secret`.

**~30 new achievements:**

| Category | Badges |
|---|---|
| Service depth | Maintenance Marathon (5 in a month), Same-Day Hero (3 in one day), DIY Mechanic (5 services with no shop), Tire Whisperer (4 tire services), Brake Master (10 brake — t3 escalation) |
| Fuel depth | Fuel Economist (<6 L/100km over 10 fills, t3), Eco Crusader (<5 L/100km over 10 fills, t4), Tank Topper (25 full-tank fills), Splash & Go (10 partial fills), Premium Stick (25 premium fills, t3) |
| Spend | Penny Pincher (service under $20), Frugal Year (year-spend under $500), Ten-K Club ($10K total, t4) |
| Activity patterns | Weekend Warrior (10 logs Sat/Sun), Workday Wrencher (20 logs Mon–Fri), Sprint (5 logs in one week), Marathon (activity in 6 different months of one year, t3) |
| Tenure | Two-Year Club, Five-Year Pro (t4) |
| Streak (new tiers) | Two-Month Steady (8w), Half-Year Hero (26w, t3) |
| Health | Healthy (80+ score), Perfect Score (100, t4), Phoenix (<40 → 80+ within 30 days — needs snapshots) |
| Docs | Vault Keeper (5+ docs stored), Renewal Ready (a document with expiry date set) |
| Reminders | Air Traffic Control (10 active), Zero Inbox (3+ active, all `ok` status — needs enriched reminders) |
| Secret (hidden) | Lucky Sevens (77,777 km), Late-Night Logger (log between midnight–5am — needs time-of-day), Off-By-One (record exactly $1.00 cost), New Year's Resolution (Jan 1 activity) |

**Refactor needed:** form defaults currently use `startOfDay(today)`. Switch to `Date.now()` (ms precision) so time-aware achievements can fire. Existing rows stay valid.

**Tier rebalance target:** 12 / 28 / 18 / 7 across t1–t4. Max XP grows ~850 → ~1500. Adjust `LEVELS` so Gearhead Legend caps near 1100 XP (~73% of max, same difficulty curve).

### Phase B — Hidden achievements

Add `hidden?: boolean` to `AchievementDefinition`. Hidden ones render as `???` with `?` icon and "Hidden achievement — keep exploring" until unlocked. Toast still pops normally with real title. Use for all 4 secrets in Phase A.

### Phase C — Pin / showcase favorite badges

DB v5 migration: add `pinned: boolean` to `unlockedAchievements`. Cap at 3 pins. UI:
- Pin/Unpin button in achievement detail modal (when unlocked)
- New "Showcase" row on Dashboard above Trophy Case — three badges side by side. Empty state: "Tap any unlocked badge → Pin to feature it here."
- Gold ring overlay on pinned badges in the wall

### Phase D — Filters + sort on Achievements page

Pill row at top: `All` / `Unlocked` / `In Progress` / `Locked`. Sort dropdown: `By Category` / `Newest` / `Closest to unlock` / `By Tier`. Local state only, no schema change.

### Phase E — Scaled confetti per tier + Settings toggle

Currently t3+ only. Scale:
- t1: 12 pieces, 0.8s, monochrome (theme accent)
- t2: 24 pieces, 1.2s, 2 colors
- t3: 40 pieces (current)
- t4: 60 pieces + brief screen flash + slower fall

Settings toggle: `Celebrate unlocks` (on/off). Optional `navigator.vibrate(60)` where supported.

### Phase F — Refactor: enriched context (unlocks Health + Reminders achievements)

Today `AchievementContext.reminders` is `Reminder[]`. Needed: `ReminderWithStatus[]` (for Zero Inbox) + computed `HealthScore` (for Healthy / Perfect Score / Phoenix).

Changes in `useAchievements`:
1. Compute `avgKmPerDay` from fuel → enrich reminders via `getReminderWithStatus`
2. Compute `healthScore` via existing helper
3. Extend `AchievementContext` with both
4. DB v6: `healthScoreSnapshots` table (`{ vehicleId, date, score }`). Snapshot once per day on app open, prune older than 60 days. Used by Phoenix predicate.

### Phase G — Achievement timeline

Tab or modal on Achievements page: chronological feed of unlocks (date + tier badge + animated row reveal), sorted by `unlockedAt` desc. Header: "X unlocks this week" stat.

### Phase H — Share trophy case as PNG

`html2canvas` already loaded for PDF export. Share button on Achievements page: capture level header + badge wall (unlocked only), export PNG, trigger Web Share API where available (download fallback).

### Phase I — Sound effects (optional, skip unless requested)

Pre-load short ~5KB WAV/OGG per tier. Web Audio API. Settings toggle. Easy to skip — unlock sounds annoy many users.

### Implementation order (tonight when usage resets)

| Order | Phase | Effort | Impact |
|---|---|---|---|
| 1 | Bug fix: line-clamp | trivial | quality |
| 2 | **A** — Catalog expansion + level retuning | medium | huge |
| 3 | **B** — Hidden achievements | small | high |
| 4 | **D** — Filters + sort | small | medium |
| 5 | **E** — Scaled confetti + Settings toggle | small | medium |
| 6 | **C** — Pin/showcase (DB v5) | medium | high |
| 7 | **F** — Context refactor + 3 health achievements (DB v6) | medium | medium |
| 8 | **G** — Timeline view | small | medium |
| 9 | **H** — PNG share | small | nice-to-have |

**Tonight minimum:** 1–5 (no migrations, catalog tripled, polish lands).
**Tonight stretch:** add 6–7 (pinning + health-aware).
**Next session:** 8–9.

### Open decisions

1. OK with time-of-day refactor on log dates? (needed for Late-Night Logger + any future time-aware achievement)
2. Pin slots — 3 or unlimited?
3. Sound effects — yes or skip?
4. Any achievement themes missing? DIY / off-road / classic-car / EV-specific?

---

## Future explorations (research notes, NOT committed work)

### Apple CarPlay integration

**Blocker:** PWAs cannot run on CarPlay. CarPlay requires a native iOS app implementing `CPTemplateApplicationScene` from the CarPlay framework. Even then, Apple gates the CarPlay entitlement to specific app categories:
- Audio
- Communication
- Navigation
- EV charging
- Parking
- Quick food ordering
- Driving task (limited use cases — fueling, automaker companion)

**Assessment:** a maintenance tracker alone almost certainly won't get the entitlement approved. **Navigation does** — which is why the nav idea below dovetails.

**Possible paths:**
1. **Capacitor wrapper** → ship as native iOS app with PWA inside, add CarPlay scene targeting Apple's "Driving task" or "Navigation" category. Capacitor doesn't have first-class CarPlay support today; would need a custom Swift plugin.
2. **Full native rewrite** in SwiftUI. Maximum control, maximum cost. Months of work.
3. **Skip CarPlay**, design for phone-mount usage with a "Drive Mode" big-button view in the PWA (no Apple entitlement needed; covers 80% of the perceived value).

**Recommendation:** Drive Mode in the PWA first (1–2 weeks of work, no app store, no entitlement). Revisit native + CarPlay only if there's a clear navigation product attached, because that's the only category likely to clear Apple review.

### Built-in navigation (Waze-style)

**Honest scope assessment:**

What it actually requires:
- Map tiles + routing engine: MapBox / MapLibre / Google Maps Platform / Apple MapKit JS. Free tiers cap around 25k–50k requests/month — paid past that.
- Turn-by-turn UI + voice prompts
- Background GPS tracking (iOS PWAs have **severely limited** background geolocation — the OS suspends JS execution. Foreground-only is doable; true background requires native.)
- Routing logic, ETA, traffic data (traffic data requires paid tier on most providers)

**Data capture value (significant):**
- Real trip distance correlated with fuel-economy entries → "your last trip used 8.2 L/100km, 1.4 L worse than your average"
- Driving habits (highway vs city ratio, average trip length, harsh braking via accelerometer)
- Auto-prompt to log fuel after detecting a gas station stop
- Auto-update odometer from cumulative trip distance — kills the manual-entry friction
- Genuine retention lift: people open nav apps daily, maintenance apps quarterly

**Differentiated angles for the car-people audience:**
- "Scenic mode" / twisty-road finder (overlay curvature data on routes)
- Car-meet check-ins
- Track-day mode (lap timer + route trace)
- Cruise route library — shareable scenic drives

**Practical path:**
- **PWA-feasible MVP:** foreground-only trip logger. User taps "Start Trip" → app tracks GPS while open → captures distance, route polyline, fuel-economy correlation. No turn-by-turn yet. ~3–4 weeks. Validates whether users actually use it before committing to full nav.
- **Full nav requires going native** (React Native or SwiftUI/Compose) plus a paid maps SDK. 3–6 months.

**My take:** the data-capture upside is real and the car-people angle (scenic mode, track day) is a legitimate differentiator. But it's a product pivot, not a feature add — MotoTrack stops being "the offline maintenance tracker" and becomes "the car companion app." Worth deciding intentionally rather than drifting into it.

**Suggested next step:** build the foreground "Trip Logger" MVP in the PWA. Cheap, no SDK lock-in, validates demand. If users adopt it, the case for native + full nav writes itself.

---

## Other ideas (parking lot)

- Multi-vehicle garage UX (already in DB, light UI)
- Cost-of-ownership projections (residual value + maintenance forecast)
- Cloud backup / cross-device sync (encrypted, optional — would need a backend, currently zero-backend)

---

# Beyond v0.8 — Engagement Roadmap

## Design philosophy (decided 2026-05-23)

**We do NOT chase daily check-ins.** A maintenance app isn't intrinsically daily-use — most owners don't service or fuel daily, so forcing daily logins creates hollow gamification (the Duolingo problem: people open it to maintain streak, not because they want to). That's bad UX and we won't do it.

**Instead: depth over frequency.** When the user *is* in the app, give them rich content to explore — beautiful visualizations, progression discovery, "wait, there's more?" moments, tools that save them real time, personalization. Make each session deep and rewarding. Notifications are for genuinely time-sensitive things (reminder coming due, recall alert), not "come back" guilt.

**Anti-patterns to avoid:**
- Daily check-in streaks
- Daily challenges that feel like chores
- "You haven't visited in 3 days" guilt notifications
- Wheel-of-fortune / spin-to-win cheese

**Patterns to embrace:**
- Friction killers (OCR, OEM imports) — when they ARE there, logging takes seconds
- Visual progression (chains, sparklines, level ladders) — "what's next" pull
- Special moments (anniversaries, milestones, year-in-review) — rare and emotional, not daily
- Genuine utility (recall alerts, OEM schedules) — open the app because it solves a real problem

---

## v0.9 — "Depth, not daily" (next batch)

Tutorial polish + visual progression + small delight moments. No new daily mechanics. Ship as a cohesive engagement layer.

### Phase 1: Tutorial rework + Welcome Wrench

Current tutorial is 7 steps and never mentions achievements / health / streaks / pinning — three of the app's most distinctive features. Rework to ~9 steps.

| # | Step | Notes |
|---|---|---|
| 1 | Your Dashboard | unchanged |
| 2 | Quick Actions | unchanged |
| 3 | **Vehicle Health Score** | NEW — explain 0–100 + 4 categories, highlight `HealthScoreCard`. "Your daily progress signal." |
| 4 | **Trophy Case + Level** | NEW — auto-nav to `/achievements`, highlight level card. "Every log earns XP. Hit milestones to level up." |
| 5 | **Pin a badge** | NEW interactive — user taps a pre-unlocked demo badge → pins it. Returns to Dashboard, highlights ShowcaseCard. Has an 8s skip fallback. |
| 6 | Maintenance Log | was #3 |
| 7 | Service Reminders | was #4 |
| 8 | Fuel Tracking | was #5 |
| 9 | Reports & Insights | was #6 |
| 10 | **You're all set + reward** | grants the **Welcome Wrench** achievement immediately — first-unlock confetti experience during onboarding |

**Welcome Wrench achievement:** `id: 'welcome-wrench'`, `hidden: true`, `predicate: () => false`. Inserted directly via `db.unlockedAchievements.add(...)` in `TutorialContext.complete()` for the active vehicle. The hook only ever adds rows so a permanently-false predicate is safe.

### Phase 2: Achievement chains (visual progression)

Group related achievement series into visual "chains" on the Achievements page. Each chain shows tier→tier progression with the next link glowing.

**Chains to define:**
- Service count: First Wrench → Service Veteran → Service Master → Lifer
- Fuel count: First Fill → Fuel Tracker → Pump Pro → Premium Stick
- Tenure: Week One → Month One → Anniversary → Two-Year Club → Five-Year Pro
- Mileage: 100k → 200k → 300k Legend
- Streak: Hot Streak → Two-Month Steady → Diligent → Half-Year Hero → Year-Round
- DIY: Solo Wrench → DIY Mechanic → Garage Master → Self-Sufficient
- Spend: Big Spender → High Roller → Ten-K Club

**Data model:** add `chainId?: string` and `chainOrder?: number` to `AchievementDefinition`. Render as a horizontal chain UI in a new "Tracks" tab on the Achievements page (alongside Category / Newest / Closest / Tier sort modes — add "By Chain"). Chains visualize the rung you're on with the locked rungs ghosted.

### Phase 3: Health score sparkline (use snapshots we already collect)

Phase F already writes daily `healthScoreSnapshots`. We have the data — surface it.

- Mini 60-day sparkline on `HealthScoreCard` (collapsed) under the topHint
- Expanded version in the breakdown modal showing the line chart with the four-category contributions stacked
- Use `recharts` (already loaded for Reports page)

### Phase 4: Milestone full-screen celebrations

Crossing 100k / 200k / 300k / every 50k beyond doesn't get a special moment today — it's just a regular achievement toast. Replace with full-screen takeover:
- Large odometer rolling animation
- Confetti burst (tier-4 scale)
- "1 year of MotoTrack" / "100k club" headline
- Shareable PNG export inline
- Triggered when `vehicle.currentOdometer` crosses a milestone via odometer update

Persisted: add a `lastCelebratedOdometer: number` field per vehicle so we don't re-celebrate on every reload.

---

## v1.0 — "Ship it to the community"

The version where MotoTrack stops being a personal project and is genuinely worth telling people about. Friction killers + emotional moments.

### Phase 5: Photo OCR for receipts (HIGH-PRIORITY user pick)

The biggest friction in the app today is manual entry. Camera-snap of a gas pump receipt → auto-fill the form.

**Approach options:**
1. **Tesseract.js** — pure-client, ~2MB lazy-loaded WASM. Free, private (stays on device). Accuracy ~70-80% on receipts, worse on faded ones.
2. **Cloud OCR API** — Google Cloud Vision / AWS Textract / Mindee receipt API. ~95% accuracy, $0.001-0.01 per scan. Requires backend or direct API call with rate-limited key.
3. **Hybrid: device + AI vision model** — fetch to an LLM with vision (Claude/GPT-4o) for receipt parsing. Best accuracy + structured output. Requires API key.

**Recommendation:** Tesseract.js first (zero cost, privacy-aligned with offline-first promise). Add cloud fallback if Tesseract accuracy is too low in practice. Lazy-loaded so it doesn't bloat the main bundle.

**Flow:** receipt-upload component grows a "Scan receipt" button → camera intent → OCR → regex-extract amount, date, litres, price/L → pre-fill form fields → user reviews + saves.

### Phase 6: VIN-based OEM maintenance schedule import (HIGH-PRIORITY user pick)

On vehicle setup with VIN, fetch the manufacturer's recommended maintenance schedule and pre-populate reminders. Massive setup-time savings + ensures users have meaningful reminders day one.

**Data source options:**
1. **NHTSA** — has VIN decode but NOT maintenance schedules
2. **OEM owner-portal APIs** — Toyota, Ford, GM each have proprietary APIs requiring partnerships. Not viable.
3. **Carfax/Carmd API** — paid, ~$0.05-0.20 per VIN lookup, returns recommended schedule
4. **Crowdsourced / static dataset** — build our own JSON dataset of common schedules by make/model/year. Free, but maintenance work, less coverage
5. **LLM extraction from owner's manual PDFs** — user uploads their manual, LLM extracts schedule. Cool but requires LLM API

**Recommendation:** Start with a curated JSON dataset for the top 30 makes (covers 80% of NA market). Add Carmd as a paid fallback for "long tail" vehicles. LLM extraction in v1.x as a power-user feature.

**Flow:** during vehicle setup after VIN decode → "We found 8 recommended services for your vehicle. Add them?" → user previews + checks/unchecks → reminders populated.

### Phase 7: Year-in-Review (Wrapped-style)

First time the user opens the app in January, modal slideshow: "you logged $X, drove Y km, averaged Z L/100km, unlocked N badges, longest streak W weeks, top service category." Per-slide animation, shareable PNG at the end. The kind of thing people post.

Suppress automatically if the vehicle has < 6 months of data (would be empty).

### Phase 8: Vehicle anniversary celebrations

When `vehicle.createdAt` anniversary passes, on next app open: "🎂 Civic SiR turns 2 in MotoTrack today!" + year-in-mini-numbers + a special "Anniversary" achievement (one per year). Pure delight moment.

---

## v1.1 — Genuine daily utility (notification-worthy)

These are the features that earn the right to push a notification, because there's a real reason the user needs to know NOW.

### Phase 9: VIN recall alerts (NHTSA)

NHTSA exposes a recall lookup endpoint. On VIN decode, check for active recalls. Re-check weekly in the background.

- Display as an urgent banner on the vehicle card (above health score)
- Push notification when a new recall is detected (genuine safety, not nag)
- Tap → modal with recall details + manufacturer remedy

### Phase 10: Push notifications (iOS 16.4+ PWA support)

Only for time-sensitive events:
- Reminder coming due in 7 days
- New recall detected
- Streak about to break (single Sunday-evening reminder — opt-in, easy to disable)

Settings → Notifications panel with granular toggles per category. Default: all off, user opts in.

### Phase 11: Siri Shortcuts / Web Share Target

"Hey Siri, log gas" → opens MotoTrack to FuelForm. Web Share Target lets users share photos from anywhere → opens receipt upload. Zero-friction logging.

### Phase 12: Apple Wallet pass for vehicle docs

Insurance card + registration as Wallet passes with expiry. Locks the app into the daily wallet rotation without forcing app opens.

---

## v1.2 — In-app depth (the long tail of "more to explore")

12. **Fun facts** — auto-generated weekly: "your odometer = Toronto to Vancouver round trip × 3" / "you've burned 1,200 L — that's a backyard pool"
13. **Achievement timeline** — chronological feed (was Phase G in v0.8 roadmap, still relevant)
14. **Special unlock animations per achievement** — Hall of Famer ≠ First Wrench. Custom backgrounds / longer dwell for legendary unlocks
15. **Trophy case PNG share** — was Phase H in v0.8 roadmap, still relevant
16. **Vehicle profile card** — shareable PNG with photo, key stats, top achievements
17. **Easter eggs not in the catalog** — Konami code, version-number tap → secret badges
18. **Achievement notifications for almost-there** — toast on cross of 50% / 90% progress on long-grind achievements (subtle, not nagging)

---

## Implementation order (next session)

Recommended start: **v0.9 in this order** (smallest → largest, momentum building):

1. **Health score sparkline** — smallest win, data already collected, ~1 hour
2. **Tutorial rework + Welcome Wrench** — concrete and contained, ~2 hours
3. **Milestone celebrations** — small, delightful, ~1.5 hours
4. **Achievement chains** — medium, requires UI design + chain definitions, ~3 hours

Total v0.9: ~7-8 hours. Ships as a cohesive "in-app depth" release.

Then v1.0 batches (each is its own version):
5. **Photo OCR** — Tesseract.js integration, lazy-loaded, fallback flow
6. **OEM schedule import** — curated JSON dataset for top 30 makes + reminder pre-population
7. **Year-in-Review** + **Vehicle anniversary** — bundle as "moments" release

Then v1.1 (utility tier):
8. **Recall alerts** — NHTSA recall endpoint integration
9. **Push notifications** — iOS PWA support, reminder/recall/streak triggers
10. **Siri Shortcuts** + **Apple Wallet pass** — native integrations

### Open decisions (revisit when starting each phase)

- OCR: Tesseract first or jump straight to cloud OCR?
- OEM schedules: build curated dataset ourselves or pay for an API?
- Push notifications: subdomain certificate situation for iOS PWA — needs investigation
- Year-in-Review: trigger January 1 specifically or first launch each calendar year?
