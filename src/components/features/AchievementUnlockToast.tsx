import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAchievements, type AchievementWithState } from '../../hooks/useAchievements';

const TIER_GRADIENTS: Record<number, string> = {
  1: 'from-ios-blue/30 to-ios-blue/0',
  2: 'from-ios-green/35 to-ios-green/0',
  3: 'from-ios-orange/40 to-ios-orange/0',
  4: 'from-purple-500/45 to-purple-500/0',
};

const TIER_RINGS: Record<number, string> = {
  1: 'ring-ios-blue/40',
  2: 'ring-ios-green/40',
  3: 'ring-ios-orange/50',
  4: 'ring-purple-400/60',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Legendary',
};

/**
 * Listens for unseen achievement unlocks and pops them up one at a time.
 * Renders globally inside AppShell — does nothing when there's nothing to show.
 */
export default function AchievementUnlockToast() {
  const { unseenUnlocks, markUnseenAsSeen } = useAchievements();
  const [queue, setQueue] = useState<AchievementWithState[]>([]);
  const [current, setCurrent] = useState<AchievementWithState | null>(null);
  const queuedIdsRef = useRef<Set<string>>(new Set());

  // Append newly-unseen unlocks to the local queue (dedupe against ids already queued).
  useEffect(() => {
    if (unseenUnlocks.length === 0) return;
    const additions = unseenUnlocks.filter(
      (u) => !queuedIdsRef.current.has(u.definition.id),
    );
    if (additions.length === 0) return;
    additions.forEach((u) => queuedIdsRef.current.add(u.definition.id));
    setQueue((q) => [...q, ...additions]);
  }, [unseenUnlocks]);

  // Pull the next one off the queue when nothing is showing.
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
  }, [queue, current]);

  const dismiss = async () => {
    if (!current) return;
    const id = current.definition.id;
    setCurrent(null);
    queuedIdsRef.current.delete(id);
    await markUnseenAsSeen([id]);
  };

  if (!current) return null;

  const def = current.definition;
  const gradient = TIER_GRADIENTS[def.tier];
  const ring = TIER_RINGS[def.tier];
  const tierLabel = TIER_LABELS[def.tier];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />
      <div
        className="relative w-full max-w-sm animate-badge-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/85 dark:bg-[#0D1525]/95 backdrop-blur-2xl border border-white/70 dark:border-white/[0.12] rounded-3xl shadow-glass dark:shadow-glass-dark p-6 text-center">
          {/* Top ribbon */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Trophy size={14} className="text-ios-orange" />
            <p className="text-[11px] font-bold text-ios-orange uppercase tracking-[0.15em]">
              Achievement Unlocked
            </p>
          </div>

          {/* Badge */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient}`} />
            <div className={`relative w-24 h-24 rounded-full bg-white dark:bg-white/[0.08] flex items-center justify-center ring-4 ${ring} animate-badge-shimmer`}>
              <span className="text-5xl leading-none" aria-hidden="true">{def.icon}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-black dark:text-white">{def.title}</h2>
          <p className="text-sm text-ios-gray dark:text-gray-400 mt-1.5 leading-relaxed">
            {def.description}
          </p>
          <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-500 uppercase tracking-wide mt-3">
            {tierLabel}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/achievements"
              onClick={dismiss}
              className="block w-full text-center bg-ios-blue text-white py-3 rounded-2xl font-semibold text-[15px] active:opacity-80"
            >
              View All Achievements
            </Link>
            <button
              onClick={dismiss}
              className="text-ios-gray dark:text-gray-400 text-sm py-2 active:opacity-60"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
