import type { FuelRecord } from '../models';

/** Fill-ups ≥ this multiple of the trailing-5 average are flagged as anomalous. */
const ECONOMY_ANOMALY_THRESHOLD = 1.15;

/** Add computed km/economy fields to a list of raw fuel records.
 *
 *  Sorted by odometer (with date as secondary tiebreaker) — odometer is the
 *  monotonic ground truth on the vehicle. Date-only sort breaks economy
 *  calculations when users backdate an entry or log multiple fills in a single
 *  day (e.g., long road trip). */
export function enrichFuelRecords(records: FuelRecord[]): FuelRecord[] {
  if (records.length === 0) return [];

  const sorted = [...records].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const enriched: FuelRecord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const record = { ...sorted[i] };

    // Ensure pricePerLitre is populated
    if (!record.pricePerLitre && record.litres > 0) {
      record.pricePerLitre = record.totalCost / record.litres;
    }

    if (i === 0) {
      enriched.push(record);
      continue;
    }

    // Simple km travelled from previous record
    const prev = sorted[i - 1];
    const kmFromPrev = record.odometer - prev.odometer;
    if (kmFromPrev > 0) {
      record.kmTravelled = kmFromPrev;
    }

    // Economy only valid between two full-tank fill-ups
    if (record.fullTank) {
      // Find the nearest prior full-tank fill
      let prevFullIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (sorted[j].fullTank) {
          prevFullIdx = j;
          break;
        }
      }

      if (prevFullIdx >= 0) {
        const prevFull = sorted[prevFullIdx];
        const km = record.odometer - prevFull.odometer;
        // Sum all litres between prevFullIdx+1 and i (inclusive)
        let litresTotal = 0;
        for (let k = prevFullIdx + 1; k <= i; k++) {
          litresTotal += sorted[k].litres;
        }

        if (km > 0 && litresTotal > 0) {
          record.kmTravelled = km;
          record.lPer100km = (litresTotal / km) * 100;
          record.kmPerL = km / litresTotal;
          record.costPerKm = record.totalCost / km;
        }
      }
    }

    enriched.push(record);
  }

  // Return newest-first for display
  return enriched.reverse();
}

export function calculateAverageFuelEconomy(records: FuelRecord[]): number | null {
  const valid = records.filter((r) => r.lPer100km != null && r.lPer100km > 0);
  if (valid.length === 0) return null;
  return valid.reduce((sum, r) => sum + r.lPer100km!, 0) / valid.length;
}

export function calculateTotalFuelSpend(records: FuelRecord[]): number {
  return records.reduce((sum, r) => sum + r.totalCost, 0);
}

export function calculateAvgKmPerDay(records: FuelRecord[]): number | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24);
  if (days <= 0) return null;
  return (last.odometer - first.odometer) / days;
}

export function getMonthlyFuelSpend(
  records: FuelRecord[],
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

export function detectEconomyAnomalies(records: FuelRecord[]): Set<string> {
  const anomalies = new Set<string>();
  const valid = records
    .filter((r) => r.lPer100km != null && r.fullTank)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (let i = 1; i < valid.length; i++) {
    const trailing = valid.slice(Math.max(0, i - 5), i);
    if (trailing.length < 2) continue;
    const avg = trailing.reduce((s, r) => s + r.lPer100km!, 0) / trailing.length;
    if (valid[i].lPer100km! > avg * ECONOMY_ANOMALY_THRESHOLD) {
      anomalies.add(valid[i].id);
    }
  }

  return anomalies;
}

export function getFuelEconomyByMonth(
  records: FuelRecord[],
): { month: string; lPer100km: number }[] {
  const byMonth: Record<string, { total: number; count: number }> = {};
  for (const r of records) {
    if (r.lPer100km == null || r.lPer100km <= 0) continue;
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
    byMonth[key].total += r.lPer100km;
    byMonth[key].count += 1;
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, count }]) => ({ month, lPer100km: total / count }));
}
