import { useEffect } from 'react';
import { Cake } from 'lucide-react';
import Confetti from './Confetti';
import { formatCurrency, formatOdometer } from '../../utils/formatters';
import type { Vehicle } from '../../models';

interface AnniversaryStats {
  /** How many years (anniversaries) — 1, 2, 3… */
  years: number;
  kmThisYear: number;
  servicesThisYear: number;
  spendThisYear: number;
  fillUpsThisYear: number;
}

interface Props {
  vehicle: Vehicle;
  stats: AnniversaryStats;
  onClose: () => void;
}

const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

function ordinal(n: number): string {
  return ORDINALS[n] ?? `${n}th`;
}

/**
 * Full-screen anniversary celebration — fires once per year on the calendar
 * day the vehicle's createdAt anniversary passes. Pure delight moment.
 */
export default function VehicleAnniversaryCelebration({ vehicle, stats, onClose }: Props) {
  // Lock scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const hasNumbers = stats.kmThisYear > 0 || stats.servicesThisYear > 0 || stats.fillUpsThisYear > 0;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <Confetti key={`anniv-${stats.years}`} tier={4} />
      <div
        className="relative w-full max-w-sm animate-badge-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/90 dark:bg-[#0D1525]/95 backdrop-blur-2xl border border-white/70 dark:border-white/[0.12] rounded-3xl shadow-glass dark:shadow-glass-dark p-7 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Cake size={14} className="text-pink-500" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-500">
              Anniversary
            </p>
          </div>

          <div className="text-6xl mb-3">🎂</div>

          <h2 className="text-2xl font-bold text-black dark:text-white leading-tight">
            {ordinal(stats.years)} Year with {vehicle.nickname}
          </h2>

          <p className="text-sm text-ios-gray dark:text-gray-400 mt-2 leading-relaxed">
            Tracking since {new Date(vehicle.createdAt).getFullYear()}.
          </p>

          {hasNumbers && (
            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              {stats.kmThisYear > 0 && (
                <StatTile label="Distance" value={formatOdometer(stats.kmThisYear)} />
              )}
              {stats.servicesThisYear > 0 && (
                <StatTile label="Services" value={String(stats.servicesThisYear)} />
              )}
              {stats.fillUpsThisYear > 0 && (
                <StatTile label="Fill-ups" value={String(stats.fillUpsThisYear)} />
              )}
              {stats.spendThisYear > 0 && (
                <StatTile label="Spent" value={formatCurrency(stats.spendThisYear)} />
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full py-3 rounded-2xl font-semibold text-[15px] text-white active:opacity-80 bg-pink-500"
          >
            Cheers!
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
      <p className="text-[10px] font-semibold text-ios-gray dark:text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-bold text-black dark:text-white mt-0.5 tabular-nums">
        {value}
      </p>
    </div>
  );
}
