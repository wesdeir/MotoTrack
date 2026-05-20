import { addMonths, differenceInDays, addDays } from 'date-fns';
import type { Reminder, ReminderWithStatus, ReminderStatus } from '../models';

const DUE_SOON_KM_FRACTION = 0.10; // within 10% of interval
const DUE_NOW_KM_FRACTION = 0.03; // within 3% of interval
const DUE_SOON_DAYS = 45;
const DUE_NOW_DAYS = 14;

export function getReminderWithStatus(
  reminder: Reminder,
  currentOdometer: number,
  today: Date,
  avgKmPerDay: number | null,
): ReminderWithStatus {
  const result: ReminderWithStatus = { ...reminder, status: 'ok' };

  if (!reminder.isActive) {
    result.status = 'ok';
    return result;
  }

  if (reminder.mode === 'km' && reminder.intervalKm != null && reminder.lastServiceOdometer != null) {
    const dueKm = reminder.lastServiceOdometer + reminder.intervalKm;
    const kmUntilDue = dueKm - currentOdometer;
    const dueSoonThreshold = reminder.intervalKm * DUE_SOON_KM_FRACTION;
    const dueNowThreshold = reminder.intervalKm * DUE_NOW_KM_FRACTION;

    result.kmUntilDue = kmUntilDue;
    result.progressPercent = Math.min(
      100,
      ((currentOdometer - reminder.lastServiceOdometer) / reminder.intervalKm) * 100,
    );

    if (kmUntilDue <= 0) {
      result.status = 'overdue';
    } else if (kmUntilDue <= dueNowThreshold) {
      result.status = 'due-now';
    } else if (kmUntilDue <= dueSoonThreshold) {
      result.status = 'due-soon';
    } else {
      result.status = 'ok';
    }

    // Estimate due date from driving pace
    if (avgKmPerDay != null && avgKmPerDay > 0) {
      const daysUntilDue = kmUntilDue / avgKmPerDay;
      result.estimatedDueDate = addDays(today, daysUntilDue);
    }
  } else if (reminder.mode === 'months' && reminder.intervalMonths != null && reminder.lastServiceDate != null) {
    const dueDate = addMonths(new Date(reminder.lastServiceDate), reminder.intervalMonths);
    const daysUntilDue = differenceInDays(dueDate, today);

    result.daysUntilDue = daysUntilDue;
    result.estimatedDueDate = dueDate;

    const totalDays = reminder.intervalMonths * 30;
    const elapsed = differenceInDays(today, new Date(reminder.lastServiceDate));
    result.progressPercent = Math.min(100, (elapsed / totalDays) * 100);

    if (daysUntilDue <= 0) {
      result.status = 'overdue';
    } else if (daysUntilDue <= DUE_NOW_DAYS) {
      result.status = 'due-now';
    } else if (daysUntilDue <= DUE_SOON_DAYS) {
      result.status = 'due-soon';
    } else {
      result.status = 'ok';
    }
  } else if (reminder.mode === 'date' && reminder.dueDate != null) {
    const dueDate = new Date(reminder.dueDate);
    const daysUntilDue = differenceInDays(dueDate, today);

    result.daysUntilDue = daysUntilDue;
    result.estimatedDueDate = dueDate;

    if (daysUntilDue <= 0) {
      result.status = 'overdue';
    } else if (daysUntilDue <= DUE_NOW_DAYS) {
      result.status = 'due-now';
    } else if (daysUntilDue <= DUE_SOON_DAYS) {
      result.status = 'due-soon';
    } else {
      result.status = 'ok';
    }
  }

  return result;
}

export function sortRemindersByUrgency(reminders: ReminderWithStatus[]): ReminderWithStatus[] {
  const order: Record<ReminderStatus, number> = {
    overdue: 0,
    'due-now': 1,
    'due-soon': 2,
    ok: 3,
  };
  return [...reminders].sort((a, b) => {
    const diff = order[a.status] - order[b.status];
    if (diff !== 0) return diff;
    // Within same status, sort by km/days until due ascending
    const aVal = a.kmUntilDue ?? a.daysUntilDue ?? 999999;
    const bVal = b.kmUntilDue ?? b.daysUntilDue ?? 999999;
    return aVal - bVal;
  });
}

export function getUrgentReminders(reminders: ReminderWithStatus[]): ReminderWithStatus[] {
  return reminders.filter((r) => r.status !== 'ok');
}
