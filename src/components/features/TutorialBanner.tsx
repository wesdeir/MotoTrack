import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { useVehicle } from '../../hooks/useVehicle';
import Button from '../ui/Button';
import { db } from '../../db/database';

const VehicleSetupModal = lazy(() => import('./VehicleSetupModal'));

// Kept inline (not imported from db/seed) so the seed module stays out of the main bundle.
// Must match the VEHICLE_ID constant in src/db/seed.ts.
const DEMO_VEHICLE_ID = 'civic-sir-2002';

interface TutorialStep {
  route: string;
  title: string;
  body: string;
  highlight?: string;
  isLast?: true;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    route: '/',
    title: 'Your Dashboard',
    body: 'Your vehicle overview, quick actions, and recent activity — all in one place.',
    highlight: 'vehicle-card',
  },
  {
    route: '/',
    title: 'Vehicle Health Score',
    body: 'A 0–100 signal across reminders, recent activity, service history, and documents. Tap for the full breakdown.',
    highlight: 'health-score',
  },
  {
    route: '/',
    title: 'Quick Actions',
    body: 'Tap Log Service or Add Fuel right from the Dashboard — no tab-switching needed. Every log earns XP.',
    highlight: 'quick-actions',
  },
  {
    route: '/achievements',
    title: 'Level Up',
    body: '70+ achievements across 9 categories. Earn XP, climb the level ladder, hunt secret badges. Tap any badge to see how to unlock it.',
    highlight: 'level-card',
  },
  {
    route: '/',
    title: 'Showcase Your Best',
    body: 'Pin up to 3 favorite badges to feature them on your Dashboard. Tap any unlocked achievement → Pin to Showcase.',
    highlight: 'showcase',
  },
  {
    route: '/maintenance',
    title: 'Maintenance Log',
    body: 'Your full service history. Search records, filter by category, or switch to Timeline view.',
    highlight: 'maintenance-tabs',
  },
  {
    route: '/maintenance',
    title: 'Service Reminders',
    body: 'Tap the Reminders tab above the list. Track by mileage, months, or exact date — the nav badge alerts you when something\'s due.',
    highlight: 'maintenance-tabs',
  },
  {
    route: '/fuel',
    title: 'Fuel Tracking',
    body: 'Log every fill-up to track spending and watch your fuel economy trend over time.',
    highlight: 'fuel-stats',
  },
  {
    route: '/reports',
    title: 'Reports & Insights',
    body: 'Lifetime stats, monthly spend breakdowns, and fuel economy charts — all in one view.',
    highlight: 'reports-stats',
  },
  {
    route: '/',
    title: 'You\'re all set!',
    body: 'That\'s the full tour. Finishing earns you a special badge — your first unlock.',
    isLast: true,
  },
];

export default function TutorialBanner() {
  const { isActive, step, advance, complete, skip, setHighlight } = useTutorial();
  const { vehicle } = useVehicle();
  const navigate = useNavigate();
  const [setupOpen, setSetupOpen] = useState(false);

  const current = TUTORIAL_STEPS[Math.min(step, TUTORIAL_STEPS.length - 1)];

  // Sync the highlight target with the current step
  useEffect(() => {
    setHighlight(isActive ? (current.highlight ?? null) : null);
    return () => setHighlight(null);
  }, [isActive, step, current.highlight, setHighlight]);

  if (!isActive) return null;

  const isLast = current.isLast === true;
  const isDemoMode = vehicle?.id === DEMO_VEHICLE_ID;
  const finalBody = isLast && !isDemoMode
    ? "That's the full tour. You're ready to start tracking — log a service or fuel-up whenever you're ready."
    : current.body;

  const handleNext = () => {
    const nextStep = TUTORIAL_STEPS[step + 1];
    if (nextStep) navigate(nextStep.route);
    advance();
  };

  /**
   * Finish the tutorial AND grant the Welcome Wrench achievement against the
   * currently-active vehicle. Idempotent — the compound [vehicleId+achievementId]
   * index blocks duplicates if the user replays the tutorial.
   *
   * KNOWN LIMITATION: if the user finishes via "Set Up My Vehicle" the badge
   * lands on the demo vehicle, which gets wiped seconds later. Future fix
   * (tracked in TODO) — store a localStorage flag and have useAchievements
   * back-grant on first vehicle creation if missing.
   */
  const handleComplete = async () => {
    if (vehicle) {
      try {
        await db.unlockedAchievements.add({
          id: crypto.randomUUID(),
          vehicleId: vehicle.id,
          achievementId: 'welcome-wrench',
          unlockedAt: new Date(),
          seen: false,
        });
      } catch {
        // Index collision — already unlocked. Fine.
      }
    }
    complete();
  };

  return (
    <>
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="bg-white/60 backdrop-blur-2xl border border-white/70 dark:bg-[#080E1C]/85 dark:border-white/[0.12] rounded-2xl shadow-glass dark:shadow-glass-dark px-4 pt-3 pb-3">
          {/* Progress dots + step counter + skip */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-4 h-1.5 bg-ios-blue'
                      : i < step
                      ? 'w-1.5 h-1.5 bg-ios-blue/40'
                      : 'w-1.5 h-1.5 bg-gray-300 dark:bg-white/20'
                  }`}
                />
              ))}
              <span className="ml-1 text-[10px] font-medium text-ios-gray dark:text-gray-400">
                {step + 1} / {TUTORIAL_STEPS.length}
              </span>
            </div>
            <button
              onClick={skip}
              className="flex items-center gap-0.5 text-[11px] font-medium text-ios-gray dark:text-gray-400 active:opacity-60 p-1 -mr-1"
              aria-label="Skip tutorial"
            >
              Skip <X size={12} />
            </button>
          </div>

          {/* Step content */}
          <p className="text-[15px] font-bold text-black dark:text-white leading-snug">
            {current.title}
          </p>
          <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5 leading-relaxed">
            {finalBody}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-end gap-2">
            {isLast ? (
              isDemoMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComplete}
                  >
                    Keep Exploring
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSetupOpen(true)}
                  >
                    Set Up My Vehicle
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleComplete}>
                  Finish
                </Button>
              )
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-ios-blue text-sm font-semibold active:opacity-60"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {setupOpen && (
        <Suspense fallback={null}>
          <VehicleSetupModal
            isOpen={setupOpen}
            onClose={() => setSetupOpen(false)}
            onComplete={complete}
          />
        </Suspense>
      )}
    </>
  );
}
