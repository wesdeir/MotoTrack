import { useState } from 'react';
import { ChevronRight, Wrench, Droplets, Bell, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import { useVehicle } from '../hooks/useVehicle';
import { decodeVin } from '../utils/vinDecoder';

// ---------------------------------------------------------------------------
// Vehicle form logic (mirrors Settings.tsx — kept in sync manually)
// ---------------------------------------------------------------------------

interface VehicleForm {
  nickname: string;
  year: number | '';
  make: string;
  model: string;
  trim: string;
  engine: string;
  vin: string;
  currentOdometer: number | '';
  currency: 'CAD' | 'USD';
}

function emptyVehicleForm(): VehicleForm {
  return { nickname: '', year: '', make: '', model: '', trim: '', engine: '', vin: '', currentOdometer: '', currency: 'CAD' };
}

function validateVehicle(form: VehicleForm): Partial<Record<keyof VehicleForm, string>> {
  const errs: Partial<Record<keyof VehicleForm, string>> = {};
  if (!form.nickname.trim()) errs.nickname = 'Required';
  if (!form.year || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 2) {
    errs.year = 'Enter a valid year';
  }
  if (!form.make.trim()) errs.make = 'Required';
  if (!form.model.trim()) errs.model = 'Required';
  if (form.currentOdometer === '' || Number(form.currentOdometer) < 0) {
    errs.currentOdometer = 'Required';
  }
  return errs;
}

const CURRENCY_OPTIONS = [
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'USD', label: 'USD ($)' },
];

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

interface Props {
  onDone: () => void;
  onStartTutorial: () => void;
}

const FEATURES = [
  { icon: Wrench,   color: 'text-ios-blue',   bg: 'bg-blue-50 dark:bg-ios-blue/10',    title: 'Service Tracking', desc: 'Log every oil change, repair, and inspection with receipts.' },
  { icon: Bell,     color: 'text-ios-orange',  bg: 'bg-orange-50 dark:bg-ios-orange/10', title: 'Smart Reminders',  desc: 'Get notified when service is due by mileage or time.' },
  { icon: Droplets, color: 'text-ios-green',   bg: 'bg-green-50 dark:bg-ios-green/10',   title: 'Fuel Economy',     desc: 'Track every fill-up and watch your L/100 km trend.' },
];

// Total card count including the vehicle setup card (index 3)
const TOTAL_CARDS = 4;

export default function Onboarding({ onDone, onStartTutorial }: Props) {
  const { addVehicle } = useVehicle();
  const [card, setCard] = useState(0);
  const [loading, setLoading] = useState(false);

  // Vehicle form state
  const [form, setForm] = useState<VehicleForm>(emptyVehicleForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [decoding, setDecoding] = useState(false);

  const set = <K extends keyof VehicleForm>(key: K, val: VehicleForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // "Explore Demo" button handler
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

  // VIN decode
  const handleDecodeVin = async () => {
    if (form.vin.length < 17) return;
    setDecoding(true);
    try {
      const result = await decodeVin(form.vin);
      if (result) {
        setForm((p) => ({
          ...p,
          make: result.make,
          model: result.model,
          year: result.year,
          trim: result.trim ?? p.trim,
          engine: result.engine ?? p.engine,
        }));
      }
    } finally {
      setDecoding(false);
    }
  };

  // Vehicle save
  const handleSaveVehicle = async () => {
    const errs = validateVehicle(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await addVehicle({
        nickname: form.nickname.trim(),
        year: Number(form.year),
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim() || undefined,
        engine: form.engine.trim() || undefined,
        vin: form.vin.trim() || undefined,
        currentOdometer: Number(form.currentOdometer),
        currency: form.currency,
        units: 'km',
        fuelUnits: 'litres',
      });
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
      {/* Cards */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 overflow-y-auto">
        {/* Card 0: Welcome */}
        {card === 0 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6">🏁</div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-3">MotoTrack</h1>
            <p className="text-lg text-ios-gray dark:text-gray-400 leading-relaxed">
              Your car&apos;s complete service history, always in your pocket.
            </p>
          </div>
        )}

        {/* Card 1: Features */}
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

        {/* Card 2: CTA — "Add My Vehicle" advances to card 3, "Explore Demo" starts tutorial */}
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

        {/* Card 3: Inline vehicle setup form */}
        {card === 3 && (
          <div className="animate-fade-in max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-1 text-center">Tell us about your vehicle</h2>
            <p className="text-sm text-ios-gray dark:text-gray-400 text-center mb-5">
              You can always update these details later in Settings.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nickname" error={errors.nickname} required>
                  <Input
                    value={form.nickname}
                    onChange={(e) => set('nickname', e.target.value)}
                    placeholder="e.g. My Civic"
                  />
                </FormField>
                <FormField label="Year" error={errors.year} required>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => set('year', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2002"
                    min={1900}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Make" error={errors.make} required>
                  <Input value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="Honda" />
                </FormField>
                <FormField label="Model" error={errors.model} required>
                  <Input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Civic" />
                </FormField>
              </div>

              <FormField label="VIN">
                <div className="flex gap-2">
                  <Input
                    value={form.vin}
                    onChange={(e) => set('vin', e.target.value.toUpperCase())}
                    placeholder="Optional — auto-fills fields"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={form.vin.length < 17 || decoding}
                    className="px-3 py-2 rounded-xl bg-ios-blue text-white text-sm font-semibold disabled:opacity-40 flex-shrink-0 flex items-center gap-1.5"
                  >
                    {decoding ? <Loader2 size={14} className="animate-spin" /> : null}
                    Decode
                  </button>
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Trim">
                  <Input value={form.trim} onChange={(e) => set('trim', e.target.value)} placeholder="Optional" />
                </FormField>
                <FormField label="Engine">
                  <Input value={form.engine} onChange={(e) => set('engine', e.target.value)} placeholder="Optional" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Odometer (km)" error={errors.currentOdometer} required>
                  <Input
                    type="number"
                    value={form.currentOdometer}
                    onChange={(e) => set('currentOdometer', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="150000"
                    min={0}
                  />
                </FormField>
                <FormField label="Currency">
                  <Select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value as 'CAD' | 'USD')}
                    options={CURRENCY_OPTIONS}
                  />
                </FormField>
              </div>

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

      {/* Dots + nav — hidden on card 3 (vehicle form has its own CTA) */}
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
