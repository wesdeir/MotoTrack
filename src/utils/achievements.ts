import { differenceInDays } from 'date-fns';
import type {
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  ReminderWithStatus,
  VehicleDocument,
  MaintenanceCategory,
  HealthScoreSnapshot,
} from '../models';
import type { StreakInfo } from './streaks';
import type { HealthScore } from './healthScore';

export type AchievementCategory =
  | 'service'
  | 'fuel'
  | 'reminders'
  | 'docs'
  | 'milestone'
  | 'mastery'
  | 'streak'
  | 'health'
  | 'secret';

export interface AchievementContext {
  vehicle: Vehicle;
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  /** Reminders enriched with computed status (ok/due-soon/due-now/overdue). */
  reminders: ReminderWithStatus[];
  documents: VehicleDocument[];
  /** Weekly activity streak (Monday-anchored ISO weeks). */
  streak: StreakInfo;
  /** Live vehicle health score (0–100 plus per-category breakdown). */
  healthScore: HealthScore;
  /** Snapshots from the last 60 days, used by score-history predicates. */
  healthSnapshots: HealthScoreSnapshot[];
}

export interface AchievementProgress {
  /** 0..1 fraction toward unlock. Always 1.0 once unlocked. */
  fraction: number;
  /** Human-readable progress string ("3 / 10"). */
  label: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  /** Emoji used as the badge icon. Keep it short — 1-2 chars. */
  icon: string;
  category: AchievementCategory;
  /** Higher tier = rarer/more prestigious. 1 = common, 2 = uncommon, 3 = rare, 4 = legendary. */
  tier: 1 | 2 | 3 | 4;
  /** Returns true when this achievement should be unlocked. */
  predicate: (ctx: AchievementContext) => boolean;
  /** Returns progress toward the achievement (0..1). Used for the badge wall. */
  progress?: (ctx: AchievementContext) => AchievementProgress;
  /** When true, the badge wall shows ??? until unlocked. Used for Easter eggs. */
  hidden?: boolean;
}

// --- helpers --------------------------------------------------------------

function countByCategory(records: MaintenanceRecord[], cat: MaintenanceCategory): number {
  return records.filter((r) => r.category === cat).length;
}

function distinctCategories(records: MaintenanceRecord[]): number {
  return new Set(records.map((r) => r.category)).size;
}

function totalMaintenanceSpend(records: MaintenanceRecord[]): number {
  return records.reduce((sum, r) => sum + r.totalCost, 0);
}

function daysSinceVehicle(vehicle: Vehicle): number {
  return Math.max(0, differenceInDays(new Date(), new Date(vehicle.createdAt)));
}

