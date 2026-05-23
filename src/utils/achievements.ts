import { differenceInDays } from 'date-fns';
import type {
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  Reminder,
  VehicleDocument,
  MaintenanceCategory,
} from '../models';
import type { StreakInfo } from './streaks';

export type AchievementCategory = 'service' | 'fuel' | 'reminders' | 'docs' | 'milestone' | 'mastery';

export interface AchievementContext {
  vehicle: Vehicle;
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  reminders: Reminder[];
  documents: VehicleDocument[];
  /** Weekly activity streak (Monday-anchored ISO weeks). */
  streak: StreakInfo;
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
    icon: '🔥', category: 'milestone', tier: 2,
    predicate: ({ streak }) => streak.current >= 4 || streak.longest >= 4,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 4),
  },
  {
    id: 'diligent', title: 'Diligent',
    description: 'Log activity 12 weeks in a row.',
    icon: '⚡', category: 'milestone', tier: 3,
    predicate: ({ streak }) => streak.current >= 12 || streak.longest >= 12,
    progress: ({ streak }) => makeProgress(Math.max(streak.current, streak.longest), 12),
  },
  {
    id: 'year-round', title: 'Year-Round',
    description: 'Log activity 52 weeks in a row.',
    icon: '🌠', category: 'milestone', tier: 4,
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
 *  and the top tiers require deep engagement (most achievements + tier 4s). */
export const LEVELS: LevelTier[] = [
  { level: 1,  minXp: 0,    title: 'Rookie Driver' },
  { level: 2,  minXp: 50,   title: 'Garage Newbie' },
  { level: 3,  minXp: 125,  title: 'Wrench Apprentice' },
  { level: 4,  minXp: 225,  title: 'Weekend Tinkerer' },
  { level: 5,  minXp: 350,  title: 'Shop Regular' },
  { level: 6,  minXp: 500,  title: 'Seasoned Owner' },
  { level: 7,  minXp: 700,  title: 'Master Mechanic' },
  { level: 8,  minXp: 950,  title: 'Gearhead Legend' },
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
