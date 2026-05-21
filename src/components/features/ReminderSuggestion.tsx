import type { MaintenanceCategory, ReminderWithStatus } from '../../models';

const DEFAULT_INTERVALS: Partial<Record<MaintenanceCategory, { km: number; label: string }>> = {
  'oil-change':          { km: 5_000,  label: 'every 5,000 km' },
  brakes:                { km: 25_000, label: 'every 25,000 km' },
  'spark-plugs':         { km: 50_000, label: 'every 50,000 km' },
  coolant:               { km: 50_000, label: 'every 50,000 km' },
  'transmission-fluid':  { km: 50_000, label: 'every 50,000 km' },
  'brake-fluid':         { km: 40_000, label: 'every 40,000 km' },
  tires:                 { km: 10_000, label: 'every 10,000 km (rotation)' },
  filter:                { km: 20_000, label: 'every 20,000 km' },
  inspection:            { km: 0,      label: 'annually' },
};

export function getDefaultInterval(
  category: MaintenanceCategory,
): { km: number; label: string } | null {
  return DEFAULT_INTERVALS[category] ?? null;
}

interface Props {
  category: MaintenanceCategory;
  serviceTitle: string;
  existingReminder?: ReminderWithStatus;
  onAccept: () => void;
  onSkip: () => void;
}

export default function ReminderSuggestion({
  category,
  serviceTitle,
  existingReminder,
  onAccept,
  onSkip,
}: Props) {
  const interval = DEFAULT_INTERVALS[category];
  if (!interval) return null;

  const isUpdate = !!existingReminder;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={onSkip}>
      <div
        className="bg-white/80 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-t border-white/60 dark:border-white/[0.08] rounded-t-2xl px-5 pt-4 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-4" />
        <p className="text-[17px] font-bold text-black dark:text-white mb-1">
          {isUpdate ? 'Update reminder?' : 'Set a reminder?'}
        </p>
        <p className="text-sm text-ios-gray dark:text-gray-400 mb-5">
          {isUpdate
            ? `Update "${existingReminder!.title}" with today's service date and odometer.`
            : `Get reminded to do "${serviceTitle}" ${interval.label}.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl text-[15px] font-semibold text-ios-gray dark:text-gray-400 bg-white/40 dark:bg-white/[0.07] border border-white/60 dark:border-white/[0.10]"
          >
            Skip
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl text-[15px] font-semibold text-white bg-ios-blue active:opacity-85"
          >
            {isUpdate ? 'Update Reminder' : 'Set Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
}
