import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRecalls,
  isAcknowledged,
  acknowledgeRecall,
  unacknowledgeRecall,
  type Recall,
} from '../utils/recalls';
import type { Vehicle } from '../models';

interface UseRecallsResult {
  recalls: Recall[];
  loading: boolean;
  /** Recalls the user hasn't dismissed for this vehicle. Drives the banner. */
  unacknowledged: Recall[];
  /** True if any unacknowledged recall is do-not-drive — escalates the banner. */
  hasDoNotDrive: boolean;
  acknowledge: (campaignNumber: string) => void;
  unacknowledge: (campaignNumber: string) => void;
}

/**
 * Watches the active vehicle for NHTSA recalls. Caches in localStorage for
 * 7 days; refreshes silently on app open after that.
 */
export function useRecalls(vehicle: Vehicle | null | undefined): UseRecallsResult {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);
  /** Bumped on acknowledge to recompute the unacked list (localStorage isn't reactive). */
  const [ackTick, setAckTick] = useState(0);

  useEffect(() => {
    if (!vehicle?.year || !vehicle?.make || !vehicle?.model) {
      setRecalls([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRecalls(vehicle)
      .then((r) => { if (!cancelled) setRecalls(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vehicle?.id, vehicle?.year, vehicle?.make, vehicle?.model]);

  const unacknowledged = useMemo(
    () =>
      vehicle
        ? recalls.filter((r) => !isAcknowledged(vehicle.id, r.campaignNumber))
        : [],
    // ackTick is intentionally a dep — localStorage isn't reactive, so the
    // tick is how we re-evaluate `isAcknowledged` after an ack/unack write.
    [vehicle, recalls, ackTick],
  );

  const hasDoNotDrive = unacknowledged.some((r) => r.parkIt);

  const acknowledge = useCallback((campaignNumber: string) => {
    if (!vehicle) return;
    acknowledgeRecall(vehicle.id, campaignNumber);
    setAckTick((n) => n + 1);
  }, [vehicle]);

  const unacknowledge = useCallback((campaignNumber: string) => {
    if (!vehicle) return;
    unacknowledgeRecall(vehicle.id, campaignNumber);
    setAckTick((n) => n + 1);
  }, [vehicle]);

  return { recalls, loading, unacknowledged, hasDoNotDrive, acknowledge, unacknowledge };
}
