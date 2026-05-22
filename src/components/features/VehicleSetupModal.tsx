import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormField, Input, Select } from '../ui/FormField';
import { useVehicle } from '../../hooks/useVehicle';
import { decodeVin } from '../../utils/vinDecoder';

// ---------------------------------------------------------------------------
// Shared form logic (mirrors Settings.tsx VehicleForm — kept in sync manually)
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

function emptyForm(): VehicleForm {
  return { nickname: '', year: '', make: '', model: '', trim: '', engine: '', vin: '', currentOdometer: '', currency: 'CAD' };
}

function validate(form: VehicleForm): Partial<Record<keyof VehicleForm, string>> {
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
// Component
// ---------------------------------------------------------------------------

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;  // called after vehicle saved (or skipped)
}

export default function VehicleSetupModal({ isOpen, onClose, onComplete }: Props) {
  const { addVehicle } = useVehicle();
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const set = <K extends keyof VehicleForm>(key: K, val: VehicleForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

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
        showToast('Vehicle details filled from VIN');
      } else {
        showToast('VIN not found — fill in manually');
      }
    } finally {
      setDecoding(false);
    }
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      // Lazy-load seed module to keep demo data out of the main bundle
      const { clearDemoData } = await import('../../db/seed');
      await clearDemoData();
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
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
    onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Set Up Your Vehicle">
      <div className="px-5 py-4 space-y-3 pb-8">
        <p className="text-sm text-ios-gray dark:text-gray-400">
          Your demo data will be cleared and replaced with your vehicle.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nickname" error={errors.nickname} required>
            <Input
              value={form.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              placeholder="e.g. Civic SiR"
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
            <Input
              value={form.make}
              onChange={(e) => set('make', e.target.value)}
              placeholder="Honda"
            />
          </FormField>
          <FormField label="Model" error={errors.model} required>
            <Input
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              placeholder="Civic"
            />
          </FormField>
        </div>

        <FormField label="VIN">
          <div className="flex gap-2">
            <Input
              value={form.vin}
              onChange={(e) => set('vin', e.target.value.toUpperCase())}
              placeholder="Optional — auto-fills make/model/year"
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
          <Button onClick={handleSave} fullWidth size="lg" loading={saving}>
            Get Started
          </Button>
          <Button onClick={handleSkip} variant="ghost" fullWidth size="lg">
            Skip for now
          </Button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900/80 backdrop-blur-xl border border-white/[0.12] text-white rounded-2xl text-sm font-medium shadow-glass-dark animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}
    </Modal>
  );
}
