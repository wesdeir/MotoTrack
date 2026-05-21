import { ChevronRight, Droplets } from 'lucide-react';
import type { FuelRecord } from '../../models';
import { formatDate, formatOdometer, formatCurrency, formatLitres, formatPricePerLitre, formatLPer100km } from '../../utils/formatters';

interface FuelItemProps {
  record: FuelRecord;
  onClick?: () => void;
  isAnomaly?: boolean;
}

export default function FuelItem({ record, onClick, isAnomaly }: FuelItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/40 dark:active:bg-white/[0.05] text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-ios-green/10 border border-white/60 dark:border-transparent flex items-center justify-center flex-shrink-0">
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
          {record.pricePerLitre ? ` · ${formatPricePerLitre(record.pricePerLitre)}` : ''}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1.5">
        {record.lPer100km != null ? (
          <span className="text-sm font-semibold text-ios-blue">
            {formatLPer100km(record.lPer100km)}
          </span>
        ) : (
          <span className="text-xs text-ios-gray dark:text-gray-500">—</span>
        )}
        {isAnomaly && (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400">
            ↑
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
      </div>
    </button>
  );
}
