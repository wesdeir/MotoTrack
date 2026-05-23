import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import { Lock, Pin, PinOff, Trophy } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAchievements, PIN_LIMIT, type AchievementWithState } from '../hooks/useAchievements';
import { useVehicle } from '../hooks/useVehicle';
import { useTutorialHighlight } from '../hooks/useTutorialHighlight';
import { formatDate } from '../utils/formatters';
import { CHAINS, type AchievementCategory } from '../utils/achievements';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  service:    'Service',
  fuel:       'Fuel',
  reminders:  'Reminders',
  docs:       'Documents',
  milestone:  'Milestones',
  mastery:    'Mastery',
  streak:     'Streaks',
  health:     'Health',
  secret:     'Secret',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'service', 'fuel', 'reminders', 'docs', 'milestone', 'mastery', 'streak', 'health', 'secret',
];

const TIER_RING: Record<number, string> = {
  1: 'ring-ios-blue/30',
  2: 'ring-ios-green/40',
  3: 'ring-ios-orange/50',
  4: 'ring-purple-400/60',
};

type FilterMode = 'all' | 'unlocked' | 'in-progress' | 'locked';
type SortMode = 'category' | 'chains' | 'newest' | 'closest' | 'tier';

const FILTER_LABELS: Record<FilterMode, string> = {
  all:           'All',
  unlocked:      'Unlocked',
  'in-progress': 'In Progress',
  locked:        'Locked',
};

const SORT_LABELS: Record<SortMode, string> = {
  category: 'Category',
  chains:   'Chains',
  newest:   'Newest',
  closest:  'Closest',
  tier:     'Tier',
};

