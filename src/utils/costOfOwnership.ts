import type { MaintenanceRecord, FuelRecord } from '../models';

export function calculateCostPerKm(
  maintenanceRecords: MaintenanceRecord[],
  fuelRecords: FuelRecord[],
  currentOdometer: number,
): number | null {
  if (fuelRecords.length < 2) return null;

  const sorted = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
  const kmDriven = currentOdometer - sorted[0].odometer;

  if (kmDriven <= 0) return null;

  const totalMainSpend = maintenanceRecords.reduce((s, r) => s + r.totalCost, 0);
  const totalFuelSpend = fuelRecords.reduce((s, r) => s + r.totalCost, 0);

  return (totalMainSpend + totalFuelSpend) / kmDriven;
}
