import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getReminderWithStatus, sortRemindersByUrgency } from '../utils/reminderLogic';
import type { Reminder, ReminderWithStatus } from '../models';

export function useReminders(
  vehicleId: string | undefined,
  currentOdometer: number,
  avgKmPerDay: number | null,
) {
  const rawReminders = useLiveQuery(
    () =>
      vehicleId
        ? db.reminders.where('vehicleId').equals(vehicleId).toArray()
        : Promise.resolve([] as Reminder[]),
    [vehicleId],
  );

  const reminders: ReminderWithStatus[] = useMemo(() => {
    if (!rawReminders) return [];
    const today = new Date();
    const withStatus = rawReminders.map((r) =>
      getReminderWithStatus(r, currentOdometer, today, avgKmPerDay),
    );
    return sortRemindersByUrgency(withStatus);
  }, [rawReminders, currentOdometer, avgKmPerDay]);

  const addReminder = async (
    data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date();
    await db.reminders.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateReminder = async (
    id: string,
    data: Partial<Omit<Reminder, 'id' | 'createdAt'>>,
  ) => {
    await db.reminders.update(id, { ...data, updatedAt: new Date() });
  };

  const deleteReminder = async (id: string) => {
    await db.reminders.delete(id);
  };

  const urgentCount = useMemo(
    () => reminders.filter((r) => r.status === 'overdue' || r.status === 'due-now').length,
    [reminders],
  );

  return { reminders, urgentCount, addReminder, updateReminder, deleteReminder };
}
