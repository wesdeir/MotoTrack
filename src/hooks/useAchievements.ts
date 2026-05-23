import { useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useVehicle } from './useVehicle';
import { useMaintenance } from './useMaintenance';
import { useFuel } from './useFuel';
import { useDocuments } from './useDocuments';
import {
  ACHIEVEMENTS,
  calculateLevel,
  calculateXp,
  evaluateAchievements,
  maxXp,
  type AchievementContext,
  type AchievementDefinition,
  type LevelInfo,
} from '../utils/achievements';
import { calculateStreak, type StreakInfo } from '../utils/streaks';
import type { Reminder, UnlockedAchievement } from '../models';

export interface AchievementWithState {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: Date;
  /** Fresh unlocks the user hasn't seen the celebration for yet. */
  isNew: boolean;
  /** 0..1 progress toward the unlock (or 1 if unlocked). */
  progressFraction: number;
  progressLabel?: string;
}

/**
 * Watches the active vehicle's data and writes new achievement unlocks into the DB.
 * Also exposes the merged catalog+state for the Achievements page.
 */
export function useAchievements() {
  const { vehicle } = useVehicle();
  const { records: maintenance } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);
  const { documents } = useDocuments(vehicle?.id);

  const rawReminders = useLiveQuery(
    () =>
      vehicle?.id
        ? db.reminders.where('vehicleId').equals(vehicle.id).toArray()
        : Promise.resolve([] as Reminder[]),
    [vehicle?.id],
  );

  const unlocked = useLiveQuery(
    () =>
      vehicle?.id
        ? db.unlockedAchievements.where('vehicleId').equals(vehicle.id).toArray()
        : Promise.resolve([] as UnlockedAchievement[]),
    [vehicle?.id],
  );

  const streak: StreakInfo = useMemo(
    () => calculateStreak(maintenance, fuel),
    [maintenance, fuel],
  );

  // Persist newly-satisfied achievements. Skips already-unlocked ids and writes
  // one row per newly satisfied id. Each write is idempotent guarded by the
  // [vehicleId+achievementId] index.
  const writingRef = useRef(false);
  useEffect(() => {
    if (!vehicle) return;
    if (rawReminders == null || unlocked == null) return;
    if (writingRef.current) return;

    const ctx: AchievementContext = {
      vehicle,
      maintenance,
      fuel,
      reminders: rawReminders,
      documents,
      streak,
    };

    const satisfied = new Set(evaluateAchievements(ctx));
    const already = new Set(unlocked.map((u) => u.achievementId));
    const newIds = [...satisfied].filter((id) => !already.has(id));
    if (newIds.length === 0) return;

    // Bulk-init scenario (demo data, backup restore, etc.): if this vehicle has no
    // prior unlocks AND we'd add many at once, mark them as already-seen so the
    // celebration toast doesn't spam. Real "earned" unlocks come 1-2 at a time.
    const isBulkInit = unlocked.length === 0 && newIds.length >= 3;

    writingRef.current = true;
    const now = new Date();
    const rows: UnlockedAchievement[] = newIds.map((achievementId) => ({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id,
      achievementId,
      unlockedAt: now,
      seen: isBulkInit,
    }));
    db.unlockedAchievements.bulkAdd(rows).finally(() => {
      writingRef.current = false;
    });
  }, [vehicle, maintenance, fuel, rawReminders, documents, unlocked, streak]);

  const merged: AchievementWithState[] = useMemo(() => {
    if (!vehicle) return [];
    const unlockedMap = new Map((unlocked ?? []).map((u) => [u.achievementId, u]));
    const ctx: AchievementContext = {
      vehicle,
      maintenance,
      fuel,
      reminders: rawReminders ?? [],
      documents,
      streak,
    };

    return ACHIEVEMENTS.map((def) => {
      const u = unlockedMap.get(def.id);
      const isUnlocked = u != null;
      const prog = def.progress ? def.progress(ctx) : null;
      return {
        definition: def,
        unlocked: isUnlocked,
        unlockedAt: u?.unlockedAt,
        isNew: u != null && !u.seen,
        progressFraction: isUnlocked ? 1 : (prog?.fraction ?? 0),
        progressLabel: prog?.label,
      };
    });
  }, [vehicle, maintenance, fuel, rawReminders, documents, unlocked, streak]);

  /** Newly-unlocked, unseen achievements. Used by the celebration toast. */
  const unseenUnlocks = useMemo(
    () => merged.filter((m) => m.isNew),
    [merged],
  );

  const unlockedCount = merged.filter((m) => m.unlocked).length;
  const totalCount = merged.length;

  const totalXp = useMemo(
    () => calculateXp((unlocked ?? []).map((u) => u.achievementId)),
    [unlocked],
  );
  const levelInfo: LevelInfo = useMemo(() => calculateLevel(totalXp), [totalXp]);
  const maxAvailableXp = useMemo(() => maxXp(), []);

  /** Mark all unseen unlocks as seen — call when the toast has been shown. */
  const markUnseenAsSeen = async (ids: string[]) => {
    if (!vehicle || ids.length === 0) return;
    const rows = await db.unlockedAchievements
      .where('vehicleId')
      .equals(vehicle.id)
      .toArray();
    const targets = rows.filter((r) => ids.includes(r.achievementId) && !r.seen);
    await Promise.all(
      targets.map((r) => db.unlockedAchievements.update(r.id, { seen: true })),
    );
  };

  return {
    achievements: merged,
    unseenUnlocks,
    unlockedCount,
    totalCount,
    totalXp,
    maxXp: maxAvailableXp,
    levelInfo,
    streak,
    markUnseenAsSeen,
  };
}
