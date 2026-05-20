import { ChevronRight, Droplets } from 'lucide-react';
import type { FuelRecord } from '../../models';
import { formatDate, formatOdometer, formatCurrency, formatLitres } from '../../utils/formatters';

interface FuelItemProps {
  record: FuelRecord;
  onClick?: () => void;
}

export default function FuelItem({ record, onClick }: FuelItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-zinc-700 text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
        <Droplets size={20} className="text-ios-green" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-black dark:text-white leading-tight">
          {formatLitres(record.litres)} · {formatCurrency(record.totalCost)}
          {!record.fullTank && (
            <span className="ml-1.5 text-xs font-normal text-ios-gray dark:text-gray-400">(partial)</span>
          )}
        </p>
        <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5">
          {formatDate(record.date)} · {formatOdometer(record.odometer)}
          {record.pricePerLitre ? ` · $${record.pricePerLitre.toFixed(3)}/L` : ''}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        {record.lPer100km != null ? (
          <span className="text-sm font-semibold text-ios-blue">
            {record.lPer100km.toFixed(1)}L/100
          </span>
        ) : (
          <span className="text-xs text-ios-gray dark:text-gray-500">—</span>
        )}
        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600" />
      </div>
    </button>
  );
}
