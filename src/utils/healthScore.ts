import { differenceInDays } from 'date-fns';
import type {
  MaintenanceRecord,
  FuelRecord,
  ReminderWithStatus,
  Vehicle,
  VehicleDocument,
} from '../models';

export type HealthTier = 'excellent' | 'good' | 'fair' | 'critical';

export interface HealthCategoryScore {
  /** 0..max */
  score: number;
  max: number;
  /** Short label used in the breakdown UI. */
  label: string;
  /** One-line nudge shown when the category is below max. */
  hint: string | null;
}

export interface HealthScore {
  /** 0..100 overall score, rounded to nearest int. */
  total: number;
  tier: HealthTier;
  tierLabel: string;
  /** Headline action ("Resolve 2 overdue reminders" / "You're all set"). */
  topHint: string;
  categories: {
    reminders: HealthCategoryScore;
    activity: HealthCategoryScore;
    engagement: HealthCategoryScore;
    documentation: HealthCategoryScore;
  };
}

const TIER_THRESHOLDS: Array<{ min: number; tier: HealthTier; label: string }> = [
  { min: 80, tier: 'excellent', label: 'Excellent' },
  { min: 60, tier: 'good',      label: 'Good' },
  { min: 40, tier: 'fair',      label: 'Needs Attention' },
  { min: 0,  tier: 'critical',  label: 'Critical' },
];

function tierFor(total: number): { tier: HealthTier; label: string } {
  const found = TIER_THRESHOLDS.find((t) => total >= t.min);
  return found ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

function scoreReminders(reminders: ReminderWithStatus[]): HealthCategoryScore {
  const active = reminders.filter((r) => r.isActive);
  const max = 40;

  if (active.length === 0) {
    return {
      score: 25,
      max,
      label: 'Reminders',
      hint: 'Set up reminders so nothing slips through the cracks.',
    };
  }

  const counts = {
    overdue: active.filter((r) => r.status === 'overdue').length,
    dueNow:  active.filter((r) => r.status === 'due-now').length,
    dueSoon: active.filter((r) => r.status === 'due-soon').length,
  };

  const penalty =
    (counts.overdue * 1.0 + counts.dueNow * 0.6 + counts.dueSoon * 0.3) / active.length;
  const score = Math.round(max * Math.max(0, 1 - penalty));

  let hint: string | null = null;
  if (counts.overdue > 0) {
    hint = `Resolve ${counts.overdue} overdue reminder${counts.overdue === 1 ? '' : 's'} to boost your score.`;
  } else if (counts.dueNow > 0) {
    hint = `${counts.dueNow} service${counts.dueNow === 1 ? ' is' : 's are'} due now.`;
  } else if (counts.dueSoon > 0) {
    hint = `${counts.dueSoon} reminder${counts.dueSoon === 1 ? '' : 's'} coming up soon.`;
  }

  return { score, max, label: 'Reminders', hint };
}

function scoreActivity(
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
): HealthCategoryScore {
  const max = 30;
  const dates: number[] = [];
  for (const r of maintenance) dates.push(new Date(r.date).getTime());
  for (const r of fuel) dates.push(new Date(r.date).getTime());

  if (dates.length === 0) {
    return {
      score: 0,
      max,
      label: 'Activity',
      hint: 'Log your first service or fuel-up to get started.',
    };
  }

  const latest = new Date(Math.max(...dates));
  const days = Math.max(0, differenceInDays(new Date(), latest));

  let score = 0;
  if (days <= 30) score = 30;
  else if (days <= 60) score = 20;
  else if (days <= 90) score = 12;
  else if (days <= 180) score = 5;

  const hint = score < max
    ? `Last activity ${days} days ago — log a service or fuel-up to refresh.`
    : null;

  return { score, max, label: 'Activity', hint };
}

function scoreEngagement(maintenance: MaintenanceRecord[]): HealthCategoryScore {
  const max = 15;
  const n = maintenance.length;

  let score = 0;
  if (n >= 10) score = 15;
  else if (n >= 3) score = 10;
  else if (n >= 1) score = 5;

  let hint: string | null = null;
  if (n === 0) hint = 'Log a service record to start building your history.';
  else if (n < 3) hint = `${3 - n} more service${3 - n === 1 ? '' : 's'} logged unlocks the next tier.`;
  else if (n < 10) hint = `${10 - n} more services to reach the top tier.`;

  return { score, max, label: 'Service History', hint };
}

function scoreDocumentation(
  vehicle: Vehicle,
  documents: VehicleDocument[],
): HealthCategoryScore {
  const max = 15;
  let score = 0;
  const missing: string[] = [];

  if (vehicle.vin && vehicle.vin.trim().length > 0) score += 5;
  else missing.push('VIN');

  if (documents.length >= 1) score += 5;
  else missing.push('at least one document in GloveBox');

  const hasOfficialDoc = documents.some(
    (d) => d.type === 'insurance' || d.type === 'registration',
  );
  if (hasOfficialDoc) score += 5;
  else missing.push('insurance or registration');

  const hint = missing.length > 0 ? `Add ${missing[0]} to the GloveBox.` : null;

  return { score, max, label: 'Documentation', hint };
}

function pickTopHint(categories: HealthScore['categories']): string {
  const ordered = [
    categories.reminders,
    categories.activity,
    categories.engagement,
    categories.documentation,
  ];
  const worst = ordered
    .filter((c) => c.hint != null)
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
  return worst?.hint ?? "You're all set — keep it up!";
}

export function calculateHealthScore(
  vehicle: Vehicle,
  maintenance: MaintenanceRecord[],
  fuel: FuelRecord[],
  reminders: ReminderWithStatus[],
  documents: VehicleDocument[],
): HealthScore {
  const categories = {
    reminders:     scoreReminders(reminders),
    activity:      scoreActivity(maintenance, fuel),
    engagement:    scoreEngagement(maintenance),
    documentation: scoreDocumentation(vehicle, documents),
  };

  const total = Math.round(
    categories.reminders.score +
    categories.activity.score +
    categories.engagement.score +
    categories.documentation.score,
  );

  const { tier, label } = tierFor(total);

  return {
    total,
    tier,
    tierLabel: label,
    topHint: pickTopHint(categories),
    categories,
  };
}
