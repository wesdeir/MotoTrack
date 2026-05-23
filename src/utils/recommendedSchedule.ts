import type { MaintenanceCategory, ReminderMode, Vehicle } from '../models';

interface ScheduledService {
  category: MaintenanceCategory;
  title: string;
  /** Recommended distance interval. If omitted, the reminder is time-based only. */
  intervalKm?: number;
  /** Recommended time interval in months. */
  intervalMonths?: number;
  notes?: string;
  /** When true, pre-selected in the UI. Optional services default to false. */
  defaultSelected?: boolean;
}

/** Returned shape ready to drop straight into the Reminder form / db. */
export interface RecommendedReminder {
  serviceType: MaintenanceCategory;
  title: string;
  mode: ReminderMode;
  intervalKm?: number;
  intervalMonths?: number;
  notes?: string;
  defaultSelected: boolean;
}

/**
 * Generic baseline schedule — good defaults for most modern gasoline vehicles
 * with a conventional service plan. Make-specific overrides below tighten or
 * loosen individual entries.
 */
const GENERIC_SCHEDULE: ScheduledService[] = [
  { category: 'oil-change',           title: 'Oil Change',                 intervalKm: 8_000,  intervalMonths: 6,  defaultSelected: true,  notes: 'Conventional oil. Bump to 12-16k for full synthetic.' },
  { category: 'tires',                title: 'Tire Rotation',              intervalKm: 10_000, defaultSelected: true },
  { category: 'brakes',               title: 'Brake Inspection',           intervalKm: 24_000, intervalMonths: 12, defaultSelected: true },
  { category: 'filter',               title: 'Engine Air Filter',          intervalKm: 24_000, intervalMonths: 24, defaultSelected: true },
  { category: 'filter',               title: 'Cabin Air Filter',           intervalKm: 24_000, intervalMonths: 12, defaultSelected: true },
  { category: 'brake-fluid',          title: 'Brake Fluid Flush',          intervalKm: 48_000, intervalMonths: 24, defaultSelected: true },
  { category: 'coolant',              title: 'Coolant Flush',              intervalKm: 80_000, intervalMonths: 60, defaultSelected: true },
  { category: 'transmission-fluid',   title: 'Transmission Fluid (Auto)',  intervalKm: 96_000, intervalMonths: 48, defaultSelected: false, notes: 'Skip if your car has manual transmission.' },
  { category: 'spark-plugs',          title: 'Spark Plugs',                intervalKm: 96_000, defaultSelected: true,  notes: 'Iridium plugs can go 160k+. Check your owner\'s manual.' },
  { category: 'power-steering-fluid', title: 'Power Steering Fluid',       intervalKm: 80_000, intervalMonths: 60, defaultSelected: false, notes: 'Skip if EPS (electric power steering).' },
  { category: 'inspection',           title: 'Annual Safety Inspection',   intervalMonths: 12, defaultSelected: true },
];

/**
 * Per-make overrides keyed by `${category}` or `${category}:${title}` for
 * finer targeting. Values are partial — merged on top of the generic entry.
 * Add more makes as we get real-world data.
 */
