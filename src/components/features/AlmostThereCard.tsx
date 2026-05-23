import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Target } from 'lucide-react';
import Card from '../ui/Card';
import type { AchievementWithState } from '../../hooks/useAchievements';

interface Props {
  achievements: AchievementWithState[];
  /** Minimum progress fraction to be shown (0..1). */
  minProgress?: number;
  /** Maximum number of in-progress badges to display. */
  limit?: number;
}

const TIER_RING: Record<number, string> = {
  1: 'ring-ios-blue/30',
  2: 'ring-ios-green/40',
  3: 'ring-ios-orange/50',
  4: 'ring-purple-400/60',
};

export default function AlmostThereCard({
  achievements,
  minProgress = 0.2,
  limit = 3,
}: Props) {
  const closest = useMemo(() => {
    return achievements
      .filter((a) => !a.unlocked && !a.definition.hidden && a.progressFraction >= minProgress)
      .sort((a, b) => b.progressFraction - a.progressFraction)
      .slice(0, limit);
  }, [achievements, minProgress, limit]);

  if (closest.length === 0) return null;

  return (
    <Card padding={false} className="overflow-hidden">
      <Link to="/achievements" className="block p-4 active:opacity-80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-ios-blue" />
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
              Almost There
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
        </div>

        <div className="space-y-3">
          {closest.map((a) => {
            const def = a.definition;
            const pct = Math.round(a.progressFraction * 100);
            return (
              <div key={def.id} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 flex-shrink-0 rounded-full bg-white dark:bg-white/[0.06] flex items-center justify-center ring-2 ${TIER_RING[def.tier]}`}
                >
                  <span className="text-xl leading-none" aria-hidden="true">{def.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                      {def.title}
                    </p>
                    <span className="text-[11px] font-medium text-ios-gray dark:text-gray-400 flex-shrink-0">
                      {a.progressLabel ?? `${pct}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-200/60 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-ios-blue transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Link>
    </Card>
  );
}
