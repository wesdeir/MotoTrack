import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import Button from '../ui/Button';

// Lazy-load so Modal + FormField + vinDecoder stay out of the main chunk
const VehicleSetupModal = lazy(() => import('./VehicleSetupModal'));

interface TutorialStep {
  route: string;
  title: string;
  body: string;
  isLast?: true;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    route: '/',
    title: 'Your Dashboard',
    body: 'Your vehicle overview, quick actions, and recent activity — all in one place.',
  },
  {
    route: '/',
    title: 'Quick Actions',
    body: 'Tap Log Service or Add Fuel right from the Dashboard — no tab-switching needed.',
  },
  {
    route: '/maintenance',
    title: 'Maintenance Log',
    body: 'Your full service history. Search records, filter by category, or switch to Timeline view.',
  },
  {
    route: '/maintenance',
    title: 'Service Reminders',
    body: 'Tap the Reminders tab above the list. Track by mileage, months, or exact date — the nav badge alerts you when something\'s due.',
  },
  {
    route: '/fuel',
    title: 'Fuel Tracking',
    body: 'Log every fill-up to track spending and watch your fuel economy trend over time.',
  },
  {
    route: '/reports',
    title: 'Reports & Insights',
    body: 'Lifetime stats, monthly spend breakdowns, and fuel economy charts — all in one view.',
  },
  {
    route: '/',
    title: 'You\'re all set!',
    body: 'That\'s the full tour. Ready to set up your own vehicle?',
    isLast: true,
  },
];

export default function TutorialBanner() {
  const { isActive, step, advance, complete, skip } = useTutorial();
  const navigate = useNavigate();
  const [setupOpen, setSetupOpen] = useState(false);

  if (!isActive) return null;

  const current = TUTORIAL_STEPS[Math.min(step, TUTORIAL_STEPS.length - 1)];
  const isLast = current.isLast === true;

  const handleNext = () => {
    const nextStep = TUTORIAL_STEPS[step + 1];
    if (nextStep) navigate(nextStep.route);
    advance();
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
            {current.body}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-end gap-2">
            {isLast ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={complete}
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
