import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { useVehicle } from '../../hooks/useVehicle';
import MilestoneCelebration, { MILESTONES } from './MilestoneCelebration';

/**
 * Globally-mounted manager that watches the active vehicle's odometer for
 * milestone crossings and pops a full-screen celebration when one occurs.
 *
 * For vehicles with no `lastCelebratedOdometer` (existing pre-v0.9 vehicles),
 * silently initializes it to the nearest past milestone so we don't blast a
 * retroactive parade of celebrations on first launch.
 *
 * Handles sequential crossings (rare — would require bumping the odometer by
 * 50k+ in one save) by letting the effect re-fire after dismiss writes the
 * new `lastCelebratedOdometer` to the DB.
 */
export default function MilestoneCelebrationManager() {
  const { vehicle } = useVehicle();
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (!vehicle) return;
    if (current != null) return; // wait for user dismiss

    // First-time init: silence past milestones. Nearest past milestone (or 0).
    if (vehicle.lastCelebratedOdometer == null) {
      const init = [...MILESTONES]
        .reverse()
        .find((m) => m <= vehicle.currentOdometer) ?? 0;
      db.vehicles.update(vehicle.id, { lastCelebratedOdometer: init }).catch(() => {
        // best-effort
      });
      return;
    }

    // Find the next milestone to celebrate.
    const next = MILESTONES.find(
      (m) => m > vehicle.lastCelebratedOdometer! && m <= vehicle.currentOdometer,
    );
    if (next != null) setCurrent(next);
  }, [vehicle, current]);

  const dismiss = async () => {
    if (!vehicle || current == null) return;
    const milestone = current;
    try {
      await db.vehicles.update(vehicle.id, { lastCelebratedOdometer: milestone });
    } catch {
      // best-effort
    }
    setCurrent(null);
  };

  if (!vehicle || current == null) return null;

  return (
    <MilestoneCelebration
      vehicle={vehicle}
      milestone={current}
      countFrom={Math.max(0, vehicle.lastCelebratedOdometer ?? current - 1000)}
      onClose={dismiss}
    />
  );
}