function normalizeShop(shop: string | undefined): string | null {
  if (!shop) return null;
  const cleaned = shop.trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

function distinctShops(records: MaintenanceRecord[]): number {
  const set = new Set<string>();
  for (const r of records) {
    const s = normalizeShop(r.shop);
    if (s) set.add(s);
  }
  return set.size;
}

function maxServicesAtSameShop(records: MaintenanceRecord[]): number {
  const counts = new Map<string, number>();
  for (const r of records) {
    const s = normalizeShop(r.shop);
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return max;
}

function hasGapThenComeback(records: MaintenanceRecord[], fuel: FuelRecord[], days: number): boolean {
  const allDates = [
    ...records.map((r) => new Date(r.date).getTime()),
    ...fuel.map((r) => new Date(r.date).getTime()),
  ].sort((a, b) => a - b);
  if (allDates.length < 2) return false;
  const gapMs = days * 24 * 60 * 60 * 1000;
  for (let i = 1; i < allDates.length; i++) {
    if (allDates[i] - allDates[i - 1] >= gapMs) return true;
  }
  return false;
}

function makeProgress(current: number, target: number): AchievementProgress {
  return {
    fraction: Math.min(1, current / target),
    label: `${Math.min(current, target)} / ${target}`,
  };
}

// --- time / date helpers --------------------------------------------------

function dayKey(d: Date | string): string {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthKey(d: Date | string): string {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function isWeekend(d: Date | string): boolean {
  const day = new Date(d).getDay();
  return day === 0 || day === 6;
}

function isWeekday(d: Date | string): boolean {
  return !isWeekend(d);
}

function maxRecordsInSameDay(records: { date: Date | string }[]): number {
  const counts = new Map<string, number>();
  for (const r of records) {
    const k = dayKey(r.date);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return max;
}

function maxRecordsInSameMonth(records: { date: Date | string }[]): number {
  const counts = new Map<string, number>();
  for (const r of records) {
    const k = monthKey(r.date);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return max;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function maxRecordsInSameWeek(records: { date: Date | string }[]): number {
  const counts = new Map<number, number>();
  for (const r of records) {
    const t = new Date(r.date).getTime();
    const weekIdx = Math.floor(t / WEEK_MS);
    counts.set(weekIdx, (counts.get(weekIdx) ?? 0) + 1);
  }
  let max = 0;
  for (const v of counts.values()) if (v > max) max = v;
  return max;
}

function distinctMonthsInBestYear(records: { date: Date | string }[]): number {
  const monthsByYear = new Map<number, Set<number>>();
  for (const r of records) {
    const d = new Date(r.date);
    const y = d.getFullYear();
    if (!monthsByYear.has(y)) monthsByYear.set(y, new Set());
    monthsByYear.get(y)!.add(d.getMonth());
  }
  let max = 0;
  for (const s of monthsByYear.values()) if (s.size > max) max = s.size;
  return max;
}

// --- spend / count helpers ------------------------------------------------

function hasYearOfTracking(vehicle: Vehicle): boolean {
  return daysSinceVehicle(vehicle) >= 365;
}

function hasFullYearUnder(records: MaintenanceRecord[], vehicle: Vehicle, cap: number): boolean {
  if (!hasYearOfTracking(vehicle)) return false;
  if (records.length === 0) return false;
  // For each year with any record, check if it's below cap AND that year is "complete"
  // (we have records both in early and later half OR at least 365 days span)
  const byYear = new Map<number, MaintenanceRecord[]>();
  for (const r of records) {
    const y = new Date(r.date).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(r);
  }
  const thisYear = new Date().getFullYear();
  for (const [year, rs] of byYear) {
    if (year === thisYear) continue; // skip incomplete current year
    const total = rs.reduce((s, r) => s + r.totalCost, 0);
    if (total <= cap) return true;
  }
  return false;
}

function minServiceCost(records: MaintenanceRecord[]): number | null {
  const costs = records.map((r) => r.totalCost).filter((c) => c > 0);
  if (costs.length === 0) return null;
  return Math.min(...costs);
}

// --- fuel helpers ---------------------------------------------------------

function avgEconomyOverN(fuel: FuelRecord[], n: number): number | null {
  const eco = fuel.filter((r) => r.lPer100km != null && r.lPer100km > 0) as Array<
    FuelRecord & { lPer100km: number }
  >;
  if (eco.length < n) return null;
  const subset = eco.slice(0, n);
  return subset.reduce((s, r) => s + r.lPer100km, 0) / subset.length;
}

function countFullTanks(fuel: FuelRecord[]): number {
  return fuel.filter((r) => r.fullTank).length;
}

function countPartialFills(fuel: FuelRecord[]): number {
  return fuel.filter((r) => !r.fullTank).length;
}

function countByGrade(fuel: FuelRecord[], grade: FuelRecord['fuelGrade']): number {
  return fuel.filter((r) => r.fuelGrade === grade).length;
}

// --- DIY helpers ----------------------------------------------------------

function countDiyServices(records: MaintenanceRecord[]): number {
  return records.filter((r) => normalizeShop(r.shop) == null).length;
}

function countShopServices(records: MaintenanceRecord[]): number {
  return records.filter((r) => normalizeShop(r.shop) != null).length;
}

// --- performance / mod helpers --------------------------------------------

const MOD_KEYWORDS: { id: string; words: string[] }[] = [
  { id: 'boost',      words: ['turbo', 'supercharger', 'boost', 'wastegate', 'bov', 'blow off', 'intercooler'] },
  { id: 'intake',     words: ['intake', 'cold air', 'cai', 'short ram'] },
  { id: 'exhaust',    words: ['exhaust', 'downpipe', 'cat-back', 'catback', 'header', 'muffler delete'] },
  { id: 'suspension', words: ['coilover', 'sway bar', 'lowering', 'strut', 'shock upgrade', 'bushing'] },
  { id: 'tuning',     words: ['tune', 'ecu flash', 'reflash', 'remap', 'piggyback'] },
  { id: 'wheels',     words: ['wheels', 'rims', 'forged', 'lightweight'] },
];

function recordText(r: MaintenanceRecord): string {
  const parts = (r.parts ?? []).map((p) => `${p.name} ${p.partNumber ?? ''}`).join(' ');
  return `${r.title} ${r.notes ?? ''} ${parts}`.toLowerCase();
}

function recordsMentionAny(records: MaintenanceRecord[], words: string[]): boolean {
  for (const r of records) {
    const text = recordText(r);
    for (const w of words) {
      if (text.includes(w.toLowerCase())) return true;
    }
  }
  return false;
}

function distinctModThemes(records: MaintenanceRecord[]): number {
  let hits = 0;
  for (const theme of MOD_KEYWORDS) {
    if (recordsMentionAny(records, theme.words)) hits++;
  }
  return hits;
}

// --- secret / Easter-egg helpers ------------------------------------------

function hasNightTimeLog(
  records: { date: Date | string }[],
  fuel: { date: Date | string }[],
): boolean {
  const all = [...records, ...fuel];
  for (const r of all) {
    const h = new Date(r.date).getHours();
    if (h >= 0 && h < 5) return true;
  }
  return false;
}

function hasExactCost(records: MaintenanceRecord[], fuel: FuelRecord[], amount: number): boolean {
  for (const r of records) if (r.totalCost === amount) return true;
  for (const r of fuel) if (r.totalCost === amount) return true;
  return false;
}

function hasJan1Activity(records: { date: Date | string }[], fuel: { date: Date | string }[]): boolean {
  const all = [...records, ...fuel];
  for (const r of all) {
    const d = new Date(r.date);
    if (d.getMonth() === 0 && d.getDate() === 1) return true;
  }
  return false;
}

// --- docs / reminders helpers ---------------------------------------------

function hasDocWithExpiry(documents: VehicleDocument[]): boolean {
  return documents.some((d) => d.expiresAt != null);
}

function countActiveReminders(reminders: ReminderWithStatus[]): number {
  return reminders.filter((r) => r.isActive).length;
}

// --- catalog --------------------------------------------------------------

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ------------------------- Service -------------------------
  {
    id: 'first-service', title: 'First Wrench', description: 'Log your first service record.',
    icon: '🔧', category: 'service', tier: 1,
    predicate: ({ maintenance }) => maintenance.length >= 1,
    progress: ({ maintenance }) => makeProgress(maintenance.length, 1),
  },
  {
    id: 'service-ten', title: 'Service Veteran', description: 'Log 10 service records.',
    icon: '🛠️', category: 'service', tier: 2,
    predicate: ({ maintenance }) => maintenance.length >= 10,
    progress: ({ maintenance }) => makeProgress(maintenance.length, 10),
  },
  {
    id: 'service-fifty', title: 'Service Master', description: 'Log 50 service records.',
    icon: '🏆', category: 'service', tier: 3,
    predicate: ({ maintenance }) => maintenance.length >= 50,
    progress: ({ maintenance }) => makeProgress(maintenance.length, 50),
  },
  {
    id: 'service-hundred', title: 'Lifer', description: 'Log 100 service records.',
    icon: '🌟', category: 'service', tier: 4,
    predicate: ({ maintenance }) => maintenance.length >= 100,
    progress: ({ maintenance }) => makeProgress(maintenance.length, 100),
  },

  // ------------------------- Fuel -------------------------
  {
    id: 'first-fuel', title: 'First Fill', description: 'Log your first fuel record.',
    icon: '⛽', category: 'fuel', tier: 1,
    predicate: ({ fuel }) => fuel.length >= 1,
    progress: ({ fuel }) => makeProgress(fuel.length, 1),
  },
  {
    id: 'fuel-ten', title: 'Fuel Tracker', description: 'Log 10 fuel records.',
    icon: '🚙', category: 'fuel', tier: 2,
    predicate: ({ fuel }) => fuel.length >= 10,
    progress: ({ fuel }) => makeProgress(fuel.length, 10),
  },
  {
    id: 'fuel-fifty', title: 'Pump Pro', description: 'Log 50 fuel records.',
    icon: '⛽', category: 'fuel', tier: 3,
    predicate: ({ fuel }) => fuel.length >= 50,
    progress: ({ fuel }) => makeProgress(fuel.length, 50),
  },
  {
    id: 'eco-driver', title: 'Eco Driver',
    description: 'Average under 7 L/100km across 5+ full-tank fills.',
    icon: '🌱', category: 'fuel', tier: 3,
    predicate: ({ fuel }) => {
      const eco = fuel.filter((r) => r.lPer100km != null) as Array<FuelRecord & { lPer100km: number }>;
      if (eco.length < 5) return false;
      const avg = eco.reduce((s, r) => s + r.lPer100km, 0) / eco.length;
      return avg > 0 && avg < 7;
    },
  },
  {
    id: 'long-hauler', title: 'Long Hauler',
    description: 'Cover 800+ km on a single full tank.',
    icon: '🛣️', category: 'fuel', tier: 3,
    predicate: ({ fuel }) =>
      fuel.some((r) => r.kmTravelled != null && r.kmTravelled >= 800 && r.fullTank),
  },
  {
    id: 'highway-star', title: 'Highway Star',
    description: 'Cover 1,000+ km on a single full tank.',
    icon: '🌌', category: 'fuel', tier: 4,
    predicate: ({ fuel }) =>
      fuel.some((r) => r.kmTravelled != null && r.kmTravelled >= 1000 && r.fullTank),
  },
  {
    id: 'fuel-snob', title: 'Premium Tastes',
    description: 'Log 10 premium-grade fuel records.',
    icon: '💎', category: 'fuel', tier: 2,
    predicate: ({ fuel }) => fuel.filter((r) => r.fuelGrade === 'premium').length >= 10,
    progress: ({ fuel }) =>
      makeProgress(fuel.filter((r) => r.fuelGrade === 'premium').length, 10),
  },

  // ------------------------- Reminders -------------------------
  {
    id: 'first-reminder', title: 'On the Calendar', description: 'Set up your first reminder.',
    icon: '🔔', category: 'reminders', tier: 1,
    predicate: ({ reminders }) => reminders.length >= 1,
  },
  {
    id: 'reminder-five', title: 'Stay Ahead', description: 'Have 5 active reminders at once.',
    icon: '📌', category: 'reminders', tier: 2,
    predicate: ({ reminders }) => reminders.filter((r) => r.isActive).length >= 5,
    progress: ({ reminders }) =>
      makeProgress(reminders.filter((r) => r.isActive).length, 5),
  },

  // ------------------------- Docs / GloveBox -------------------------
  {
    id: 'first-receipt', title: 'Paper Trail', description: 'Attach a receipt to a service record.',
    icon: '🧾', category: 'docs', tier: 1,
    predicate: ({ maintenance }) => maintenance.some((r) => !!r.receiptImage),
  },
  {
    id: 'receipt-collector', title: 'Receipt Collector',
    description: 'Attach receipts to 10 service records.',
    icon: '📂', category: 'docs', tier: 2,
    predicate: ({ maintenance }) =>
      maintenance.filter((r) => !!r.receiptImage).length >= 10,
    progress: ({ maintenance }) =>
      makeProgress(maintenance.filter((r) => !!r.receiptImage).length, 10),
  },
  {
    id: 'documented', title: 'Documented',
    description: 'Store insurance and registration in the GloveBox.',
    icon: '📁', category: 'docs', tier: 2,
    predicate: ({ documents }) =>
      documents.some((d) => d.type === 'insurance') &&
      documents.some((d) => d.type === 'registration'),
  },

  // ------------------------- Milestone (odometer / age) -------------------------
  {
    id: 'milestone-100k', title: '100k Club',
    description: 'Track a vehicle past 100,000.',
    icon: '🏁', category: 'milestone', tier: 2,
    predicate: ({ vehicle }) => vehicle.currentOdometer >= 100_000,
    progress: ({ vehicle }) => makeProgress(vehicle.currentOdometer, 100_000),
  },
  {
    id: 'milestone-200k', title: '200k Club',
    description: 'Track a vehicle past 200,000.',
    icon: '🏁', category: 'milestone', tier: 3,
    predicate: ({ vehicle }) => vehicle.currentOdometer >= 200_000,
    progress: ({ vehicle }) => makeProgress(vehicle.currentOdometer, 200_000),
  },
  {
    id: 'milestone-300k', title: '300k Legend',
    description: 'Track a vehicle past 300,000.',
    icon: '🥇', category: 'milestone', tier: 4,
    predicate: ({ vehicle }) => vehicle.currentOdometer >= 300_000,
    progress: ({ vehicle }) => makeProgress(vehicle.currentOdometer, 300_000),
  },
  {
    id: 'week-one', title: 'First Week',
    description: 'Track a vehicle for 7 days.',
    icon: '📅', category: 'milestone', tier: 1,
    predicate: (ctx) => daysSinceVehicle(ctx.vehicle) >= 7,
    progress: (ctx) => makeProgress(daysSinceVehicle(ctx.vehicle), 7),
  },
  {
    id: 'month-one', title: 'One Month In',
    description: 'Track a vehicle for 30 days.',
    icon: '🗓️', category: 'milestone', tier: 2,
    predicate: (ctx) => daysSinceVehicle(ctx.vehicle) >= 30,
    progress: (ctx) => makeProgress(daysSinceVehicle(ctx.vehicle), 30),
  },
  {
    id: 'year-one', title: 'Anniversary',
    description: 'Track a vehicle for a full year.',
    icon: '🎉', category: 'milestone', tier: 3,
    predicate: (ctx) => daysSinceVehicle(ctx.vehicle) >= 365,
    progress: (ctx) => makeProgress(daysSinceVehicle(ctx.vehicle), 365),
  },
  {
    id: 'hot-streak', title: 'Hot Streak',
    description: 'Log activity 4 weeks in a row.',
    icon: '🔥', category: 'streak', tier: 2,
    predicate: ({ streak }) => streak.current >= 4 || streak.longest >= 4,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 4),
  },
  {
    id: 'two-month-steady', title: 'Two-Month Steady',
    description: 'Log activity 8 weeks in a row.',
    icon: '🧗', category: 'streak', tier: 2,
    predicate: ({ streak }) => streak.current >= 8 || streak.longest >= 8,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 8),
  },
  {
    id: 'diligent', title: 'Diligent',
    description: 'Log activity 12 weeks in a row.',
    icon: '⚡', category: 'streak', tier: 3,
    predicate: ({ streak }) => streak.current >= 12 || streak.longest >= 12,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 12),
  },
  {
    id: 'half-year-hero', title: 'Half-Year Hero',
    description: 'Log activity 26 weeks in a row.',
    icon: '🛤️', category: 'streak', tier: 3,
    predicate: ({ streak }) => streak.current >= 26 || streak.longest >= 26,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 26),
  },
  {
    id: 'year-round', title: 'Year-Round',
    description: 'Log activity 52 weeks in a row.',
    icon: '🌠', category: 'streak', tier: 4,
    predicate: ({ streak }) => streak.current >= 52 || streak.longest >= 52,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 52),
  },
  {
    id: 'comeback-kid', title: 'Comeback Kid',
    description: 'Log activity after a 90+ day gap.',
    icon: '🔄', category: 'milestone', tier: 2,
    predicate: ({ maintenance, fuel }) => hasGapThenComeback(maintenance, fuel, 90),
  },

  // ------------------------- Mastery -------------------------
  {
    id: 'oil-pro', title: 'Oil Pro', description: 'Complete 5 oil changes.',
    icon: '🛢️', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => countByCategory(maintenance, 'oil-change') >= 5,
    progress: ({ maintenance }) => makeProgress(countByCategory(maintenance, 'oil-change'), 5),
  },
  {
    id: 'brake-boss', title: 'Brake Boss', description: 'Complete 3 brake services.',
    icon: '🛑', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => countByCategory(maintenance, 'brakes') >= 3,
    progress: ({ maintenance }) => makeProgress(countByCategory(maintenance, 'brakes'), 3),
  },
  {
    id: 'variety-pack', title: 'Variety Pack',
    description: 'Log services across 6 different categories.',
    icon: '🎯', category: 'mastery', tier: 3,
    predicate: ({ maintenance }) => distinctCategories(maintenance) >= 6,
    progress: ({ maintenance }) => makeProgress(distinctCategories(maintenance), 6),
  },
  {
    id: 'big-spender', title: 'Big Spender',
    description: 'Log $1,000 in tracked maintenance.',
    icon: '💸', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => totalMaintenanceSpend(maintenance) >= 1000,
    progress: ({ maintenance }) =>
      makeProgress(Math.floor(totalMaintenanceSpend(maintenance)), 1000),
  },
  {
    id: 'big-spender-pro', title: 'High Roller',
    description: 'Log $5,000 in tracked maintenance.',
    icon: '💰', category: 'mastery', tier: 3,
    predicate: ({ maintenance }) => totalMaintenanceSpend(maintenance) >= 5000,
    progress: ({ maintenance }) =>
      makeProgress(Math.floor(totalMaintenanceSpend(maintenance)), 5000),
  },
  {
    id: 'loyal-customer', title: 'Loyal Customer',
    description: '5 services at the same shop.',
    icon: '🏪', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => maxServicesAtSameShop(maintenance) >= 5,
    progress: ({ maintenance }) => makeProgress(maxServicesAtSameShop(maintenance), 5),
  },
  {
    id: 'shop-hopper', title: 'Shop Hopper',
    description: 'Services at 3 different shops.',
    icon: '🗺️', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => distinctShops(maintenance) >= 3,
    progress: ({ maintenance }) => makeProgress(distinctShops(maintenance), 3),
  },
  {
    id: 'annual-inspector', title: 'Annual Inspector',
    description: 'Log 2 inspection records.',
    icon: '🔍', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => countByCategory(maintenance, 'inspection') >= 2,
    progress: ({ maintenance }) =>
      makeProgress(countByCategory(maintenance, 'inspection'), 2),
  },

  // ------------------------- Service depth (v0.8) -------------------------
  {
    id: 'maintenance-marathon', title: 'Maintenance Marathon',
    description: 'Log 5 services in a single month.',
    icon: '🏃', category: 'service', tier: 3,
    predicate: ({ maintenance }) => maxRecordsInSameMonth(maintenance) >= 5,
    progress: ({ maintenance }) => makeProgress(maxRecordsInSameMonth(maintenance), 5),
  },
  {
    id: 'same-day-hero', title: 'Same-Day Hero',
    description: 'Log 3 services on the same day.',
    icon: '⏱️', category: 'service', tier: 2,
    predicate: ({ maintenance }) => maxRecordsInSameDay(maintenance) >= 3,
    progress: ({ maintenance }) => makeProgress(maxRecordsInSameDay(maintenance), 3),
  },
  {
    id: 'tire-whisperer', title: 'Tire Whisperer',
    description: 'Complete 4 tire services.',
    icon: '🛞', category: 'service', tier: 2,
    predicate: ({ maintenance }) => countByCategory(maintenance, 'tires') >= 4,
    progress: ({ maintenance }) => makeProgress(countByCategory(maintenance, 'tires'), 4),
  },
  {
    id: 'brake-master', title: 'Brake Master',
    description: 'Complete 10 brake services.',
    icon: '🦾', category: 'service', tier: 3,
    predicate: ({ maintenance }) => countByCategory(maintenance, 'brakes') >= 10,
    progress: ({ maintenance }) => makeProgress(countByCategory(maintenance, 'brakes'), 10),
  },

  // ------------------------- Fuel depth (v0.8) -------------------------
  {
    id: 'fuel-economist', title: 'Fuel Economist',
    description: 'Average under 6 L/100km across 10 fills.',
    icon: '📉', category: 'fuel', tier: 3,
    predicate: ({ fuel }) => {
      const avg = avgEconomyOverN(fuel, 10);
      return avg != null && avg < 6;
    },
  },
  {
    id: 'eco-crusader', title: 'Eco Crusader',
    description: 'Average under 5 L/100km across 10 fills.',
    icon: '🍃', category: 'fuel', tier: 4,
    predicate: ({ fuel }) => {
      const avg = avgEconomyOverN(fuel, 10);
      return avg != null && avg < 5;
    },
  },
  {
    id: 'tank-topper', title: 'Tank Topper',
    description: 'Log 25 full-tank fills.',
    icon: '🪣', category: 'fuel', tier: 2,
    predicate: ({ fuel }) => countFullTanks(fuel) >= 25,
    progress: ({ fuel }) => makeProgress(countFullTanks(fuel), 25),
  },
  {
    id: 'splash-and-go', title: 'Splash & Go',
    description: 'Log 10 partial fills.',
    icon: '💧', category: 'fuel', tier: 2,
    predicate: ({ fuel }) => countPartialFills(fuel) >= 10,
    progress: ({ fuel }) => makeProgress(countPartialFills(fuel), 10),
  },
  {
    id: 'premium-stick', title: 'Premium Stick',
    description: 'Log 25 premium-grade fills.',
    icon: '💠', category: 'fuel', tier: 3,
    predicate: ({ fuel }) => countByGrade(fuel, 'premium') >= 25,
    progress: ({ fuel }) => makeProgress(countByGrade(fuel, 'premium'), 25),
  },

  // ------------------------- Spend (v0.8) -------------------------
  {
    id: 'penny-pincher', title: 'Penny Pincher',
    description: 'Log a service under $20.',
    icon: '🪙', category: 'mastery', tier: 1,
    predicate: ({ maintenance }) => {
      const min = minServiceCost(maintenance);
      return min != null && min < 20;
    },
  },
  {
    id: 'frugal-year', title: 'Frugal Year',
    description: 'Keep a full year of maintenance under $500.',
    icon: '🌾', category: 'mastery', tier: 3,
    predicate: ({ maintenance, vehicle }) => hasFullYearUnder(maintenance, vehicle, 500),
  },
  {
    id: 'ten-k-club', title: 'Ten-K Club',
    description: 'Log $10,000 in tracked maintenance.',
    icon: '🏦', category: 'mastery', tier: 4,
    predicate: ({ maintenance }) => totalMaintenanceSpend(maintenance) >= 10000,
    progress: ({ maintenance }) =>
      makeProgress(Math.floor(totalMaintenanceSpend(maintenance)), 10000),
  },

  // ------------------------- Activity patterns (v0.8) -------------------------
  {
    id: 'weekend-warrior', title: 'Weekend Warrior',
    description: 'Log 10 activities on weekends.',
    icon: '🏖️', category: 'milestone', tier: 2,
    predicate: ({ maintenance, fuel }) =>
      [...maintenance, ...fuel].filter((r) => isWeekend(r.date)).length >= 10,
    progress: ({ maintenance, fuel }) =>
      makeProgress(
        [...maintenance, ...fuel].filter((r) => isWeekend(r.date)).length,
        10,
      ),
  },
  {
    id: 'workday-wrencher', title: 'Workday Wrencher',
    description: 'Log 20 activities on weekdays.',
    icon: '💼', category: 'milestone', tier: 2,
    predicate: ({ maintenance, fuel }) =>
      [...maintenance, ...fuel].filter((r) => isWeekday(r.date)).length >= 20,
    progress: ({ maintenance, fuel }) =>
      makeProgress(
        [...maintenance, ...fuel].filter((r) => isWeekday(r.date)).length,
        20,
      ),
  },
  {
    id: 'sprint', title: 'Sprint',
    description: 'Log 5 activities in a single week.',
    icon: '🏎️', category: 'milestone', tier: 2,
    predicate: ({ maintenance, fuel }) =>
      maxRecordsInSameWeek([...maintenance, ...fuel]) >= 5,
    progress: ({ maintenance, fuel }) =>
      makeProgress(maxRecordsInSameWeek([...maintenance, ...fuel]), 5),
  },
  {
    id: 'twelve-month-marathon', title: 'Twelve-Month Marathon',
    description: 'Log activity in 6 different months of one year.',
    icon: '📆', category: 'milestone', tier: 3,
    predicate: ({ maintenance, fuel }) =>
      distinctMonthsInBestYear([...maintenance, ...fuel]) >= 6,
    progress: ({ maintenance, fuel }) =>
      makeProgress(distinctMonthsInBestYear([...maintenance, ...fuel]), 6),
  },

  // ------------------------- Tenure (v0.8) -------------------------
  {
    id: 'two-year-club', title: 'Two-Year Club',
    description: 'Track a vehicle for 2 years.',
    icon: '🪴', category: 'milestone', tier: 3,
    predicate: (ctx) => daysSinceVehicle(ctx.vehicle) >= 730,
    progress: (ctx) => makeProgress(daysSinceVehicle(ctx.vehicle), 730),
  },
  {
    id: 'five-year-pro', title: 'Five-Year Pro',
    description: 'Track a vehicle for 5 years.',
    icon: '🌳', category: 'milestone', tier: 4,
    predicate: (ctx) => daysSinceVehicle(ctx.vehicle) >= 1825,
    progress: (ctx) => makeProgress(daysSinceVehicle(ctx.vehicle), 1825),
  },

  // ------------------------- Docs (v0.8) -------------------------
  {
    id: 'vault-keeper', title: 'Vault Keeper',
    description: 'Store 5+ documents in the GloveBox.',
    icon: '🗄️', category: 'docs', tier: 2,
    predicate: ({ documents }) => documents.length >= 5,
    progress: ({ documents }) => makeProgress(documents.length, 5),
  },
  {
    id: 'renewal-ready', title: 'Renewal Ready',
    description: 'Add a document with an expiry date.',
    icon: '⏰', category: 'docs', tier: 1,
    predicate: ({ documents }) => hasDocWithExpiry(documents),
  },

  // ------------------------- Reminders (v0.8) -------------------------
  {
    id: 'air-traffic-control', title: 'Air Traffic Control',
    description: 'Manage 10 active reminders at once.',
    icon: '🗼', category: 'reminders', tier: 3,
    predicate: ({ reminders }) => countActiveReminders(reminders) >= 10,
    progress: ({ reminders }) => makeProgress(countActiveReminders(reminders), 10),
  },

  // ------------------------- DIY theme (v0.8) -------------------------
  {
    id: 'solo-wrench', title: 'Solo Wrench',
    description: 'Log your first DIY service (no shop set).',
    icon: '🔩', category: 'mastery', tier: 1,
    predicate: ({ maintenance }) => countDiyServices(maintenance) >= 1,
  },
  {
    id: 'diy-mechanic', title: 'DIY Mechanic',
    description: 'Log 5 services with no shop set.',
    icon: '👨‍🔧', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) => countDiyServices(maintenance) >= 5,
    progress: ({ maintenance }) => makeProgress(countDiyServices(maintenance), 5),
  },
  {
    id: 'garage-master', title: 'Garage Master',
    description: 'Complete 15 DIY services.',
    icon: '🏠', category: 'mastery', tier: 3,
    predicate: ({ maintenance }) => countDiyServices(maintenance) >= 15,
    progress: ({ maintenance }) => makeProgress(countDiyServices(maintenance), 15),
  },
  {
    id: 'self-sufficient', title: 'Self-Sufficient',
    description: 'Do more DIY services than shop services (min 5 DIY).',
    icon: '🛠️', category: 'mastery', tier: 3,
    predicate: ({ maintenance }) => {
      const diy = countDiyServices(maintenance);
      return diy >= 5 && diy > countShopServices(maintenance);
    },
  },

  // ------------------------- Performance / mod theme (v0.8) -------------------------
  {
    id: 'boost-junkie', title: 'Boost Junkie',
    description: 'Log turbo, supercharger or intercooler work.',
    icon: '🌀', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) =>
      recordsMentionAny(maintenance, MOD_KEYWORDS[0].words),
  },
  {
    id: 'intake-pro', title: 'Intake Pro',
    description: 'Log a cold air intake or short ram install.',
    icon: '💨', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) =>
      recordsMentionAny(maintenance, MOD_KEYWORDS[1].words),
  },
  {
    id: 'suspension-tuner', title: 'Suspension Tuner',
    description: 'Log coilovers, sway bars, or lowering work.',
    icon: '🪜', category: 'mastery', tier: 2,
    predicate: ({ maintenance }) =>
      recordsMentionAny(maintenance, MOD_KEYWORDS[3].words),
  },
  {
    id: 'the-modder', title: 'The Modder',
    description: 'Touch 4 different performance/mod themes.',
    icon: '🛻', category: 'mastery', tier: 3,
    predicate: ({ maintenance }) => distinctModThemes(maintenance) >= 4,
    progress: ({ maintenance }) => makeProgress(distinctModThemes(maintenance), 4),
  },

  // ------------------------- Secret / Easter eggs (v0.8) -------------------------
  {
    id: 'lucky-sevens', title: 'Lucky Sevens',
    description: 'Cross 77,777 on the odometer.',
    icon: '🎰', category: 'secret', tier: 2, hidden: true,
    predicate: ({ vehicle }) => vehicle.currentOdometer >= 77_777,
  },
  {
    id: 'late-night-logger', title: 'Late-Night Logger',
    description: 'Log activity between midnight and 5am.',
    icon: '🦉', category: 'secret', tier: 2, hidden: true,
    predicate: ({ maintenance, fuel }) => hasNightTimeLog(maintenance, fuel),
  },
  {
    id: 'off-by-one', title: 'Off-By-One',
    description: 'Log a record costing exactly $1.00.',
    icon: '🎯', category: 'secret', tier: 1, hidden: true,
    predicate: ({ maintenance, fuel }) => hasExactCost(maintenance, fuel, 1),
  },
  {
    id: 'new-years-resolution', title: "New Year's Resolution",
    description: 'Log activity on January 1.',
    icon: '🎆', category: 'secret', tier: 2, hidden: true,
    predicate: ({ maintenance, fuel }) => hasJan1Activity(maintenance, fuel),
  },

  // ------------------------- Reminders (Phase F) -------------------------
  {
    id: 'zero-inbox', title: 'Zero Inbox',
    description: '3+ active reminders, all caught up.',
    icon: '✅', category: 'reminders', tier: 2,
    predicate: ({ reminders }) => {
      const active = reminders.filter((r) => r.isActive);
      return active.length >= 3 && active.every((r) => r.status === 'ok');
    },
  },

  // ------------------------- Health (Phase F) -------------------------
  {
    id: 'healthy', title: 'Healthy',
    description: 'Reach a vehicle health score of 80 or higher.',
    icon: '💚', category: 'health', tier: 2,
    predicate: ({ healthScore }) => healthScore.total >= 80,
    progress: ({ healthScore }) => makeProgress(healthScore.total, 80),
  },
  {
    id: 'perfect-score', title: 'Perfect Score',
    description: 'Reach a vehicle health score of 100.',
    icon: '🏅', category: 'health', tier: 4,
    predicate: ({ healthScore }) => healthScore.total >= 100,
    progress: ({ healthScore }) => makeProgress(healthScore.total, 100),
  },
  {
    id: 'phoenix', title: 'Phoenix',
    description: 'Climb from below 40 to 80+ within 30 days.',
    icon: '🔥', category: 'health', tier: 3,
    predicate: ({ healthScore, healthSnapshots }) => {
      if (healthScore.total < 80) return false;
      const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (const s of healthSnapshots) {
        const sMs = new Date(s.date).getTime();
        if (sMs >= cutoffMs && s.score < 40) return true;
      }
      return false;
    },
  },
];

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns the ids of every achievement currently satisfied by the context. */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.predicate(ctx)).map((a) => a.id);
}

