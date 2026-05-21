# MotoTrack

> *A case study in building a production-quality PWA entirely through AI collaboration — and everything that went wrong along the way.*

---

## What is this, really?

On the surface, MotoTrack is a mobile-first Progressive Web App for tracking vehicle maintenance and fuel economy. It installs to your iPhone home screen, works fully offline, stores everything locally, and looks and feels like a native iOS app.

But more than the app itself, this repo is **an experiment**. It was built entirely through conversation with Claude — no manual coding, no IDE, just prompts. The goal was to understand what it actually feels like to build something real with an AI pair programmer, and to surface both the capabilities and the failure modes before taking that strategy into a high-stakes setting.

That setting is **[FUSE](https://fuse.org.au/)** — our upcoming hackathon. MotoTrack is our rehearsal.

---

## The strategy

The hypothesis going into this project was simple: if you give Claude a clear problem, a strong design sensibility, and good iterative feedback, it should be able to build production-quality UI faster than a human developer working alone. Modern AI models understand React, TypeScript, Tailwind, PWA APIs, IndexedDB — they have the vocabulary. The question was whether they could *apply* it coherently over a full project lifecycle.

The answer, as this codebase demonstrates, is: **yes, mostly — but the seams show in interesting ways.**

---

## What Claude did well

A lot, honestly. The entire codebase — roughly 4,000 lines across 40+ files — was written through conversation. Some highlights:

**Rapid feature scaffolding.** The core data model, Dexie schema, CRUD hooks, and routing were all stood up in a single session. What might take a human developer a day of boilerplate was done in an hour of back-and-forth.

**CSS architecture decisions.** The theming system — where `html.dark.theme-*` specificity correctly overrides `html.theme-*` which overrides `:root`, allowing per-theme accent colours in both light and dark mode — was designed and implemented in one go. Getting CSS variable + Tailwind opacity modifier interop right (`rgb(var(--tw-accent-rgb) / <alpha-value>)`) was non-trivial and Claude nailed it.

**Understanding platform quirks.** iOS Safari has a notoriously broken viewport height model. Claude correctly identified that `height: 100%` in a flex child inside `overflow-y: auto` is unreliable on iOS, and proposed `fixed inset-0` as the correct fix — a specific, non-obvious solution that a lot of developers would have cargo-culted around for hours.

**Multi-file refactors.** When we decided to extract `CATEGORY_EMOJI` into a shared utility, Claude found all three usage sites across different components, updated the imports, and deleted the duplicates — correctly, in one pass.

---

## Where it got hard

This is the more interesting part.

**Context windows are a real constraint.** Every Claude conversation has a finite context window. When it fills up, the session compresses — and the next message starts with a summary of what happened before, not the actual conversation. That summary is good, but it's lossy. Over the course of this project, we hit the limit multiple times. Each time, some nuance was lost: which specific class was causing which visual bug, what we'd already tried and ruled out, what the current state of a file *actually* was versus what the summary said it was.

The practical effect is that some bugs took three or four sessions to fully resolve, when a single developer with full context would have fixed them in one sitting. You learn quickly that **AI memory is not like human memory**. It doesn't accumulate lived experience across sessions. Every conversation is, to some degree, a cold start.

**Fixing one thing broke another.** The nav bar is the canonical example. Early builds had the nav floating up the screen on empty pages — instead of sitting at the bottom, it would snap to wherever the content ended. The fix was `fixed inset-0` on the app shell, pinning the layout to the exact viewport. That worked perfectly... until we noticed the nav was no longer flush against the physical bottom of the iPhone screen. A visible colour seam between the nav glass background and the home indicator zone. The original fix introduced a new bug that required its own dedicated session to diagnose and resolve.

This isn't a failure of AI specifically — it happens in human development too. But with AI collaboration, the loop is: describe the bug → get a fix → verify on device → describe the new bug → repeat. Each loop iteration costs a full back-and-forth. The velocity is high on the first pass; recovery from regressions is where you feel the overhead.

**Explaining visual intent is hard.** The glassmorphism aesthetic took multiple rounds across multiple sessions before it looked right. The first implementation was too opaque — cards at 80% white, blobs at 12% opacity — which read as flat UI with a slight blur effect, not the vivid, translucent panels we were after. Sharing reference images helped, but "translate this screenshot into CSS values" is an imprecise instruction. We went through: "more translucent" → "the blobs need to be stronger" → "try 30-32% blob opacity and 40% card opacity with `backdrop-blur-2xl`" before landing on something that actually looked like the inspiration.

The lesson: **AI is great at precision when the spec is precise. Visual aesthetics require a richer feedback loop than text alone.**

---

## What this means for FUSE

The FUSE hackathon is time-constrained. You don't have days to iterate — you have hours. The workflow we've refined on MotoTrack maps well to that:

1. **Spec clearly upfront.** The more precisely you define the data model, routing structure, and component hierarchy before the first prompt, the fewer mid-session course corrections you need.
2. **One concern per session.** Don't try to fix a bug and add a feature in the same conversation. Context stays clean, regressions are easier to spot.
3. **Treat AI output as a first draft, not a final commit.** Read what gets written. Catch the subtle wrong before it compounds.
4. **Keep a living plan file.** We used Claude's plan mode to write a detailed spec for the Timeline feature before implementation. Having that spec in the conversation context kept the implementation accurate even as session length grew.

The capability is real. The overhead is real. Knowing both is what turns this from a party trick into a legitimate strategy.

---

## The app itself

All that said — it's a good app. Here's what it does:

- **Dashboard** — vehicle card, overdue reminders, recent services, fuel stats
- **Maintenance Log** — full CRUD with costs, parts, labour, and next-due scheduling
- **Timeline** — merged maintenance + fuel history in a single chronological view
- **Fuel Log** — fill-up tracking with automatic L/100km and cost-per-km calculation
- **Reminders** — km-based, monthly, or fixed-date with overdue/due-soon/ok status
- **Reports** — monthly spend chart, fuel economy trend, category breakdown
- **Export / Import** — full JSON backup and restore
- **Swipe navigation** — left/right swipe to move between tabs (with guards for modals, form inputs, and horizontal scrollers)
- **Glassmorphism UI** — translucent panels over vivid gradient blobs; 5 colour themes; proper dark mode
- **PWA** — installable on iPhone via Safari, full-screen standalone mode
- **Offline-first** — all data in IndexedDB, no backend, no account required

Demo data: 18 maintenance records + 20 fuel fill-ups for a 2002 Honda Civic SiR. Load it from Settings to see the app with realistic history.

---

## Quick start

```bash
npm install
npm run generate:icons   # creates PWA icon PNGs from public/icon.svg
npm run dev
```

Open `http://localhost:5173`. For full PWA features (service worker, install prompt):

```bash
npm run build && npm run preview
```

---

## Install on iPhone

1. Build or deploy to a static host
2. Open in **Safari** on your iPhone
3. Share → **Add to Home Screen**

The app launches in full-screen standalone mode with no browser chrome.

---

## Deploy

The app uses `HashRouter` and requires no server-side routing config — any static host works.

**Netlify:** drag `dist/` into [app.netlify.com/drop](https://app.netlify.com/drop)

**Vercel:** `vercel --prod dist`

**GitHub Pages:** push `dist/` to `gh-pages` branch

---

## Tech stack

| Layer | Library |
|-------|---------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 (HashRouter) |
| Storage | Dexie 3 (IndexedDB) |
| Charts | Recharts |
| Date utils | date-fns |
| Icons | Lucide React |
| PWA | vite-plugin-pwa + Workbox |

---

## Fuel economy calculation

L/100km is calculated using the tank-to-tank method between consecutive **full-tank** fills. Partial fills accumulate into the next full-tank reference point. The first fill-up in the database always shows `—` (no prior reference point exists).

---

## Reminder logic

| Mode | Due soon | Due now | Overdue |
|------|----------|---------|---------|
| km | Within 10% of interval | Within 3% | Past due km |
| months | Within 45 days | Within 14 days | Past due date |
| date | Within 45 days | Within 14 days | Past due date |

When fuel history is available, km-based reminders show an estimated due date based on recent driving pace.

---

## Project structure

```
src/
├── models/             # TypeScript interfaces
├── db/
│   ├── database.ts     # Dexie schema
│   └── seed.ts         # Demo data (2002 Honda Civic SiR)
├── utils/
│   ├── fuelCalc.ts
│   ├── maintenanceCalc.ts
│   ├── reminderLogic.ts
│   ├── formatters.ts
│   └── categoryEmoji.ts
├── hooks/              # useFuel, useMaintenance, useReminders, useVehicle, useSwipeNavigation
├── context/            # ThemeContext (dark/light/system + 5 colour themes)
├── components/
│   ├── layout/         # AppShell, BottomNav
│   ├── ui/             # Button, Card, Modal, FormField, Badge, EmptyState, ...
│   └── features/       # MaintenanceItem, FuelItem, ReminderCard
└── pages/
    ├── Dashboard.tsx
    ├── Maintenance/    # Log, Timeline, Reminders tabs + MaintenanceForm
    ├── Fuel/           # List + FuelForm
    ├── Reports.tsx
    └── Settings.tsx
```
