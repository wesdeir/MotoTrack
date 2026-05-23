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
import { calculateHealthScore } from '../utils/healthScore';
import { calculateAvgKmPerDay } from '../utils/fuelCalc';
import { getReminderWithStatus } from '../utils/reminderLogic';
import { formatInputDate } from '../utils/formatters';
import type {
  Reminder,
  UnlockedAchievement,
  HealthScoreSnapshot,
  ReminderWithStatus,
} from '../models';

export interface AchievementWithState {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: Date;
  /** Fresh unlocks the user hasn't seen the celebration for yet. */
  isNew: boolean;
  /** 0..1 progress toward the unlock (or 1 if unlocked). */
  progressFraction: number;
  progressLabel?: string;
  /** True when the user has pinned this badge to the Dashboard showcase. */
  pinned: boolean;
  /** When pinned — newer pins evict older ones when the cap is hit. */
  pinnedAt?: Date;
}

/** Max number of badges the user can pin to the Dashboard showcase. */
export const PIN_LIMIT = 3;

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

  /** Enriched reminders with computed status. Today is recomputed once per render —
   *  good enough for badge-wall display + achievement evaluation. */
  const enrichedReminders: ReminderWithStatus[] = useMemo(() => {
    if (!vehicle || !rawReminders) return [];
    const today = new Date();
    const avgKmPerDay = calculateAvgKmPerDay(fuel);
    return rawReminders.map((r) =>
      getReminderWithStatus(r, vehicle.currentOdometer, today, avgKmPerDay),
    );
  }, [vehicle, rawReminders, fuel]);

  /** Live health-score snapshots for the active vehicle. Phoenix uses these. */
  const healthSnapshots = useLiveQuery(
    () =>
      vehicle?.id
        ? db.healthScoreSnapshots.where('vehicleId').equals(vehicle.id).toArray()
        : Promise.resolve([] as HealthScoreSnapshot[]),
    [vehicle?.id],
  );

  /** Live vehicle health score for the active vehicle. */
  const healthScore = useMemo(
    () =>
      vehicle
        ? calculateHealthScore(vehicle, maintenance, fuel, enrichedReminders, documents)
        : null,
    [vehicle, maintenance, fuel, enrichedReminders, documents],
  );

  // Daily health-score snapshot. Writes one row per vehicle per day; prunes
  // anything older than 60 days. Lightweight enough to run every render.
  useEffect(() => {
    if (!vehicle || !healthScore) return;
    const today = formatInputDate(new Date());
    (async () => {
      try {
        const existing = await db.healthScoreSnapshots
          .where('[vehicleId+date]')
          .equals([vehicle.id, today])
          .first();
        if (!existing) {
          await db.healthScoreSnapshots.add({
            id: crypto.randomUUID(),
            vehicleId: vehicle.id,
            date: today,
            score: healthScore.total,
            createdAt: new Date(),
          });
        }
        // Prune older than 60 days.
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 60);
        const cutoffStr = formatInputDate(cutoff);
        const old = await db.healthScoreSnapshots
          .where('vehicleId')
          .equals(vehicle.id)
          .filter((s) => s.date < cutoffStr)
          .toArray();
        if (old.length > 0) {
          await db.healthScoreSnapshots.bulkDelete(old.map((s) => s.id));
        }
      } catch {
        // Best-effort — snapshot failure shouldn't break the app.
      }
    })();
  }, [vehicle, healthScore]);

  // Persist newly-satisfied achievements. Skips already-unlocked ids and writes
  // one row per newly satisfied id. Each write is idempotent guarded by the
  // [vehicleId+achievementId] index.
  const writingRef = useRef(false);
  useEffect(() => {
    if (!vehicle) return;
    if (rawReminders == null || unlocked == null) return;
    if (!healthScore) return;
    if (writingRef.current) return;

    const ctx: AchievementContext = {
      vehicle,
      maintenance,
      fuel,
      reminders: enrichedReminders,
      documents,
      streak,
      healthScore,
      healthSnapshots: healthSnapshots ?? [],
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
  }, [vehicle, maintenance, fuel, rawReminders, documents, unlocked, streak, healthScore, healthSnapshots, enrichedReminders]);

  const merged: AchievementWithState[] = useMemo(() => {
    if (!vehicle || !healthScore) return [];
    const unlockedMap = new Map((unlocked ?? []).map((u) => [u.achievementId, u]));
    const ctx: AchievementContext = {
      vehicle,
      maintenance,
      fuel,
      reminders: enrichedReminders,
      documents,
      streak,
      healthScore,
      healthSnapshots: healthSnapshots ?? [],
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
        pinned: u?.pinned === true,
        pinnedAt: u?.pinnedAt,
      };
    });
  }, [vehicle, maintenance, fuel, enrichedReminders, documents, unlocked, streak, healthScore, healthSnapshots]);

  /** Pinned achievements, oldest pin first (display order on the Dashboard). */
  const pinnedAchievements = useMemo(
    () =>
      merged
        .filter((a) => a.pinned)
        .sort((a, b) => {
          const aT = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
          const bT = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
          return aT - bT;
        }),
    [merged],
  );

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

  /**
   * Toggle pin state for an achievement. Enforces PIN_LIMIT — if pinning would
   * exceed the cap, the oldest pin is automatically evicted.
   * No-op if the achievement isn't unlocked yet.
   */
  const togglePin = async (achievementId: string) => {
    if (!vehicle) return;
    const rows = await db.unlockedAchievements
      .where('vehicleId')
      .equals(vehicle.id)
      .toArray();
    const target = rows.find((r) => r.achievementId === achievementId);
    if (!target) return;

    if (target.pinned) {
      await db.unlockedAchievements.update(target.id, {
        pinned: false,
        pinnedAt: undefined,
      });
      return;
    }

    // Pinning — evict oldest if at cap.
    const currentlyPinned = rows
      .filter((r) => r.pinned)
      .sort((a, b) => {
        const aT = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bT = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return aT - bT;
      });
    if (currentlyPinned.length >= PIN_LIMIT) {
      const oldest = currentlyPinned[0];
      await db.unlockedAchievements.update(oldest.id, {
        pinned: false,
        pinnedAt: undefined,
      });
    }
    await db.unlockedAchievements.update(target.id, {
      pinned: true,
      pinnedAt: new Date(),
    });
  };

  return {
    achievements: merged,
    pinnedAchievements,
    unseenUnlocks,
    unlockedCount,
    totalCount,
    totalXp,
    maxXp: maxAvailableXp,
    levelInfo,
    streak,
    healthScore,
    healthSnapshots: healthSnapshots ?? [],
    markUnseenAsSeen,
    togglePin,
  };
}