export default function AchievementsPage() {
  const { vehicle } = useVehicle();
  const {
    achievements,
    unlockedCount,
    totalCount,
    unseenUnlocks,
    totalXp,
    maxXp,
    levelInfo,
    pinnedAchievements,
    markUnseenAsSeen,
    togglePin,
  } = useAchievements();
  const [detail, setDetail] = useState<AchievementWithState | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('category');

  // Visiting this page counts as seeing the unseen unlocks — clear the "new" indicator.
  useEffect(() => {
    if (unseenUnlocks.length === 0) return;
    markUnseenAsSeen(unseenUnlocks.map((u) => u.definition.id));
  }, [unseenUnlocks, markUnseenAsSeen]);

  const filtered = useMemo(
    () =>
      achievements.filter((a) => {
        if (filter === 'unlocked') return a.unlocked;
        if (filter === 'locked') return !a.unlocked;
        if (filter === 'in-progress') {
          return !a.unlocked && !a.definition.hidden && a.progressFraction > 0;
        }
        return true;
      }),
    [achievements, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementWithState[]>();
    for (const a of filtered) {
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
  }, [filtered]);

  const sortedFlat = useMemo(() => {
    if (sort === 'category') return [];
    const arr = [...filtered];
    if (sort === 'newest') {
      arr.sort((a, b) => {
        const aT = a.unlockedAt ? new Date(a.unlockedAt).getTime() : -Infinity;
        const bT = b.unlockedAt ? new Date(b.unlockedAt).getTime() : -Infinity;
        return bT - aT;
      });
    } else if (sort === 'closest') {
      arr.sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
        return b.progressFraction - a.progressFraction;
      });
    } else if (sort === 'tier') {
      arr.sort((a, b) => {
        if (a.definition.tier !== b.definition.tier) return b.definition.tier - a.definition.tier;
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return b.progressFraction - a.progressFraction;
      });
    }
    return arr;
  }, [filtered, sort]);

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
  const levelPct = Math.round(levelInfo.progressFraction * 100);
  const atMaxLevel = levelInfo.xpForNextLevel == null;
  const levelHighlight = useTutorialHighlight('level-card');

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Achievements"
        subtitle={`Level ${levelInfo.level} • ${unlockedCount} of ${totalCount} unlocked`}
      />

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-8 space-y-5">
        {/* Level + overall progress */}
        <Card className={levelHighlight}>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-ios-gray dark:text-gray-400 leading-none">LVL</span>
                <span className="text-lg font-bold text-ios-blue leading-none mt-0.5">{levelInfo.level}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-black dark:text-white truncate">{levelInfo.title}</p>
              <p className="text-[11px] text-ios-gray dark:text-gray-400 mt-0.5">
                {atMaxLevel
                  ? `${totalXp} / ${maxXp} XP — max level reached`
                  : `${totalXp} XP • ${(levelInfo.xpForNextLevel ?? 0) - levelInfo.xpIntoLevel} to ${levelInfo.nextTitle}`}
              </p>
              <div className="mt-2 h-2 rounded-full bg-gray-200/60 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-ios-blue transition-all duration-500"
                  style={{ width: `${atMaxLevel ? 100 : Math.max(3, levelPct)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Filter + sort bar */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {(Object.keys(FILTER_LABELS) as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-ios-blue text-white'
                    : 'bg-gray-100 text-ios-gray dark:bg-white/[0.08] dark:text-gray-400 active:opacity-70'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[12px] font-semibold text-ios-blue ml-auto">
            <span className="text-ios-gray dark:text-gray-500 font-medium">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="bg-transparent text-ios-blue pr-1 py-1 focus:outline-none cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
                <option key={s} value={s}>{SORT_LABELS[s]}</option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-ios-gray dark:text-gray-400">
              No achievements match this filter.
            </p>
          </Card>
        ) : sort === 'category' ? (
          CATEGORY_ORDER.map((cat) => {
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
          })
        ) : sort === 'chains' ? (
          <ChainsView achievements={filtered} onTap={setDetail} />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {sortedFlat.map((a) => (
              <BadgeTile key={a.definition.id} state={a} onTap={() => setDetail(a)} />
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link to="/" className="block">
            <Button variant="secondary" fullWidth>Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {detail && (
        <AchievementDetailModal
          state={detail}
          pinnedCount={pinnedAchievements.length}
          onTogglePin={() => togglePin(detail.definition.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/**
 * Renders achievements grouped into visual progression chains. Each chain shows
 * its links as a horizontal sequence — unlocked badges in colour, locked ones
 * ghosted, the "next to unlock" highlighted with a glow ring.
 *
 * Hidden achievements are filtered out (they live in `secret` category, which
 * doesn't have a chain anyway). Chains with fewer than 2 visible links are
 * skipped — a "chain" of one isn't a chain.
 */
function ChainsView({
  achievements,
  onTap,
}: {
  achievements: AchievementWithState[];
  onTap: (a: AchievementWithState) => void;
}) {
  const chains = CHAINS.map((chain) => {
    const links = achievements
      .filter(
        (a) =>
          a.definition.chainId === chain.id &&
          !(a.definition.hidden && !a.unlocked),
      )
      .sort(
        (a, b) =>
          (a.definition.chainOrder ?? 0) - (b.definition.chainOrder ?? 0),
      );
    return {
      chain,
      links,
      unlockedCount: links.filter((l) => l.unlocked).length,
    };
  }).filter((c) => c.links.length >= 2);

  if (chains.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-ios-gray dark:text-gray-400">
          No chains match this filter.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {chains.map(({ chain, links, unlockedCount }) => {
        const allUnlocked = unlockedCount === links.length;
        const nextIndex = links.findIndex((l) => !l.unlocked);
        return (
          <Card key={chain.id}>
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-black dark:text-white">
                  {chain.title}
                </p>
                <p className="text-[11px] text-ios-gray dark:text-gray-400 leading-snug mt-0.5">
                  {chain.description}
                </p>
              </div>
              <div className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                allUnlocked
                  ? 'bg-ios-green/15 text-ios-green'
                  : 'bg-gray-100 dark:bg-white/[0.08] text-ios-gray dark:text-gray-400'
              }`}>
                {unlockedCount} / {links.length}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {links.map((link, i) => {
                const isNext = !link.unlocked && i === nextIndex;
                const prevUnlocked = i > 0 && links[i - 1].unlocked;
                const ring = TIER_RING[link.definition.tier];
                return (
                  <Fragment key={link.definition.id}>
                    {i > 0 && (
                      <div className="flex-1 min-w-[10px] h-0.5 rounded-full overflow-hidden bg-gray-200 dark:bg-white/[0.08]">
                        {prevUnlocked && (
                          <div
                            className={`h-full transition-all duration-500 ${
                              link.unlocked ? 'bg-ios-green w-full' : 'bg-ios-green/60 w-1/2'
                            }`}
                          />
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => onTap(link)}
                      className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ring-2 active:scale-95 transition-transform ${
                        link.unlocked
                          ? `bg-white dark:bg-white/[0.08] ${ring}`
                          : isNext
                          ? 'bg-blue-50 dark:bg-ios-blue/[0.10] ring-ios-blue shadow-ios-glow'
                          : 'bg-gray-100 dark:bg-white/[0.04] ring-transparent'
                      }`}
                      aria-label={link.definition.title}
                    >
                      {link.unlocked ? (
                        <span className="text-xl leading-none" aria-hidden="true">
                          {link.definition.icon}
                        </span>
                      ) : (
                        <Lock size={14} className={isNext ? 'text-ios-blue' : 'text-ios-gray dark:text-gray-500'} />
                      )}
                    </button>
                  </Fragment>
                );
              })}
            </div>

            {/* Next-to-unlock hint */}
            {!allUnlocked && nextIndex >= 0 && (
              <p className="text-[11px] text-ios-gray dark:text-gray-400 mt-2.5 leading-snug">
                <span className="text-ios-blue font-semibold">Next:</span>{' '}
                {links[nextIndex].definition.title}
                {links[nextIndex].progressLabel ? ` (${links[nextIndex].progressLabel})` : ''}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function BadgeTile({ state, onTap }: { state: AchievementWithState; onTap: () => void }) {
  const def = state.definition;
  const ring = TIER_RING[def.tier];
  const isHidden = !state.unlocked && def.hidden === true;
  const displayTitle = isHidden ? '???' : def.title;

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
      {state.pinned && (
        <span
          className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-ios-orange/95 flex items-center justify-center shadow-sm"
          title="Pinned to Showcase"
        >
          <Pin size={9} className="text-white" strokeWidth={3} />
        </span>
      )}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ring-2 ${
          state.unlocked
            ? state.pinned
              ? 'bg-white dark:bg-white/[0.08] ring-ios-orange/70'
              : `bg-white dark:bg-white/[0.08] ${ring}`
            : 'bg-gray-200/70 dark:bg-white/[0.04] ring-transparent'
        }`}
      >
        {state.unlocked ? (
          <span className="text-3xl leading-none" aria-hidden="true">{def.icon}</span>
        ) : isHidden ? (
          <span className="text-2xl font-bold text-ios-gray dark:text-gray-500" aria-hidden="true">?</span>
        ) : (
          <Lock size={20} className="text-ios-gray dark:text-gray-500" />
        )}
      </div>
      <p className={`text-[11px] font-semibold leading-tight ${
        state.unlocked ? 'text-black dark:text-white' : 'text-ios-gray dark:text-gray-500'
      }`}>
        {displayTitle}
      </p>
      {!state.unlocked && !isHidden && state.progressLabel && (
        <p className="text-[10px] text-ios-gray dark:text-gray-500 mt-0.5">{state.progressLabel}</p>
      )}
    </button>
  );
}

function AchievementDetailModal({
  state,
  pinnedCount,
  onTogglePin,
  onClose,
}: {
  state: AchievementWithState;
  pinnedCount: number;
  onTogglePin: () => void;
  onClose: () => void;
}) {
  const def = state.definition;
  const ring = TIER_RING[def.tier];
  const tierLabels = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];
  const isHidden = !state.unlocked && def.hidden === true;
  const displayTitle = isHidden ? '???' : def.title;
  const displayDescription = isHidden
    ? 'Hidden achievement — keep exploring to discover it.'
    : def.description;

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
          ) : isHidden ? (
            <span className="text-4xl font-bold text-ios-gray dark:text-gray-500" aria-hidden="true">?</span>
          ) : (
            <Lock size={28} className="text-ios-gray dark:text-gray-500" />
          )}
        </div>
        <h2 className="text-xl font-bold text-black dark:text-white">{displayTitle}</h2>
        <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-500 uppercase tracking-wide mt-1">
          {isHidden ? 'Secret' : tierLabels[def.tier]}
        </p>
        <p className="text-sm text-ios-gray dark:text-gray-400 mt-3 leading-relaxed">
          {displayDescription}
        </p>

        {state.unlocked ? (
          <p className="text-xs text-ios-green font-semibold mt-4">
            Unlocked {state.unlockedAt ? formatDate(state.unlockedAt) : ''}
          </p>
        ) : isHidden ? (
          <p className="text-xs text-ios-gray dark:text-gray-400 mt-4">Locked</p>
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

        {state.unlocked && (
          <button
            onClick={onTogglePin}
            className={`mt-6 w-full py-3 rounded-2xl font-semibold text-[15px] active:opacity-80 flex items-center justify-center gap-2 ${
              state.pinned
                ? 'bg-yellow-50 text-ios-orange dark:bg-ios-orange/10'
                : 'bg-gray-100 dark:bg-white/[0.08] text-black dark:text-white'
            }`}
          >
            {state.pinned ? (
              <>
                <PinOff size={16} /> Unpin from Showcase
              </>
            ) : (
              <>
                <Pin size={16} />
                {pinnedCount >= PIN_LIMIT
                  ? `Pin (replaces oldest of ${PIN_LIMIT})`
                  : `Pin to Showcase`}
              </>
            )}
          </button>
        )}
        <button
          onClick={onClose}
          className={`${state.unlocked ? 'mt-2' : 'mt-6'} w-full bg-ios-blue text-white py-3 rounded-2xl font-semibold text-[15px] active:opacity-80`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
