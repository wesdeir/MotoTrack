import type {
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  UnlockedAchievement,
  MaintenanceCategory,
} from '../models';
import { CATEGORY_LABELS } from '../models';
import { getAchievement } from './achievements';

export interface YearStats {
  year: number;
  vehicleNickname: string;
  /** Approximate distance driven during the year (last odo - first odo). */
  kmDriven: number;
  serviceCount: number;
  maintenanceSpend: number;
  /** Most-frequent service category (with its label) during the year. */
  topCategory?: { category: MaintenanceCategory; label: string; count: number };
  fuelCount: number;
  fuelLitres: number;
  fuelSpend: number;
  avgLPer100km: number | null;
  bestFillEconomy: number | null;
  fullTankCount: number;
  newAchievementCount: number;
  topAchievementTitle?: string;
  topAchievementIcon?: string;
  totalLogs: number;
}

function withinYear<T extends { date: Date | string }>(rows: T[], year: number): T[] {
  return rows.filter((r) => new Date(r.date).getFullYear() === year);
}

export function calculateYearStats(
  year: number,
  vehicle: Vehicle,
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
  unlocked: UnlockedAchievement[],
): YearStats {
  const yearMaintenance = withinYear(maintenance, year);
  const yearFuel = withinYear(fuel, year);
  const yearUnlocked = unlocked.filter(
    (u) => new Date(u.unlockedAt).getFullYear() === year,
  );

  // kmDriven = max odo - min odo across all year records
  const odos = [
    ...yearMaintenance.map((r) => r.odometer),
    ...yearFuel.map((r) => r.odometer),
  ].filter((o) => o > 0);
  const kmDriven = odos.length >= 2 ? Math.max(...odos) - Math.min(...odos) : 0;

  // Top category
  const categoryCounts = new Map<MaintenanceCategory, number>();
  for (const r of yearMaintenance) {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  }
  let topCategory: YearStats['topCategory'];
  for (const [cat, count] of categoryCounts) {
    if (!topCategory || count > topCategory.count) {
      topCategory = { category: cat, label: CATEGORY_LABELS[cat], count };
    }
  }

  // Fuel
  const fuelLitres = yearFuel.reduce((s, r) => s + r.litres, 0);
  const fuelSpend = yearFuel.reduce((s, r) => s + r.totalCost, 0);
  const ecoRows = yearFuel.filter(
    (r): r is FuelRecord & { lPer100km: number } => r.lPer100km != null && r.lPer100km > 0,
  );
  const avgLPer100km = ecoRows.length > 0
    ? ecoRows.reduce((s, r) => s + r.lPer100km, 0) / ecoRows.length
    : null;
  const bestFillEconomy = ecoRows.length > 0
    ? Math.min(...ecoRows.map((r) => r.lPer100km))
    : null;
  const fullTankCount = yearFuel.filter((r) => r.fullTank).length;

  // Top achievement = highest tier unlocked this year
  let topAchievement: { title: string; icon: string; tier: number } | undefined;
  for (const u of yearUnlocked) {
    const def = getAchievement(u.achievementId);
    if (!def) continue;
    if (!topAchievement || def.tier > topAchievement.tier) {
      topAchievement = { title: def.title, icon: def.icon, tier: def.tier };
    }
  }

  return {
    year,
    vehicleNickname: vehicle.nickname,
    kmDriven,
    serviceCount: yearMaintenance.length,
    maintenanceSpend: yearMaintenance.reduce((s, r) => s + r.totalCost, 0),
    topCategory,
    fuelCount: yearFuel.length,
    fuelLitres,
    fuelSpend,
    avgLPer100km,
    bestFillEconomy,
    fullTankCount,
    newAchievementCount: yearUnlocked.length,
    topAchievementTitle: topAchievement?.title,
    topAchievementIcon: topAchievement?.icon,
    totalLogs: yearMaintenance.length + yearFuel.length,
  };
}

/** Total logs this year — exposed so the manager can decide whether to show YiR. */
export function hasMeaningfulYearData(
  year: number,
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
): boolean {
  return withinYear(maintenance, year).length + withinYear(fuel, year).length >= 3;
}
