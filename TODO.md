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
- VIN-based recall lookup (NHTSA already in use for decoding — they expose a recall endpoint too)
- Maintenance schedule import from owner's manual PDF (use existing PDF tooling + LLM extraction)
- Cloud backup / cross-device sync (encrypted, optional — would need a backend, currently zero-backend)
