import type { HealthScoreSnapshot } from '../../models';

interface Props {
  snapshots: HealthScoreSnapshot[];
  /** Logical width — coordinates inside the viewBox. Renders at 100% of parent. */
  width: number;
  height: number;
  showArea?: boolean;
  showDot?: boolean;
  showYAxis?: boolean;
  /** Stroke colour. Defaults to the active accent. */
  strokeClass?: string;
  /** Fill colour for the area. Defaults to the active accent at 15%. */
  fillClass?: string;
}

/**
 * Pure-SVG sparkline of vehicle-health snapshots over time. Renders nothing
 * if fewer than two data points exist (no meaningful "trend" yet).
 */
export default function HealthSparkline({
  snapshots,
  width,
  height,
  showArea = false,
  showDot = true,
  showYAxis = false,
  strokeClass = 'stroke-ios-blue',
  fillClass = 'fill-ios-blue',
}: Props) {
  if (snapshots.length < 2) return null;

  // Defensive: ensure ascending date order (DB doesn't guarantee).
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

  const firstMs = new Date(sorted[0].date).getTime();
  const lastMs  = new Date(sorted[sorted.length - 1].date).getTime();
  const spanMs  = Math.max(1, lastMs - firstMs);

  const padY = showYAxis ? 10 : 2;
  const padX = showYAxis ? 18 : 1;

  const points = sorted.map((s) => {
    const t = (new Date(s.date).getTime() - firstMs) / spanMs;
    const x = padX + t * (width - 2 * padX);
    const y = height - padY - (s.score / 100) * (height - 2 * padY);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaD = showArea
    ? `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${height - padY} L ${points[0].x.toFixed(2)} ${height - padY} Z`
    : null;

  const last = points[points.length - 1];

  const yTicks = [0, 50, 100];

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {showYAxis &&
        yTicks.map((tick) => {
          const y = height - padY - (tick / 100) * (height - 2 * padY);
          return (
            <g key={tick}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                className="stroke-gray-200 dark:stroke-white/[0.06]"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={padX - 4}
                y={y + 3}
                fontSize="8"
                textAnchor="end"
                className="fill-ios-gray dark:fill-gray-500"
              >
                {tick}
              </text>
            </g>
          );
        })}
      {areaD && <path d={areaD} className={fillClass} fillOpacity="0.18" />}
      <path
        d={pathD}
        fill="none"
        className={strokeClass}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && last && (
        <circle cx={last.x} cy={last.y} r="2.2" className={fillClass} />
      )}
    </svg>
  );
}
