import { useMemo } from 'react';

const COLORS_FULL = ['#34C759', '#007AFF', '#FF9500', '#FFCC00', '#AF52DE', '#FF3B30'];
// Two-color palette used for tier-2 bursts.
const COLORS_DUO = ['#007AFF', '#FFCC00'];

interface TierConfig {
  count: number;
  distanceBase: number;
  distanceJitter: number;
  fallBias: number;
  durationMs: number;
  palette: string[] | 'accent';
  showFlash: boolean;
}

const TIER_CONFIG: Record<number, TierConfig> = {
  1: { count: 12, distanceBase: 70,  distanceJitter: 80,  fallBias: 120, durationMs: 800,  palette: 'accent', showFlash: false },
  2: { count: 24, distanceBase: 90,  distanceJitter: 110, fallBias: 150, durationMs: 1200, palette: COLORS_DUO, showFlash: false },
  3: { count: 40, distanceBase: 110, distanceJitter: 160, fallBias: 180, durationMs: 1600, palette: COLORS_FULL, showFlash: false },
  4: { count: 60, distanceBase: 130, distanceJitter: 190, fallBias: 220, durationMs: 2000, palette: COLORS_FULL, showFlash: true },
};

interface Props {
  /** Achievement tier (1-4) — drives count, palette, duration, and screen flash. */
  tier?: 1 | 2 | 3 | 4;
}

/**
 * Pure-CSS confetti burst — pieces explode from the centre, drift outward,
 * fall, rotate, and fade. Scaled per tier. One-shot: re-mount to replay.
 */
export default function Confetti({ tier = 3 }: Props) {
  const cfg = TIER_CONFIG[tier];

  const pieces = useMemo(() => {
    return Array.from({ length: cfg.count }).map((_, i) => {
      const angle = (i / cfg.count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.6;
      const distance = cfg.distanceBase + Math.random() * cfg.distanceJitter;
      const dx = Math.cos(angle + jitter) * distance;
      const dy = Math.sin(angle + jitter) * distance + cfg.fallBias + Math.random() * 60;
      const rot = Math.random() * 900 - 450;
      const delay = Math.random() * Math.min(150, cfg.durationMs / 8);
      const size = 5 + Math.random() * 6;
      const color =
        cfg.palette === 'accent'
          ? 'rgb(var(--tw-accent-rgb))'
          : cfg.palette[i % cfg.palette.length];
      return { dx, dy, rot, delay, size, color };
    });
  }, [cfg]);

  return (
    <>
      {cfg.showFlash && (
        <div
          className="pointer-events-none absolute inset-0 bg-white/30 dark:bg-white/15 animate-screen-flash"
          aria-hidden="true"
        />
      )}
      <div className="pointer-events-none absolute inset-0 overflow-visible flex items-center justify-center">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rot}deg`,
              width: `${p.size}px`,
              height: `${p.size * 1.6}px`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${cfg.durationMs}ms`,
              backgroundColor: p.color,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