// --- XP / Levels ----------------------------------------------------------

/** XP awarded for unlocking an achievement of a given tier. */
export const XP_BY_TIER: Record<1 | 2 | 3 | 4, number> = {
  1: 10,
  2: 25,
  3: 50,
  4: 100,
};

/** Sum of XP for the unlocked achievement ids. Unknown ids are ignored. */
export function calculateXp(unlockedIds: Iterable<string>): number {
  let total = 0;
  for (const id of unlockedIds) {
    const def = getAchievement(id);
    if (def) total += XP_BY_TIER[def.tier];
  }
  return total;
}

/** Total XP available if every achievement is unlocked. */
export function maxXp(): number {
  return ACHIEVEMENTS.reduce((sum, a) => sum + XP_BY_TIER[a.tier], 0);
}

export interface LevelTier {
  /** 1-indexed. */
  level: number;
  /** Cumulative XP required to enter this level. */
  minXp: number;
  /** Driver-themed title for this level. */
  title: string;
}

/** Level breakpoints. Tuned so the first few unlocks feel rewarding,
 *  and the top tiers require deep engagement (most achievements + tier 4s).
 *  Existing L1-L8 thresholds preserved from v0.7 — L9 and L10 added for the
 *  expanded v0.8 catalog (max XP ~2650). */
