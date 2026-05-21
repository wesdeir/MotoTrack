import { useMemo } from 'react';
import { Droplets, Wrench, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import type { MaintenanceRecord, FuelRecord } from '../../models';
import {
  formatDateShort,
  formatOdometer,
  formatCurrency,
  formatLitres,
} from '../../utils/formatters';
import { CATEGORY_EMOJI } from '../../utils/categoryEmoji';
import EmptyState from '../../components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineEntryMaintenance = {
  type: 'maintenance';
  id: string;
  date: Date;
  record: MaintenanceRecord;
};

type TimelineEntryFuel = {
  type: 'fuel';
  id: string;
  date: Date;
  record: FuelRecord;
};

type TimelineEntry = TimelineEntryMaintenance | TimelineEntryFuel;

type MonthGroup = {
  key: string;    // "2025-05"
  label: string;  // "May 2025"
  entries: TimelineEntry[];
};

// ---------------------------------------------------------------------------
// TimelineRow
// ---------------------------------------------------------------------------

interface RowProps {
  entry: TimelineEntry;
  isLast: boolean;
  onEditMaintenance: (r: MaintenanceRecord) => void;
  onViewReceipt?: (r: MaintenanceRecord) => void;
}

function TimelineRow({ entry, isLast, onEditMaintenance, onViewReceipt }: RowProps) {
  const isMaintenance = entry.type === 'maintenance';

  const dot = isMaintenance ? (
    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-ios-blue/10 flex items-center justify-center text-base flex-shrink-0 z-10">
      {CATEGORY_EMOJI[entry.record.category]}
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-ios-green/10 flex items-center justify-center flex-shrink-0 z-10">
      <Droplets size={16} className="text-ios-green" />
    </div>
  );

  const content = isMaintenance ? (
    <button
      onClick={() => onEditMaintenance(entry.record)}
      className="w-full text-left active:bg-white/40 dark:active:bg-white/[0.05] rounded-xl -mx-1 px-1 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-black dark:text-white leading-snug">
            {entry.record.title}
          </p>
          <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5">
            {formatDateShort(entry.record.date)} · {formatOdometer(entry.record.odometer)}
            {entry.record.shop ? ` · ${entry.record.shop}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {entry.record.totalCost > 0 && (
            <span className="text-[13px] font-semibold text-black dark:text-white">
              {formatCurrency(entry.record.totalCost)}
            </span>
          )}
          {entry.record.receiptImage && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewReceipt?.(entry.record); }}
              className="p-1 -mr-1"
              aria-label="View receipt"
            >
              <Paperclip size={13} className="text-ios-blue" />
            </button>
          )}
        </div>
      </div>
    </button>
  ) : (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-black dark:text-white leading-snug">
            {formatLitres(entry.record.litres)} · {formatCurrency(entry.record.totalCost)}
            {!entry.record.fullTank && (
              <span className="ml-1.5 text-xs font-normal text-ios-gray">(partial)</span>
            )}
          </p>
          <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5">
            {formatDateShort(entry.record.date)} · {formatOdometer(entry.record.odometer)}
          </p>
        </div>
        {entry.record.lPer100km != null && (
          <span className="text-[13px] font-semibold text-ios-blue flex-shrink-0 mt-0.5">
            {entry.record.lPer100km.toFixed(1)} L/100
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex px-4 py-0">
      {/* Left column: dot + connector line */}
      <div className="relative flex flex-col items-center mr-3 flex-shrink-0">
        <div className="mt-3">{dot}</div>
        {/* Line grows to fill row height — hidden on last entry of each group */}
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 dark:bg-white/[0.08] mt-1" />
        )}
      </div>

      {/* Right column: entry content */}
      <div className="flex-1 pb-3 pt-3 min-w-0">
        {content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimelineView
// ---------------------------------------------------------------------------

interface TimelineViewProps {
  maintenanceRecords: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
  onEditMaintenance: (r: MaintenanceRecord) => void;
  onViewReceipt?: (r: MaintenanceRecord) => void;
}

export default function TimelineView({
  maintenanceRecords,
  fuelRecords,
  onEditMaintenance,
  onViewReceipt,
}: TimelineViewProps) {
  const groups: MonthGroup[] = useMemo(() => {
    // Merge both record types into a single discriminated array
    const all: TimelineEntry[] = [
      ...maintenanceRecords.map((r) => ({
        type: 'maintenance' as const,
        id: r.id,
        date: new Date(r.date),
        record: r,
      })),
      ...fuelRecords.map((r) => ({
        type: 'fuel' as const,
        id: r.id,
        date: new Date(r.date),
        record: r,
      })),
    ];

    // Sort newest-first
    all.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Group by "YYYY-MM"
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of all) {
      const y = entry.date.getFullYear();
      const m = String(entry.date.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }

    // Convert to MonthGroup array (order preserved — Map maintains insertion order)
    return Array.from(map.entries()).map(([key, entries]) => {
      const [year, month] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return { key, label: format(d, 'MMMM yyyy'), entries };
    });
  }, [maintenanceRecords, fuelRecords]);

  if (maintenanceRecords.length === 0 && fuelRecords.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No history yet"
        description="Your maintenance and fuel records will appear here as a timeline."
      />
    );
  }

  return (
    <div className="py-2">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Month separator */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
            <span className="text-xs font-semibold text-ios-gray dark:text-gray-400 flex-shrink-0 uppercase tracking-wide">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
          </div>

          {/* Entries */}
          {group.entries.map((entry, i) => (
            <TimelineRow
              key={entry.id}
              entry={entry}
              isLast={i === group.entries.length - 1}
              onEditMaintenance={onEditMaintenance}
              onViewReceipt={onViewReceipt}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
