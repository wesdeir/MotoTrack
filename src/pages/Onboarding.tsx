import { useState } from 'react';
import { ChevronRight, Wrench, Droplets, Bell } from 'lucide-react';
import Button from '../components/ui/Button';
import VehicleFormFields from '../components/features/VehicleFormFields';
import { useVehicle } from '../hooks/useVehicle';
import { useVehicleForm } from '../hooks/useVehicleForm';
import { formToVehicleData } from '../utils/vehicleForm';

interface Props {
  onDone: () => void;
  onStartTutorial: () => void;
}

const FEATURES = [
  { icon: Wrench,   color: 'text-ios-blue',   bg: 'bg-blue-50 dark:bg-ios-blue/10',    title: 'Service Tracking', desc: 'Log every oil change, repair, and inspection with receipts.' },
  { icon: Bell,     color: 'text-ios-orange',  bg: 'bg-orange-50 dark:bg-ios-orange/10', title: 'Smart Reminders',  desc: 'Get notified when service is due by mileage or time.' },
  { icon: Droplets, color: 'text-ios-green',   bg: 'bg-green-50 dark:bg-ios-green/10',   title: 'Fuel Economy',     desc: 'Track every fill-up and watch your L/100 km trend.' },
];

const TOTAL_CARDS = 4;

export default function Onboarding({ onDone, onStartTutorial }: Props) {
  const { addVehicle } = useVehicle();
  const { form, errors, setField, validate, decoding, handleDecodeVin } = useVehicleForm();
  const [card, setCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      const { clearAndReseed } = await import('../db/seed');
      await clearAndReseed();
      onStartTutorial();
    } finally {
      setLoading(false);
    }
  };

  const onDecodeVin = async () => {
    const decoded = await handleDecodeVin();
    // Silent on failure in onboarding — fields stay empty for manual entry
    if (!decoded) { /* no toast in onboarding */ }
  };

  const handleSaveVehicle = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await addVehicle(formToVehicleData(form));
      onDone();
    } finally {
      setSaving(false);
    }
  };

  // Dot count: cards 0-2 always show; card 3 dot appears only once user advances there
  const visibleDots = card >= 3 ? TOTAL_CARDS : 3;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'linear-gradient(135deg, var(--blob-light-1, #e0f2fe) 0%, var(--blob-light-2, #f3e8ff) 100%)',
      }}
    >
      <div className="flex-1 flex flex-col justify-center px-6 py-8 overflow-y-auto">
        {card === 0 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6">🏁</div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-3">MotoTrack</h1>
            <p className="text-lg text-ios-gray dark:text-gray-400 leading-relaxed">
              Your car&apos;s complete service history, always in your pocket.
            </p>
          </div>
        )}

        {card === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">Everything in one place</h2>
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
            <div className="text-7xl mb-6">🚗</div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">Ready to go</h2>
            <p className="text-base text-ios-gray dark:text-gray-400 leading-relaxed mb-8">
              Set up your vehicle, or explore the app with demo data first.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setCard(3)} fullWidth size="lg">
                Add My Vehicle
              </Button>
              <Button onClick={handleDemo} variant="secondary" fullWidth size="lg" loading={loading}>
                Explore Demo
              </Button>
            </div>
          </div>
        )}

        {card === 3 && (
          <div className="animate-fade-in max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-1 text-center">Tell us about your vehicle</h2>
            <p className="text-sm text-ios-gray dark:text-gray-400 text-center mb-5">
              You can always update these details later in Settings.
            </p>

            <div className="space-y-3">
              <VehicleFormFields
                form={form}
                errors={errors}
                setField={setField}
                decoding={decoding}
                onDecodeVin={onDecodeVin}
              />

              <div className="pt-2 space-y-2">
                <Button onClick={handleSaveVehicle} fullWidth size="lg" loading={saving}>
                  Get Started
                </Button>
                <button
                  onClick={onDone}
                  className="w-full text-center text-ios-gray dark:text-gray-400 text-sm py-2"
                >
                  Skip setup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {card < 3 && (
        <div className="px-6 pb-8 flex items-center justify-between" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex gap-2">
            {Array.from({ length: visibleDots }).map((_, i) => (
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

          {card < 2 ? (
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
      )}
    </div>
  );
}
