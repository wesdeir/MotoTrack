import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import Confetti from './Confetti';
import { formatOdometer } from '../../utils/formatters';
import type { Vehicle } from '../../models';

/** Milestone thresholds — celebration fires when crossing each. */
export const MILESTONES: number[] = [
  50_000, 100_000, 150_000, 200_000, 250_000, 300_000, 350_000, 400_000,
  450_000, 500_000, 600_000, 750_000, 1_000_000,
];

/** Legendary milestones get an upgraded headline. */
function milestoneInfo(km: number): { label: string; legendary: boolean } {
  if (km === 1_000_000) return { label: 'Million-Mile Club', legendary: true };
  if (km === 500_000)   return { label: 'Half-Million',      legendary: true };
  if (km === 300_000)   return { label: '300k Legend',       legendary: true };
  if (km === 200_000)   return { label: '200k Club',         legendary: true };
  if (km === 100_000)   return { label: '100k Club',         legendary: true };
  return { label: 'Milestone Reached', legendary: false };
}

interface Props {
  vehicle: Vehicle;
  /** The milestone being celebrated. */
  milestone: number;
  /** Where to start the count-up animation. */
  countFrom: number;
  onClose: () => void;
}

/**
 * Full-screen takeover when the odometer crosses a milestone. Tier-4 confetti,
 * count-up animation, legendary headline for the big ones. One-shot — re-mount
 * to replay.
 */
export default function MilestoneCelebration({ vehicle, milestone, countFrom, onClose }: Props) {
  const { label, legendary } = milestoneInfo(milestone);
  const display = useCountUp(countFrom, milestone, 1800);

  // Lock scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <Confetti key={milestone} tier={legendary ? 4 : 3} />
      <div
        className="relative w-full max-w-sm animate-badge-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/90 dark:bg-[#0D1525]/95 backdrop-blur-2xl border border-white/70 dark:border-white/[0.12] rounded-3xl shadow-glass dark:shadow-glass-dark p-7 text-center">
          {/* Top ribbon */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Trophy size={14} className={legendary ? 'text-ios-orange' : 'text-ios-blue'} />
            <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
              legendary ? 'text-ios-orange' : 'text-ios-blue'
            }`}>
              {legendary ? 'Legendary Milestone' : 'Milestone Reached'}
            </p>
          </div>

          {/* Headline */}
          <h2 className={`text-2xl font-bold leading-tight ${
            legendary ? 'text-ios-orange' : 'text-black dark:text-white'
          }`}>
            {label}
          </h2>

          {/* Big rolling number */}
          <div className="my-5">
            <div className="text-5xl font-black tracking-tight text-black dark:text-white tabular-nums leading-none">
              {formatOdometer(display).replace(/\s*km$/i, '').replace(/\s*mi$/i, '')}
            </div>
            <div className="text-sm font-semibold text-ios-gray dark:text-gray-400 mt-2 uppercase tracking-wide">
              {vehicle.units === 'miles' ? 'miles' : 'kilometres'}
            </div>
          </div>

          <p className="text-sm text-ios-gray dark:text-gray-400 leading-relaxed">
            <span className="font-semibold text-black dark:text-white">{vehicle.nickname}</span>{' '}
            just hit a major milestone.
          </p>

          <button
            onClick={onClose}
            className={`mt-6 w-full py-3 rounded-2xl font-semibold text-[15px] text-white active:opacity-80 ${
              legendary ? 'bg-ios-orange' : 'bg-ios-blue'
            }`}
          >
            Nice!
          </button>
        </div>
      </div>
    </div>
  );
}

/** Count-up animation from `from` to `to` using ease-out cubic. */
function useCountUp(from: number, to: number, durationMs: number): number {
  const [value, setValue] = useState(from);

  useEffect(() => {
    setValue(from);
    if (from >= to) return;

    let raf = 0;
    const start = performance.now();
    const span = to - from;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(from + span * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(to);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, durationMs]);

  return value;
}
