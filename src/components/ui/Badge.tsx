import type { ReminderStatus, MaintenanceCategory } from '../../models';
import { CATEGORY_LABELS } from '../../models';

const STATUS_CONFIG: Record<ReminderStatus, { label: string; cls: string }> = {
  overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  'due-now': { label: 'Due Now', cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  'due-soon': { label: 'Due Soon', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ok: { label: 'OK', cls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
};

export function StatusBadge({ status }: { status: ReminderStatus }) {
  const { label, cls } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: MaintenanceCategory }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-400">
      {CATEGORY_LABELS[category]}
    </span>
  );
}
