# MotoTrack

A mobile-first Progressive Web App for tracking car maintenance and fuel economy. Built with React + TypeScript + Vite. Stores all data locally on your device — no backend, no account required.

## Features

- **Dashboard** — vehicle card, overdue reminders, recent services, fuel stats
- **Maintenance Log** — full CRUD with costs, parts, labour, and next-due scheduling
- **Fuel Log** — fill-up tracking with automatic L/100km and cost-per-km calculation
- **Reminders** — km-based, monthly, or fixed-date with overdue/due-soon/ok status
- **Reports** — monthly spend chart, fuel economy trend, category breakdown
- **Export / Import** — full JSON backup and restore
- **Dark mode** — system, light, or dark
- **PWA** — installable on iPhone via Safari "Add to Home Screen"
- **Offline-first** — works fully without a network connection

Comes pre-loaded with a demo 2002 Honda Civic SiR dataset (18 maintenance records + 20 fuel fill-ups).

---

## Quick Start

```bash
# 1. Install dependencies
cd mototrack
npm install

# 2. Generate PWA icons (required for install prompt on iOS)
npm run generate:icons

# 3. Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

> **Note:** PWA features (install prompt, service worker) only activate in the production build. Run `npm run build && npm run preview` to test the full PWA experience.

---

## PWA Icons

The icon generation step converts `public/icon.svg` into all required PNG sizes.

```bash
npm run generate:icons
```

This creates `public/pwa-64.png`, `public/pwa-192.png`, `public/pwa-512.png`, and `public/maskable-icon-512.png`.

If you skip this step, the app still runs in dev mode but won't have proper icons when installed.

---

## Install on iPhone (Safari)

1. Run `npm run build && npm run preview` (or deploy to a static host — see below)
2. Open the URL in **Safari** on your iPhone
3. Tap the **Share** button (box with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add**

The app will appear on your home screen and launch in full-screen standalone mode.

---

## Deploy to a Static Host

### Netlify (easiest)

```bash
npm run build
# Drag the `dist/` folder into https://app.netlify.com/drop
```

### Vercel

```bash
npm install -g vercel
npm run build
vercel --prod dist
```

### GitHub Pages

```bash
npm run build
# Push the `dist/` folder to the `gh-pages` branch
```

> The app uses `HashRouter` so it works on any static host without server-side routing config.

---

## Project Structure

```
src/
├── models/         # TypeScript interfaces (Vehicle, MaintenanceRecord, FuelRecord, Reminder)
├── db/
│   ├── database.ts # Dexie IndexedDB schema
│   └── seed.ts     # Demo data for 2002 Honda Civic SiR
├── utils/
│   ├── fuelCalc.ts         # L/100km, enrichment, monthly stats
│   ├── maintenanceCalc.ts  # Cost totals, category breakdown
│   ├── reminderLogic.ts    # Due/overdue/due-soon status
│   └── formatters.ts       # Currency, date, odometer formatters
├── hooks/
│   ├── useVehicle.ts       # Live vehicle query + update
│   ├── useMaintenance.ts   # Maintenance CRUD
│   ├── useFuel.ts          # Fuel CRUD + enrichment
│   └── useReminders.ts     # Reminders with computed status
├── context/
│   └── ThemeContext.tsx    # Dark/light/system theme
├── components/
│   ├── layout/             # AppShell, BottomNav
│   ├── ui/                 # Button, Card, Badge, Modal, FormField, ...
│   └── features/           # MaintenanceItem, FuelItem, ReminderCard
└── pages/
    ├── Dashboard.tsx
    ├── Maintenance/        # List + MaintenanceForm
    ├── Fuel/               # List + FuelForm
    ├── Reports.tsx
    └── Settings.tsx
```

---

## How Fuel Economy is Calculated

Economy (L/100km) is only calculated between two consecutive **full-tank** fill-ups. This is the tank-to-tank method — the most accurate approach for a daily driver.

- Partial fills are included in the litre total when the next full-tank fill is recorded
- The first fill-up in the database has no economy figure (no prior reference point)

---

## Reminder Logic

| Mode | Due Soon | Due Now | Overdue |
|------|----------|---------|---------|
| km | Within 10% of interval | Within 3% of interval | Past due km |
| months | Within 45 days | Within 14 days | Past due date |
| date | Within 45 days | Within 14 days | Past due date |

When fuel log history is available, km-based reminders show an estimated due date based on your recent driving pace.

---

## Adding Push Notifications (Future)

The service worker is registered via `vite-plugin-pwa`. To add push notifications:

1. Request `Notification` permission on install
2. Subscribe to Web Push via `registration.pushManager.subscribe()`
3. Send the subscription endpoint to a backend (e.g. a Netlify Function)
4. Trigger a push from the backend when a reminder becomes due

The reminder status logic (`src/utils/reminderLogic.ts`) is already separated from the UI and can be called server-side.

---

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 (HashRouter) |
| Storage | Dexie (IndexedDB wrapper) |
| Charts | Recharts |
| Date utils | date-fns |
| Icons | Lucide React |
| PWA | vite-plugin-pwa + Workbox |