const MAKE_OVERRIDES: Record<string, Record<string, Partial<ScheduledService>>> = {
  toyota: {
    'oil-change': { intervalKm: 16_000, intervalMonths: 12, notes: 'Toyota 0W-20 synthetic — 16k km interval.' },
  },
  lexus: {
    'oil-change': { intervalKm: 16_000, intervalMonths: 12, notes: 'Lexus uses Toyota 0W-20 synthetic schedule.' },
  },
  honda: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12, notes: 'Honda 0W-20 synthetic.' },
  },
  acura: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12, notes: 'Acura synthetic — follow Maintenance Minder.' },
  },
  mazda: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 6, notes: 'Mazda 0W-20 synthetic.' },
  },
  subaru: {
    'oil-change': { intervalKm: 10_000, intervalMonths: 6, notes: 'Synthetic — 10k interval; turbo models 8k.' },
  },
  ford: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12 },
  },
  chevrolet: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12, notes: 'Follow the GM Oil Life Monitor.' },
  },
  gmc: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12, notes: 'Follow the GM Oil Life Monitor.' },
  },
  bmw: {
    'oil-change':  { intervalKm: 16_000, intervalMonths: 12, notes: 'BMW LL-01 synthetic. Follow CBS.' },
    'brake-fluid': { intervalKm: 0, intervalMonths: 24, notes: 'BMW recommends every 2 years regardless of distance.' },
  },
  'mercedes-benz': {
    'oil-change':  { intervalKm: 16_000, intervalMonths: 12, notes: 'Mercedes 229.5 synthetic. Follow ASSYST.' },
    'brake-fluid': { intervalKm: 0, intervalMonths: 24 },
  },
  audi: {
    'oil-change': { intervalKm: 16_000, intervalMonths: 12, notes: 'Audi LongLife III synthetic.' },
  },
  volkswagen: {
    'oil-change': { intervalKm: 16_000, intervalMonths: 12, notes: 'VW 504.00 synthetic.' },
  },
  porsche: {
    'oil-change': { intervalKm: 16_000, intervalMonths: 12 },
  },
  hyundai: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12 },
  },
  kia: {
    'oil-change': { intervalKm: 12_000, intervalMonths: 12 },
  },
  nissan: {
    'oil-change': { intervalKm: 8_000, intervalMonths: 6, notes: 'Severe-duty schedule — bump to 12k under normal driving.' },
  },
  infiniti: {
    'oil-change': { intervalKm: 8_000, intervalMonths: 6 },
  },
  // EV-aware overrides: trim out things EVs don't have.
  tesla: {
    'oil-change':           { intervalKm: 0, intervalMonths: 0, defaultSelected: false, notes: 'N/A — electric drivetrain.' },
    'transmission-fluid':   { intervalKm: 0, intervalMonths: 0, defaultSelected: false, notes: 'N/A — single-speed drive unit.' },
    'spark-plugs':          { intervalKm: 0, intervalMonths: 0, defaultSelected: false, notes: 'N/A — no spark plugs.' },
    'power-steering-fluid': { intervalKm: 0, intervalMonths: 0, defaultSelected: false, notes: 'N/A — electric power steering.' },
  },
};

const EV_MAKES = new Set(['tesla', 'rivian', 'lucid', 'polestar']);

function isLikelyEv(vehicle: Vehicle): boolean {
  const make = vehicle.make.toLowerCase();
  if (EV_MAKES.has(make)) return true;
  const engine = vehicle.engine?.toLowerCase() ?? '';
  return /electric|ev\b|battery/.test(engine);
}

/**
 * Build the list of recommended reminders for a given vehicle. Returns one
 * entry per generic service, with make-specific tweaks merged in. Entries
 * where the override zeroes both intervals are excluded entirely.
 */
export function getRecommendedReminders(vehicle: Vehicle): RecommendedReminder[] {
  const makeKey = vehicle.make.toLowerCase().trim();
  const overrides = MAKE_OVERRIDES[makeKey] ?? {};
  const ev = isLikelyEv(vehicle);

  const result: RecommendedReminder[] = [];

  for (const base of GENERIC_SCHEDULE) {
    const override =
      overrides[`${base.category}:${base.title}`] ?? overrides[base.category] ?? {};
    const merged: ScheduledService = { ...base, ...override };

    // Both intervals zeroed → drop (EV exclusions)
    const km = merged.intervalKm ?? 0;
    const months = merged.intervalMonths ?? 0;
    if (km === 0 && months === 0) continue;

    // Heuristic EV pruning when no explicit override exists.
    if (ev && !overrides[base.category]) {
      if (['transmission-fluid', 'spark-plugs', 'oil-change', 'power-steering-fluid'].includes(base.category)) {
        continue;
      }
    }

    const mode: ReminderMode = km > 0 ? 'km' : 'months';

    result.push({
      serviceType: merged.category,
      title: merged.title,
      mode,
      intervalKm: km > 0 ? km : undefined,
      intervalMonths: months > 0 ? months : undefined,
      notes: merged.notes,
      defaultSelected: merged.defaultSelected ?? true,
    });
  }

  return result;
}
