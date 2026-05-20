import { ChevronRight } from 'lucide-react';
import type { MaintenanceRecord } from '../../models';
import { formatDate, formatOdometer, formatCurrency } from '../../utils/formatters';
import { CATEGORY_EMOJI } from '../../utils/categoryEmoji';

interface MaintenanceItemProps {
  record: MaintenanceRecord;
  onClick?: () => void;
}

export default function MaintenanceItem({ record, onClick }: MaintenanceItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-zinc-700 text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl flex-shrink-0">
        {CATEGORY_EMOJI[record.category]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-black dark:text-white truncate leading-tight">
          {record.title}
        </p>
        <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5">
          {formatDate(record.date)} · {formatOdometer(record.odometer)}
          {record.shop ? ` · ${record.shop}` : ''}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        <span className="text-[15px] font-semibold text-black dark:text-white">
          {formatCurrency(record.totalCost)}
        </span>
        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600" />
      </div>
    </button>
  );
}
