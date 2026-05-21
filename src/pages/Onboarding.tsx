import { useState } from 'react';
import { ChevronRight, Wrench, Droplets, Bell } from 'lucide-react';
import Button from '../components/ui/Button';

interface Props {
  onDone: () => void;
}

const CARDS = [
  {
    id: 'welcome',
    emoji: '🏁',
    title: 'MotoTrack',
    subtitle: 'Your car\'s complete service history, always in your pocket.',
  },
  {
    id: 'features',
    emoji: null,
    title: 'Everything in one place',
    subtitle: null,
  },
  {
    id: 'cta',
    emoji: '🚗',
    title: 'Ready to go',
    subtitle: 'Add your vehicle to get started, or try the app with sample data first.',
  },
] as const;

const FEATURES = [
  { icon: Wrench,   color: 'text-ios-blue',   bg: 'bg-blue-50 dark:bg-ios-blue/10',   title: 'Service Tracking',     desc: 'Log every oil change, repair, and inspection with receipts.' },
  { icon: Bell,     color: 'text-ios-orange',  bg: 'bg-orange-50 dark:bg-ios-orange/10', title: 'Smart Reminders',      desc: 'Get notified when service is due by mileage or time.' },
  { icon: Droplets, color: 'text-ios-green',   bg: 'bg-green-50 dark:bg-ios-green/10',  title: 'Fuel Economy',         desc: 'Track every fill-up and watch your L/100 km trend.' },
];

export default function Onboarding({ onDone }: Props) {
  const [card, setCard] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      // Lazy-load seed module so its large data arrays don't bloat the initial bundle
      const { clearAndReseed } = await import('../db/seed');
      await clearAndReseed();
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'linear-gradient(135deg, var(--blob-light-1, #e0f2fe) 0%, var(--blob-light-2, #f3e8ff) 100%)',
      }}
    >
      {/* Cards */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {card === 0 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6">{CARDS[0].emoji}</div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-3">{CARDS[0].title}</h1>
            <p className="text-lg text-ios-gray dark:text-gray-400 leading-relaxed">{CARDS[0].subtitle}</p>
          </div>
        )}

        {card === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">{CARDS[1].title}</h2>
            <div className="space-y-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-4 bg-white/60 dark:bg-white/[0.07] backdrop-blur-sm border border-white/70 dark:border-white/[0.10] rounded-2xl"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <f.icon size={20} className={f.color} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-black dark:text-white">{f.title}</p>
                    <p className="text-sm text-ios-gray dark:text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {card === 2 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6">{CARDS[2].emoji}</div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">{CARDS[2].title}</h2>
            <p className="text-base text-ios-gray dark:text-gray-400 leading-relaxed mb-8">{CARDS[2].subtitle}</p>
            <div className="space-y-3">
              <Button onClick={onDone} fullWidth size="lg">
                Add My Vehicle
              </Button>
              <Button onClick={handleDemo} variant="secondary" fullWidth size="lg" loading={loading}>
                Load Demo Data
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dots + nav */}
      <div className="px-6 pb-8 flex items-center justify-between" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Dot indicators */}
        <div className="flex gap-2">
          {CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCard(i)}
              className={`rounded-full transition-all ${
                card === i
                  ? 'w-6 h-2 bg-ios-blue'
                  : 'w-2 h-2 bg-gray-300 dark:bg-white/30'
              }`}
            />
          ))}
        </div>

        {card < CARDS.length - 1 ? (
          <button
            onClick={() => setCard(card + 1)}
            className="flex items-center gap-1 text-ios-blue font-semibold text-[15px]"
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={onDone}
            className="text-ios-gray dark:text-gray-400 text-sm"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