export const LEVELS: LevelTier[] = [
  { level: 1,  minXp: 0,    title: 'Rookie Driver' },
  { level: 2,  minXp: 50,   title: 'Garage Newbie' },
  { level: 3,  minXp: 125,  title: 'Wrench Apprentice' },
  { level: 4,  minXp: 225,  title: 'Weekend Tinkerer' },
  { level: 5,  minXp: 350,  title: 'Shop Regular' },
  { level: 6,  minXp: 500,  title: 'Seasoned Owner' },
  { level: 7,  minXp: 700,  title: 'Master Mechanic' },
  { level: 8,  minXp: 950,  title: 'Gearhead Legend' },
  { level: 9,  minXp: 1300, title: 'Hall of Famer' },
  { level: 10, minXp: 1900, title: 'Garage Royalty' },
];

export interface LevelInfo {
  /** 1-indexed current level. */
  level: number;
  title: string;
  /** XP earned within the current level (0..xpForNextLevel). */
  xpIntoLevel: number;
  /** XP needed to reach the next level. `null` when at max level. */
  xpForNextLevel: number | null;
  /** 0..1 progress toward the next level (1 at max). */
  progressFraction: number;
  /** Title of the next level, or `null` at max. */
  nextTitle: string | null;
}

/** Resolves the current level + progress toward the next from a total XP value. */
export function calculateLevel(totalXp: number): LevelInfo {
  let currentIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].minXp) currentIdx = i;
    else break;
  }
  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1];

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      xpIntoLevel: totalXp - current.minXp,
      xpForNextLevel: null,
      progressFraction: 1,
      nextTitle: null,
    };
  }

  const xpIntoLevel = totalXp - current.minXp;
  const xpForNextLevel = next.minXp - current.minXp;
  return {
    level: current.level,
    title: current.title,
    xpIntoLevel,
    xpForNextLevel,
    progressFraction: Math.max(0, Math.min(1, xpIntoLevel / xpForNextLevel)),
    nextTitle: next.title,
  };
}
