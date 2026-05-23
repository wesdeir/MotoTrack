import { forwardRef } from 'react';
import type { Vehicle } from '../../models';
import type { AchievementWithState } from '../../hooks/useAchievements';
import type { LevelInfo } from '../../utils/achievements';

interface Props {
  vehicle: Vehicle;
  achievements: AchievementWithState[];
  unlockedCount: number;
  totalCount: number;
  totalXp: number;
  levelInfo: LevelInfo;
}

const TIER_RING: Record<number, string> = {
  1: 'ring-ios-blue/40',
  2: 'ring-ios-green/50',
  3: 'ring-ios-orange/60',
  4: 'ring-purple-400/70',
};

/**
 * Off-screen render target for trophy-case PNG export. Designed for capture
 * by html2canvas (clean layout, branded, no interactive elements). Caller
 * renders this with a wrapper that positions it off-screen, captures it,
 * then unmounts.
 *
 * Width is fixed at 600px (logical); html2canvas scale=2 outputs 1200px wide.
 */
const TrophyShareCard = forwardRef<HTMLDivElement, Props>(function TrophyShareCard(
  { vehicle, achievements, unlockedCount, totalCount, totalXp, levelInfo },
  ref,
) {
  // Pick the top 12 most prestigious unlocked badges: highest tier first,
  // then most recently unlocked.
  const showcased = achievements
    .filter((a) => a.unlocked && !a.definition.hidden)
    .sort((a, b) => {
      if (a.definition.tier !== b.definition.tier) return b.definition.tier - a.definition.tier;
      const aT = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const bT = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return bT - aT;
    })
    .slice(0, 12);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = totalCount > 0 ? unlockedCount / totalCount : 0;

  return (
    <div
      ref={ref}
      className="text-white"
      style={{
        width: '600px',
        background: 'linear-gradient(140deg, #1a2543 0%, #080E1C 60%, #131c34 100%)',
        padding: '40px 36px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }} aria-hidden="true">🏁</span>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>MotoTrack</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.55)' }}>
          TROPHY CASE
        </div>
      </div>

      {/* Vehicle line */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
          {vehicle.year} {vehicle.make}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -0.5 }}>
          {vehicle.nickname}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
          {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ''}
        </div>
      </div>

      {/* Level block */}
      <div
        style={{
          marginTop: 28,
          padding: 24,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
            <circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke="rgb(80, 133, 224)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(pct) * circumference} ${circumference}`}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>LVL</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'rgb(80, 133, 224)', marginTop: 2, lineHeight: 1 }}>{levelInfo.level}</div>
          </div>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>{levelInfo.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            {totalXp} XP · {unlockedCount} of {totalCount} badges
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 14 }}>
          {showcased.length > 0 ? 'Top Unlocks' : 'No unlocks yet — get logging.'}
        </div>
        {showcased.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {showcased.map((a) => {
              const ringClass = TIER_RING[a.definition.tier];
              return (
                <div
                  key={a.definition.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <div
                    className={ringClass}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: tierGlow(a.definition.tier),
                    }}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">{a.definition.icon}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.80)', marginTop: 6, lineHeight: 1.2, minHeight: 22 }}>
                    {a.definition.title}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
          {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.06em' }}>
          mototrack
        </div>
      </div>
    </div>
  );
});

export default TrophyShareCard;

function tierGlow(tier: number): string {
  switch (tier) {
    case 4: return '0 0 18px rgba(168, 85, 247, 0.55), inset 0 0 0 2px rgba(168, 85, 247, 0.55)';
    case 3: return '0 0 14px rgba(249, 115, 22, 0.45), inset 0 0 0 2px rgba(249, 115, 22, 0.45)';
    case 2: return 'inset 0 0 0 2px rgba(52, 199, 89, 0.40)';
    default: return 'inset 0 0 0 2px rgba(80, 133, 224, 0.30)';
  }
}
