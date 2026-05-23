import { Link } from 'react-router-dom';
import { ChevronRight, Pin } from 'lucide-react';
import Card from '../ui/Card';
import type { AchievementWithState } from '../../hooks/useAchievements';

interface Props {
  pinned: AchievementWithState[];
  /** Whether the user has any unlocked badges at all — controls the empty-state copy. */
  hasAnyUnlocked: boolean;
}

const TIER_RING: Record<number, string> = {
  1: 'ring-ios-blue/30',
  2: 'ring-ios-green/40',
  3: 'ring-ios-orange/50',
  4: 'ring-purple-400/60',
};

/**
 * Dashboard "Showcase" — three slots displaying the user's pinned achievements.
 * Empty slots prompt the user to pin badges from the Achievements page.
 */
export default function ShowcaseCard({ pinned, hasAnyUnlocked }: Props) {
  // Only render when there's something to showcase OR there are unlocked badges
  // to suggest pinning. Don't show during the "no unlocks yet" early game —
  // would be confusing and empty.
  if (pinned.length === 0 && !hasAnyUnlocked) return null;

  const slots: (AchievementWithState | null)[] = [
    pinned[0] ?? null,
    pinned[1] ?? null,
    pinned[2] ?? null,
  ];

  return (
    <Card padding={false} className="overflow-hidden">
      <Link to="/achievements" className="block p-4 active:opacity-80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pin size={13} className="text-ios-orange" />
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
              Showcase
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {slots.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {s ? (
                <>
                  <div
                    className={`w-14 h-14 rounded-full bg-white dark:bg-white/[0.08] flex items-center justify-center ring-2 ${TIER_RING[s.definition.tier]}`}
                  >
                    <span className="text-3xl leading-none" aria-hidden="true">{s.definition.icon}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-black dark:text-white mt-1.5 leading-tight line-clamp-2">
                    {s.definition.title}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-white/[0.12] flex items-center justify-center">
                    <Pin size={16} className="text-gray-300 dark:text-white/20" />
                  </div>
                  <p className="text-[10px] text-ios-gray dark:text-gray-500 mt-1.5 leading-tight">
                    Pin a badge
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </Link>
    </Card>
  );
}
