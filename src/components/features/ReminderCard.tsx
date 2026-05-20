import { ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReminderWithStatus } from '../../models';
import { StatusBadge } from '../ui/Badge';
import { formatKm, formatDate } from '../../utils/formatters';
import { CATEGORY_EMOJI } from '../../utils/categoryEmoji';

const PROGRESS_COLOR: Record<string, string> = {
  overdue: 'bg-ios-red',
  'due-now': 'bg-ios-orange',
  'due-soon': 'bg-ios-yellow',
  ok: 'bg-ios-blue',
};

function buildSubtext(r: ReminderWithStatus): string | null {
  if (r.mode === 'km') {
    if (r.kmUntilDue == null) return null;
    if (r.kmUntilDue <= 0) {
      const est = r.estimatedDueDate
        ? ` · est. ${formatDistanceToNow(r.estimatedDueDate, { addSuffix: false })} ago`
        : '';
      return `${formatKm(-r.kmUntilDue)} overdue${est}`;
    }
    const est = r.estimatedDueDate
      ? ` · est. ${formatDistanceToNow(r.estimatedDueDate, { addSuffix: true })}`
      : '';
    return `${formatKm(r.kmUntilDue)} remaining${est}`;
  }
  if (r.daysUntilDue == null) return null;
  if (r.daysUntilDue <= 0) return `${Math.abs(r.daysUntilDue)} day${Math.abs(r.daysUntilDue) !== 1 ? 's' : ''} overdue`;
  return `Due ${formatDate(r.estimatedDueDate)}`;
}

export default function ReminderCard({
  reminder,
  onClick,
}: {
  reminder: ReminderWithStatus;
  onClick?: () => void;
}) {
  const subtext = buildSubtext(reminder);
  const pct = Math.min(100, reminder.progressPercent ?? 0);

  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left ${
        interactive ? 'cursor-pointer active:bg-gray-50 dark:active:bg-zinc-700' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
        {CATEGORY_EMOJI[reminder.serviceType]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[15px] font-semibold text-black dark:text-white truncate leading-tight">
            {reminder.title}
          </p>
          <StatusBadge status={reminder.status} />
        </div>
        {subtext && (
          <p className="text-xs text-ios-gray dark:text-gray-400 mb-1.5">{subtext}</p>
        )}
        {reminder.progressPercent != null && (
          <div className="progress-bar">
            <div
              className={`progress-fill ${PROGRESS_COLOR[reminder.status]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {interactive && (
        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600 flex-shrink-0 mt-1" />
      )}
    </div>
  );
}
