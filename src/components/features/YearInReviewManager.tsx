import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useVehicle } from '../../hooks/useVehicle';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useFuel } from '../../hooks/useFuel';
import { calculateYearStats, hasMeaningfulYearData, type YearStats } from '../../utils/yearStats';
import YearInReview from './YearInReview';
import type { UnlockedAchievement } from '../../models';

const YIR_REPLAY_EVENT = 'mototrack:replay-yir';

/** Dispatch this from Settings to force-show the previous year's review. */
export function replayYearInReview() {
  window.dispatchEvent(new Event(YIR_REPLAY_EVENT));
}

/**
 * Watches for the "first launch of a new calendar year" condition and pops the
 * YearInReview modal once per vehicle per year. Also listens for an explicit
 * replay event (fired from Settings) so users can re-watch the previous year's
 * wrapped at any time.
 *
 * Suppresses automatically if the previous year has fewer than 3 log entries
 * (would be a sad, empty wrapped).
 */
export default function YearInReviewManager() {
  const { vehicle } = useVehicle();
  const { records: maintenance } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);

  const unlocked = useLiveQuery(
    () =>
      vehicle?.id
        ? db.unlockedAchievements.where('vehicleId').equals(vehicle.id).toArray()
        : Promise.resolve([] as UnlockedAchievement[]),
    [vehicle?.id],
  );

  const [active, setActive] = useState<{ stats: YearStats; vehicleId: string } | null>(null);
  const [replayTick, setReplayTick] = useState(0);

  // Listen for manual replay events from Settings.
  useEffect(() => {
    const handler = () => setReplayTick((n) => n + 1);
    window.addEventListener(YIR_REPLAY_EVENT, handler);
    return () => window.removeEventListener(YIR_REPLAY_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!vehicle || unlocked == null) return;
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    const flagKey = `mototrack-yir-shown-${prevYear}-${vehicle.id}`;

    // Replay path: bypass the flag, always show.
    const isReplay = replayTick > 0;
    if (!isReplay) {
      try {
        if (localStorage.getItem(flagKey) === '1') return;
      } catch { /* no-op */ }
      if (!hasMeaningfulYearData(prevYear, maintenance, fuel)) return;
    }

    const stats = calculateYearStats(prevYear, vehicle, maintenance, fuel, unlocked);
    setActive({ stats, vehicleId: vehicle.id });
  }, [vehicle, maintenance, fuel, unlocked, replayTick]);

  const close = () => {
    if (active) {
      try {
        localStorage.setItem(
          `mototrack-yir-shown-${active.stats.year}-${active.vehicleId}`,
          '1',
        );
      } catch { /* no-op */ }
    }
    setActive(null);
    setReplayTick(0);
  };

  if (!active) return null;
  return <YearInReview stats={active.stats} onClose={close} />;
}
