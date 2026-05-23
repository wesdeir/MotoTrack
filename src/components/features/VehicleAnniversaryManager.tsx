import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { useVehicle } from '../../hooks/useVehicle';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useFuel } from '../../hooks/useFuel';
import VehicleAnniversaryCelebration from './VehicleAnniversaryCelebration';

/**
 * Watches the active vehicle's creation anniversary. When today's date is on
 * or past the anniversary AND we haven't celebrated this year yet, pops the
 * celebration modal. After dismiss, writes `lastAnniversaryCelebrated` so it
 * won't re-fire.
 */
export default function VehicleAnniversaryManager() {
  const { vehicle } = useVehicle();
  const { records: maintenance } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);
  const [current, setCurrent] = useState<{ years: number } | null>(null);

  useEffect(() => {
    if (!vehicle || current != null) return;

    const created = new Date(vehicle.createdAt);
    const today = new Date();
    const yearsSince = today.getFullYear() - created.getFullYear();
    if (yearsSince < 1) return;

    // This year's anniversary date — has it passed?
    const anniversary = new Date(today.getFullYear(), created.getMonth(), created.getDate());
    if (today < anniversary) return;

    if ((vehicle.lastAnniversaryCelebrated ?? 0) >= today.getFullYear()) return;

    setCurrent({ years: yearsSince });
  }, [vehicle, current]);

  const dismiss = async () => {
    if (!vehicle || current == null) return;
    const thisYear = new Date().getFullYear();
    try {
      await db.vehicles.update(vehicle.id, { lastAnniversaryCelebrated: thisYear });
    } catch {
      // best-effort
    }
    setCurrent(null);
  };

  if (!vehicle || current == null) return null;

  // Per-anniversary mini-stats over the trailing 365 days.
  const cutoffMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const inLastYear = <T extends { date: Date | string }>(rows: T[]): T[] =>
    rows.filter((r) => new Date(r.date).getTime() >= cutoffMs);

  const maintLastYear = inLastYear(maintenance);
  const fuelLastYear  = inLastYear(fuel);
  const odos = [
    ...maintLastYear.map((r) => r.odometer),
    ...fuelLastYear.map((r) => r.odometer),
  ].filter((o) => o > 0);
  const kmThisYear = odos.length >= 2 ? Math.max(...odos) - Math.min(...odos) : 0;
  const spendThisYear =
    maintLastYear.reduce((s, r) => s + r.totalCost, 0) +
    fuelLastYear.reduce((s, r) => s + r.totalCost, 0);

  return (
    <VehicleAnniversaryCelebration
      vehicle={vehicle}
      stats={{
        years: current.years,
        kmThisYear,
        servicesThisYear: maintLastYear.length,
        spendThisYear,
        fillUpsThisYear: fuelLastYear.length,
      }}
      onClose={dismiss}
    />
  );
}
