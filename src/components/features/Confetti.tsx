import { useMemo } from 'react';

const COLORS = ['#34C759', '#007AFF', '#FF9500', '#FFCC00', '#AF52DE', '#FF3B30'];
const COUNT = 40;

/**
 * Pure-CSS confetti burst — pieces explode from the centre, drift outward,
 * fall, rotate, and fade. One-shot: re-mount the component to replay.
 */
export default function Confetti() {
  const pieces = useMemo(() => {
    return Array.from({ length: COUNT }).map((_, i) => {
      const angle = (i / COUNT) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.6;
      const distance = 110 + Math.random() * 160;
      const dx = Math.cos(angle + jitter) * distance;
      // Bias the vertical end position downward so pieces fall under gravity.
      const dy = Math.sin(angle + jitter) * distance + 180 + Math.random() * 60;
      const rot = Math.random() * 900 - 450;
      const delay = Math.random() * 120;
      const size = 6 + Math.random() * 6;
      const color = COLORS[i % COLORS.length];
      return { dx, dy, rot, delay, size, color };
    });
  }, []);

  return (
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
            backgroundColor: p.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
