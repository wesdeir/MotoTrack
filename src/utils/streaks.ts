import type { MaintenanceRecord, FuelRecord } from '../models';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function startOfIsoWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay();        // 0..6 with Sun=0
  const shift = (day + 6) % 7;          // shift so Mon=0
  date.setUTCDate(date.getUTCDate() - shift);
  return date;
}

function weekIndex(d: Date): number {
  return Math.round(startOfIsoWeek(d).getTime() / WEEK_MS);
}

export interface StreakInfo {
  /** Consecutive active weeks ending in (or just before) this week. */
  current: number;
  /** Longest run of consecutive active weeks ever. */
  longest: number;
  /** Distinct weeks with any logged activity. */
  activeWeeks: number;
}

/**
 * A "week" is a Monday-Sunday ISO week. A week is "active" when at least one
 * maintenance or fuel record falls in it. Current week is treated leniently:
 * if it has no activity yet, we still count any active streak ending last week.
 */
export function calculateStreak(
  maintenance: Pick<MaintenanceRecord, 'date'>[],
  fuel: Pick<FuelRecord, 'date'>[],
): StreakInfo {
  const indices = new Set<number>();
  for (const r of maintenance) indices.add(weekIndex(new Date(r.date)));
  for (const r of fuel) indices.add(weekIndex(new Date(r.date)));

  if (indices.size === 0) {
    return { current: 0, longest: 0, activeWeeks: 0 };
  }

  // Longest consecutive run.
  const sorted = [...indices].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev = Number.NEGATIVE_INFINITY;
  for (const i of sorted) {
    run = i === prev + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = i;
  }

  // Current streak, anchored at this week.
  const now = weekIndex(new Date());
  let current = 0;
  let walker = now;
  if (indices.has(walker)) {
    current = 1;
    walker -= 1;
  } else {
    // Skip current week — lenient: streak continues if last week was active.
    walker -= 1;
  }
  while (indices.has(walker)) {
    current += 1;
    walker -= 1;
  }

  return { current, longest, activeWeeks: indices.size };
}
