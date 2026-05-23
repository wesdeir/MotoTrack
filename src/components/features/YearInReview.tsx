import { useEffect, useState } from 'react';
import { ChevronRight, X, Trophy, Wrench, Droplets, Gauge, Sparkles } from 'lucide-react';
import { formatCurrency, formatOdometer, formatLPer100km } from '../../utils/formatters';
import Confetti from './Confetti';
import type { YearStats } from '../../utils/yearStats';

interface Props {
  stats: YearStats;
  onClose: () => void;
}

/**
 * Spotify-Wrapped-style year-in-review for a single vehicle. Tap anywhere to
 * advance, X to close at any time. Each slide is a single hero stat.
 */
export default function YearInReview({ stats, onClose }: Props) {
  const slides = buildSlides(stats);
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  // Lock scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const advance = () => {
    if (isLast) onClose();
    else setIndex((i) => i + 1);
  };

  const slide = slides[index];

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      onClick={advance}
      style={{
        background: `linear-gradient(135deg, ${slide.bg.from} 0%, ${slide.bg.to} 100%)`,
      }}
    >
      {/* Top bar: progress segments + close */}
      <div
        className="flex items-center gap-2 px-4 pb-3 flex-shrink-0"
        style={{ paddingTop: `calc(0.75rem + var(--safe-top))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full overflow-hidden bg-white/25"
            >
              <div
                className={`h-full bg-white transition-all ${
                  i < index ? 'w-full' : i === index ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Slide body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-white animate-fade-in" key={index}>
        {slide.headline && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 mb-3">
            {slide.headline}
          </p>
        )}
        {slide.icon}
        <div className="text-6xl font-black tracking-tight tabular-nums leading-none mt-2">
          {slide.value}
        </div>
        {slide.unit && (
          <div className="text-sm font-semibold text-white/80 mt-2 uppercase tracking-wide">
            {slide.unit}
          </div>
        )}
        <p className="text-base text-white/90 leading-relaxed mt-6 max-w-xs">
          {slide.subtitle}
        </p>
      </div>

      {/* Bottom action */}
      <div
        className="px-6 pb-8 flex items-center justify-center"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); advance(); }}
          className="px-6 py-3 rounded-full bg-white text-black text-[15px] font-bold flex items-center gap-2 active:scale-95 transition"
        >
          {isLast ? 'Done' : 'Next'}
          {!isLast && <ChevronRight size={18} />}
        </button>
      </div>

      {/* Confetti on the achievements slide and the wrap-up slide */}
      {slide.confetti && <Confetti key={`yir-${index}`} tier={4} />}
    </div>
  );
}

// ------------------------------------------------------------------------

interface Slide {
  headline?: string;
  icon?: React.ReactNode;
  value: string;
  unit?: string;
  subtitle: string;
  bg: { from: string; to: string };
  confetti?: boolean;
}

function buildSlides(stats: YearStats): Slide[] {
  const slides: Slide[] = [];

  // Slide 1 — intro
  slides.push({
    headline: 'Your year in numbers',
    value: String(stats.year),
    subtitle: `A look back at ${stats.vehicleNickname} this year.`,
    bg: { from: 'rgb(99, 102, 241)', to: 'rgb(79, 70, 229)' },
  });

  // Slide 2 — distance
  if (stats.kmDriven > 0) {
    slides.push({
      headline: 'On the road',
      icon: <Gauge size={36} className="text-white/90 mb-2" />,
      value: formatOdometer(stats.kmDriven).replace(/\s*km$/i, ''),
      unit: 'kilometres driven',
      subtitle: kmFunFact(stats.kmDriven),
      bg: { from: 'rgb(34, 197, 94)', to: 'rgb(20, 145, 70)' },
    });
  }

  // Slide 3 — fuel
  if (stats.fuelCount > 0) {
    slides.push({
      headline: 'Fuel',
      icon: <Droplets size={36} className="text-white/90 mb-2" />,
      value: `${stats.fuelCount}`,
      unit: stats.fuelCount === 1 ? 'fill-up' : 'fill-ups',
      subtitle:
        `${formatCurrency(stats.fuelSpend)} spent` +
        (stats.avgLPer100km != null ? ` · avg ${formatLPer100km(stats.avgLPer100km)}` : ''),
      bg: { from: 'rgb(14, 165, 233)', to: 'rgb(2, 132, 199)' },
    });
  }

  // Slide 4 — maintenance
  if (stats.serviceCount > 0) {
    slides.push({
      headline: 'Maintenance',
      icon: <Wrench size={36} className="text-white/90 mb-2" />,
      value: `${stats.serviceCount}`,
      unit: stats.serviceCount === 1 ? 'service' : 'services',
      subtitle:
        `${formatCurrency(stats.maintenanceSpend)} invested` +
        (stats.topCategory ? ` · most logged: ${stats.topCategory.label}` : ''),
      bg: { from: 'rgb(249, 115, 22)', to: 'rgb(217, 70, 30)' },
    });
  }

  // Slide 5 — achievements
  if (stats.newAchievementCount > 0) {
    slides.push({
      headline: 'Achievements',
      icon: <Trophy size={36} className="text-white/90 mb-2" />,
      value: `${stats.newAchievementCount}`,
      unit: stats.newAchievementCount === 1 ? 'badge unlocked' : 'badges unlocked',
      subtitle: stats.topAchievementTitle
        ? `Top unlock: ${stats.topAchievementIcon ?? ''} ${stats.topAchievementTitle}`
        : 'Keep logging and chasing milestones.',
      bg: { from: 'rgb(168, 85, 247)', to: 'rgb(126, 34, 206)' },
      confetti: true,
    });
  }

  // Final wrap
  slides.push({
    headline: `${stats.year} wrapped`,
    icon: <Sparkles size={36} className="text-white/90 mb-2" />,
    value: `${stats.totalLogs}`,
    unit: stats.totalLogs === 1 ? 'log entry' : 'log entries',
    subtitle: `Total activity for ${stats.vehicleNickname} in ${stats.year}. Here's to the next one.`,
    bg: { from: 'rgb(236, 72, 153)', to: 'rgb(190, 24, 93)' },
    confetti: true,
  });

  return slides;
}

function kmFunFact(km: number): string {
  // Compare to common reference distances. Picks the most relatable one.
  const TORONTO_VANCOUVER = 4400; // km
  const TORONTO_MONTREAL = 540;
  const EARTH_CIRCUMFERENCE = 40_075;
  const MOON = 384_400;

  if (km >= MOON / 4) {
    const pct = ((km / MOON) * 100).toFixed(0);
    return `That's ${pct}% of the distance to the Moon.`;
  }
  if (km >= EARTH_CIRCUMFERENCE / 4) {
    const fraction = (km / EARTH_CIRCUMFERENCE).toFixed(1);
    return `That's ${fraction}× around the Earth.`;
  }
  if (km >= TORONTO_VANCOUVER / 2) {
    const trips = (km / TORONTO_VANCOUVER).toFixed(1);
    return `Toronto to Vancouver ${trips}×.`;
  }
  if (km >= TORONTO_MONTREAL) {
    const trips = Math.round(km / TORONTO_MONTREAL);
    return `Toronto to Montreal ${trips}×.`;
  }
  return 'Every kilometre counts.';
}
