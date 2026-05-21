import type { MaintenanceRecord, MaintenanceCategory } from '../models';
import { CATEGORY_LABELS } from '../models';

export function calculateTotalMaintenanceSpend(records: MaintenanceRecord[]): number {
  return records.reduce((sum, r) => sum + r.totalCost, 0);
}

export function calculateSpendByCategory(
  records: MaintenanceRecord[],
): { category: MaintenanceCategory; label: string; total: number }[] {
  const byCategory: Partial<Record<MaintenanceCategory, number>> = {};
  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.totalCost;
  }
  return (Object.entries(byCategory) as [MaintenanceCategory, number][])
    .map(([category, total]) => ({ category, label: CATEGORY_LABELS[category], total }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyMaintenanceSpend(
  records: MaintenanceRecord[],
): { month: string; spend: number }[] {
  const byMonth: Record<string, number> = {};
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] ?? 0) + r.totalCost;
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({ month, spend }));
}

export function getLastShopByCategory(
  records: MaintenanceRecord[],
  category: MaintenanceCategory,
): string | undefined {
  return [...records]
    .filter((r) => r.category === category && r.shop)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.shop;
}

export function getLastServiceByCategory(
  records: MaintenanceRecord[],
  category: MaintenanceCategory,
): MaintenanceRecord | null {
  const filtered = records.filter((r) => r.category === category);
  if (filtered.length === 0) return null;
  return filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
}

export function getMostExpensiveRepair(records: MaintenanceRecord[]): MaintenanceRecord | null {
  if (records.length === 0) return null;
  return records.reduce((max, r) => (r.totalCost > max.totalCost ? r : max));
}

export function getRecentRecords(
  records: MaintenanceRecord[],
  count = 5,
): MaintenanceRecord[] {
  return [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

export function autoCalcTotal(
  laborCost: number,
  partsCost: number,
  tax: number,
): number {
  return laborCost + partsCost + tax;
}
