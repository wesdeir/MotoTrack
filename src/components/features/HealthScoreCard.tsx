import { useState } from 'react';
import { ChevronRight, Heart, X } from 'lucide-react';
import Card from '../ui/Card';
import type { HealthScore, HealthTier } from '../../utils/healthScore';

const TIER_STYLES: Record<HealthTier, { ring: string; text: string; bg: string; chip: string }> = {
  excellent: {
    ring: 'stroke-ios-green',
    text: 'text-ios-green',
    bg:   'bg-green-50 dark:bg-ios-green/10',
    chip: 'bg-ios-green/15 text-ios-green',
  },
  good: {
    ring: 'stroke-ios-blue',
    text: 'text-ios-blue',
    bg:   'bg-blue-50 dark:bg-ios-blue/10',
    chip: 'bg-ios-blue/15 text-ios-blue',
  },
  fair: {
    ring: 'stroke-ios-orange',
    text: 'text-ios-orange',
    bg:   'bg-orange-50 dark:bg-ios-orange/10',
    chip: 'bg-ios-orange/15 text-ios-orange',
  },
  critical: {
    ring: 'stroke-ios-red',
    text: 'text-ios-red',
    bg:   'bg-red-50 dark:bg-ios-red/10',
    chip: 'bg-ios-red/15 text-ios-red',
  },
};

interface Props {
  score: HealthScore;
}

export default function HealthScoreCard({ score }: Props) {
  const [open, setOpen] = useState(false);
  const style = TIER_STYLES[score.tier];

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score.total / 100) * circumference;

  return (
    <>
      <Card onClick={() => setOpen(true)} className="relative">
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle
                cx="36" cy="36" r={radius}
                className="stroke-gray-200 dark:stroke-white/10"
                strokeWidth="6" fill="none"
              />
              <circle
                cx="36" cy="36" r={radius}
                className={`${style.ring} transition-all duration-700 ease-out`}
                strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${style.text} leading-none`}>{score.total}</span>
              <span className="text-[9px] font-medium text-ios-gray dark:text-gray-400 mt-0.5">/ 100</span>
            </div>
          </div>

          {/* Label + hint */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Heart size={13} className={style.text} fill="currentColor" />
              <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
                Vehicle Health
              </p>
            </div>
            <p className={`text-lg font-bold mt-0.5 ${style.text}`}>
              {score.tierLabel}
            </p>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-1 leading-snug line-clamp-2">
              {score.topHint}
            </p>
          </div>

          <ChevronRight size={18} className="text-gray-300 dark:text-white/25 flex-shrink-0" />
        </div>
      </Card>

      {open && <HealthScoreModal score={score} onClose={() => setOpen(false)} />}
    </>
  );
}

function HealthScoreModal({ score, onClose }: { score: HealthScore; onClose: () => void }) {
  const style = TIER_STYLES[score.tier];
  const categories = [
    score.categories.reminders,
    score.categories.activity,
    score.categories.engagement,
    score.categories.documentation,
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative bg-white/50 backdrop-blur-2xl border-t border-x border-white/70 shadow-glass dark:bg-[#080E1C]/80 dark:border-white/[0.12] dark:shadow-glass-dark rounded-t-3xl animate-slide-up flex flex-col"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/[0.15]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.08] flex-shrink-0">
          <h2 className="text-lg font-bold text-black dark:text-white">Vehicle Health</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.10] flex items-center justify-center"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-area px-5 py-4">
          {/* Big score */}
          <div className="flex flex-col items-center pb-4">
            <div className={`text-5xl font-bold ${style.text} leading-none`}>{score.total}</div>
            <div className={`text-sm font-semibold mt-2 px-3 py-1 rounded-full ${style.chip}`}>
              {score.tierLabel}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = (cat.score / cat.max) * 100;
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-black dark:text-white">{cat.label}</p>
                    <p className="text-xs font-medium text-ios-gray dark:text-gray-400">
                      {cat.score} / {cat.max}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200/60 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-ios-green'
                        : pct >= 50 ? 'bg-ios-blue'
                        : pct >= 25 ? 'bg-ios-orange'
                        : 'bg-ios-red'
                      }`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  {cat.hint && (
                    <p className="text-xs text-ios-gray dark:text-gray-400 mt-1.5 leading-snug">
                      {cat.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-ios-gray dark:text-gray-500 mt-5 leading-relaxed">
            Score updates automatically as you log services, manage reminders, and add documents.
          </p>
        </div>
      </div>
    </div>
  );
}
