import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useVehicle } from '../../hooks/useVehicle';
import { useAchievements } from '../../hooks/useAchievements';

const THRESHOLDS: { fraction: number; pct: number; label: string; icon: string }[] = [
  { fraction: 0.5, pct: 50, label: 'Halfway there', icon: '🏃' },
  { fraction: 0.9, pct: 90, label: 'Almost there',  icon: '🔥' },
];

const STORAGE_PREFIX = 'mototrack-progress-notified';
const TOAST_MS = 3500;

interface QueuedToast {
  id: string;
  pct: number;
  label: string;
  icon: string;
  title: string;
  progressLabel?: string;
}

/**
 * Watches in-progress achievements and pops a small toast when one crosses
 * 50% or 90% for the first time. Per-vehicle per-achievement state lives in
 * localStorage so a refresh doesn't re-fire the same toast.
 *
 * Bootstrap protection: on first paint for a vehicle, we record the current
 * thresholds without firing — otherwise loading the app for an active user
 * with 20 in-progress achievements would blast 40 toasts.
 */
export default function AchievementProgressToast() {
  const { vehicle } = useVehicle();
  const { achievements } = useAchievements();
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const [current, setCurrent] = useState<QueuedToast | null>(null);
  const bootstrappedRef = useRef<Set<string>>(new Set()); // vehicles bootstrapped this session

  // Detect threshold crossings and enqueue toasts (or bootstrap silently).
  useEffect(() => {
    if (!vehicle) return;

    const bootstrapping = !bootstrappedRef.current.has(vehicle.id);
    const fresh: QueuedToast[] = [];

    for (const a of achievements) {
      if (a.unlocked) continue;
      if (a.definition.hidden) continue;
      if (a.progressFraction <= 0) continue;

      const key = `${STORAGE_PREFIX}:${vehicle.id}:${a.definition.id}`;
      let lastPct = 0;
      try {
        const stored = localStorage.getItem(key);
        if (stored) lastPct = Number(stored) || 0;
      } catch { /* no-op */ }

      // Find highest crossed threshold
      let newPct = lastPct;
      for (const t of THRESHOLDS) {
        if (a.progressFraction >= t.fraction && lastPct < t.pct) {
          newPct = Math.max(newPct, t.pct);
        }
      }

      if (newPct > lastPct) {
        try { localStorage.setItem(key, String(newPct)); } catch { /* no-op */ }
        if (!bootstrapping) {
          const tier = THRESHOLDS.find((t) => t.pct === newPct)!;
          fresh.push({
            id: a.definition.id,
            pct: newPct,
            label: tier.label,
            icon: tier.icon,
            title: a.definition.title,
            progressLabel: a.progressLabel,
          });
        }
      }
    }

    bootstrappedRef.current.add(vehicle.id);
    if (fresh.length > 0) {
      setQueue((prev) => [...prev, ...fresh]);
    }
  }, [vehicle, achievements]);

  // Drain the queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    const t = setTimeout(() => setCurrent(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [queue, current]);

  if (!current) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[68] w-full max-w-sm px-4 pointer-events-none"
      style={{ bottom: 'calc(var(--nav-height, 56px) + env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <div className="pointer-events-auto bg-[#0D1525]/95 dark:bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-glass-dark px-4 py-3 flex items-center gap-3 animate-slide-up">
        <span className="text-2xl leading-none" aria-hidden="true">{current.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ios-orange">
            {current.label} · {current.pct}%
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {current.title}
            {current.progressLabel && (
              <span className="text-white/60 font-normal ml-1.5">({current.progressLabel})</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setCurrent(null)}
          className="w-7 h-7 rounded-full bg-white/[0.10] flex items-center justify-center flex-shrink-0 active:bg-white/[0.15]"
          aria-label="Dismiss"
        >
          <X size={14} className="text-white/80" />
        </button>
      </div>
    </div>
  );
}
