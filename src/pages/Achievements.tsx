import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Trophy } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAchievements, type AchievementWithState } from '../hooks/useAchievements';
import { useVehicle } from '../hooks/useVehicle';
import { formatDate } from '../utils/formatters';
import type { AchievementCategory } from '../utils/achievements';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  service:    'Service',
  fuel:       'Fuel',
  reminders:  'Reminders',
  docs:       'Documents',
  milestone:  'Milestones',
  mastery:    'Mastery',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'service', 'fuel', 'reminders', 'docs', 'milestone', 'mastery',
];

const TIER_RING: Record<number, string> = {
  1: 'ring-ios-blue/30',
  2: 'ring-ios-green/40',
  3: 'ring-ios-orange/50',
  4: 'ring-purple-400/60',
};

export default function AchievementsPage() {
  const { vehicle } = useVehicle();
  const { achievements, unlockedCount, totalCount, unseenUnlocks, markUnseenAsSeen } = useAchievements();
  const [detail, setDetail] = useState<AchievementWithState | null>(null);

  // Visiting this page counts as seeing the unseen unlocks — clear the "new" indicator.
  useEffect(() => {
    if (unseenUnlocks.length === 0) return;
    markUnseenAsSeen(unseenUnlocks.map((u) => u.definition.id));
  }, [unseenUnlocks, markUnseenAsSeen]);

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementWithState[]>();
    for (const a of achievements) {
      const cat = a.definition.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(a);
    }
    // Within each group: unlocked first, then by progress desc, then by tier asc
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        if (a.progressFraction !== b.progressFraction) return b.progressFraction - a.progressFraction;
        return a.definition.tier - b.definition.tier;
      });
    }
    return map;
  }, [achievements]);

  if (!vehicle) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Achievements" />
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div>
            <Trophy size={42} className="text-ios-gray dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-ios-gray dark:text-gray-400">
              Add a vehicle to start unlocking achievements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Achievements"
        subtitle={`${unlockedCount} of ${totalCount} unlocked`}
      />

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-8 space-y-5">
        {/* Overall progress */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r="26" className="stroke-gray-200 dark:stroke-white/10" strokeWidth="6" fill="none" />
                <circle
                  cx="32" cy="32" r="26"
                  className="stroke-ios-blue transition-all duration-700"
                  strokeWidth="6" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-ios-blue">{pct}%</span>
              </div>
            </div>
            <div>
              <p className="text-[15px] font-bold text-black dark:text-white">Trophy Case</p>
              <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5 leading-snug">
                Keep logging services, fuel, and reminders to unlock more.
              </p>
            </div>
          </div>
        </Card>

        {CATEGORY_ORDER.map((cat) => {
          const list = grouped.get(cat);
          if (!list || list.length === 0) return null;
          const unlockedInCat = list.filter((a) => a.unlocked).length;

          return (
            <section key={cat}>
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
                  {CATEGORY_LABELS[cat]}
                </p>
                <p className="text-[11px] font-medium text-ios-gray dark:text-gray-500">
                  {unlockedInCat} / {list.length}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {list.map((a) => (
                  <BadgeTile key={a.definition.id} state={a} onTap={() => setDetail(a)} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="pt-2">
          <Link to="/" className="block">
            <Button variant="secondary" fullWidth>Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {detail && <AchievementDetailModal state={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function BadgeTile({ state, onTap }: { state: AchievementWithState; onTap: () => void }) {
  const def = state.definition;
  const ring = TIER_RING[def.tier];

  return (
    <button
      onClick={onTap}
      className={`relative flex flex-col items-center text-center p-3 rounded-2xl border ${
        state.unlocked
          ? 'bg-white/60 dark:bg-white/[0.06] border-white/70 dark:border-white/[0.12]'
          : 'bg-gray-100/50 dark:bg-white/[0.03] border-gray-200/50 dark:border-white/[0.06]'
      } active:scale-[0.97] transition-transform`}
    >
      {state.isNew && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ios-red animate-dot-pulse" />
      )}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ring-2 ${
          state.unlocked
            ? `bg-white dark:bg-white/[0.08] ${ring}`
            : 'bg-gray-200/70 dark:bg-white/[0.04] ring-transparent'
        }`}
      >
        {state.unlocked ? (
          <span className="text-3xl leading-none" aria-hidden="true">{def.icon}</span>
        ) : (
          <Lock size={20} className="text-ios-gray dark:text-gray-500" />
        )}
      </div>
      <p className={`text-[11px] font-semibold leading-tight ${
        state.unlocked ? 'text-black dark:text-white' : 'text-ios-gray dark:text-gray-500'
      }`}>
        {def.title}
      </p>
      {!state.unlocked && state.progressLabel && (
        <p className="text-[10px] text-ios-gray dark:text-gray-500 mt-0.5">{state.progressLabel}</p>
      )}
    </button>
  );
}

function AchievementDetailModal({ state, onClose }: { state: AchievementWithState; onClose: () => void }) {
  const def = state.definition;
  const ring = TIER_RING[def.tier];
  const tierLabels = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm bg-white/85 dark:bg-[#0D1525]/95 backdrop-blur-2xl border border-white/70 dark:border-white/[0.12] rounded-3xl shadow-glass dark:shadow-glass-dark p-6 text-center animate-badge-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ring-4 ${
            state.unlocked
              ? `bg-white dark:bg-white/[0.08] ${ring}`
              : 'bg-gray-100 dark:bg-white/[0.04] ring-transparent'
          }`}
        >
          {state.unlocked ? (
            <span className="text-4xl leading-none" aria-hidden="true">{def.icon}</span>
          ) : (
            <Lock size={28} className="text-ios-gray dark:text-gray-500" />
          )}
        </div>
        <h2 className="text-xl font-bold text-black dark:text-white">{def.title}</h2>
        <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-500 uppercase tracking-wide mt-1">
          {tierLabels[def.tier]}
        </p>
        <p className="text-sm text-ios-gray dark:text-gray-400 mt-3 leading-relaxed">
          {def.description}
        </p>

        {state.unlocked ? (
          <p className="text-xs text-ios-green font-semibold mt-4">
            Unlocked {state.unlockedAt ? formatDate(state.unlockedAt) : ''}
          </p>
        ) : state.progressLabel ? (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-gray-200/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-ios-blue transition-all duration-500"
                style={{ width: `${Math.max(3, state.progressFraction * 100)}%` }}
              />
            </div>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-1.5">
              Progress: {state.progressLabel}
            </p>
          </div>
        ) : (
          <p className="text-xs text-ios-gray dark:text-gray-400 mt-4">Locked</p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-ios-blue text-white py-3 rounded-2xl font-semibold text-[15px] active:opacity-80"
        >
          Close
        </button>
      </div>
    </div>
  );
}
