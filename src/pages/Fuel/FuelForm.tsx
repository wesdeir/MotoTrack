import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FUEL_GRADES, type FuelRecord, type FuelGrade } from '../../models';
import { formatInputDate } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  record: FuelRecord | null;
  vehicleId: string;
  currentOdometer: number;
  onSave: (
    data: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt' | 'kmTravelled' | 'lPer100km' | 'kmPerL' | 'costPerKm'>,
  ) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  vehicleId: string;
  date: string;
  odometer: number | '';
  litres: number | '';
  totalCost: number | '';
  pricePerLitre: number | '';
  fuelGrade: FuelGrade;
  fullTank: boolean;
  notes: string;
}

function emptyForm(vehicleId: string, odo: number): FormState {
  return {
    vehicleId,
    date: formatInputDate(new Date()),
    odometer: odo || '',
    litres: '',
    totalCost: '',
    pricePerLitre: '',
    fuelGrade: 'regular',
    fullTank: true,
    notes: '',
  };
}

export default function FuelForm({ isOpen, record, vehicleId, currentOdometer, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicleId, currentOdometer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      setForm({
        vehicleId: record.vehicleId,
        date: formatInputDate(record.date),
        odometer: record.odometer,
        litres: record.litres,
        totalCost: record.totalCost,
        pricePerLitre: record.pricePerLitre ?? '',
        fuelGrade: record.fuelGrade ?? 'regular',
        fullTank: record.fullTank,
        notes: record.notes ?? '',
      });
    } else {
      setForm(emptyForm(vehicleId, currentOdometer));
    }
    setErrors({});
  }, [isOpen, record, vehicleId, currentOdometer]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => {
      const next = { ...p, [key]: val };
      // Auto-sync price per litre ↔ total cost
      if (key === 'litres' || key === 'totalCost') {
        const L = Number(key === 'litres' ? val : next.litres);
        const total = Number(key === 'totalCost' ? val : next.totalCost);
        if (L > 0 && total > 0) {
          next.pricePerLitre = Math.round((total / L) * 1000) / 1000;
        }
      }
      if (key === 'pricePerLitre') {
        const L = Number(next.litres);
        const ppl = Number(val);
        if (L > 0 && ppl > 0) {
          next.totalCost = Math.round(ppl * L * 100) / 100;
        }
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.odometer || Number(form.odometer) <= 0) errs.odometer = 'Enter a valid odometer';
    if (!form.litres || Number(form.litres) <= 0) errs.litres = 'Enter litres';
    if (!form.totalCost || Number(form.totalCost) <= 0) errs.totalCost = 'Enter the total cost';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        vehicleId: form.vehicleId,
        date: new Date(form.date),
        odometer: Number(form.odometer),
        litres: Number(form.litres),
        totalCost: Number(form.totalCost),
        pricePerLitre: form.pricePerLitre !== '' ? Number(form.pricePerLitre) : undefined,
        fuelGrade: form.fuelGrade,
        fullTank: form.fullTank,
        notes: form.notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={record ? 'Edit Fill-Up' : 'Log Fill-Up'}>
        <div className="px-5 py-4 space-y-4 pb-24">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date" error={errors.date} required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </FormField>
            <FormField label="Odometer (km)" error={errors.odometer} required>
              <Input
                type="number"
                value={form.odometer}
                onChange={(e) => set('odometer', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="211000"
                min={0}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Litres" error={errors.litres} required>
              <Input
                type="number"
                value={form.litres}
                onChange={(e) => set('litres', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="42.0"
                min={0}
                step={0.1}
              />
            </FormField>
            <FormField label="Total Cost ($)" error={errors.totalCost} required>
              <Input
                type="number"
                value={form.totalCost}
                onChange={(e) => set('totalCost', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="73.50"
                min={0}
                step={0.01}
              />
            </FormField>
          </div>

          <FormField label="Price / Litre" hint="Auto-calculated from litres + total">
            <Input
              type="number"
              value={form.pricePerLitre}
              onChange={(e) => set('pricePerLitre', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1.750"
              min={0}
              step={0.001}
            />
          </FormField>

          <FormField label="Fuel Grade">
            <Select
              value={form.fuelGrade}
              onChange={(e) => set('fuelGrade', e.target.value as FuelGrade)}
              options={FUEL_GRADES}
            />
          </FormField>

          {/* Full tank toggle */}
          <button
            type="button"
            onClick={() => set('fullTank', !form.fullTank)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-black dark:text-white">Full Tank</p>
              <p className="text-xs text-ios-gray dark:text-gray-400">
                Required for accurate fuel economy calculation
              </p>
            </div>
            <div
              role="switch"
              aria-checked={form.fullTank}
              className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ml-3 overflow-hidden ${
                form.fullTank ? 'bg-ios-green' : 'bg-gray-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  form.fullTank ? 'translate-x-[26px]' : 'translate-x-1'
                }`}
              />
            </div>
          </button>

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Station, trip notes…"
            />
          </FormField>

          <div className="pt-2 space-y-3">
            <Button onClick={handleSubmit} fullWidth loading={saving} size="lg">
              {record ? 'Save Changes' : 'Save Fill-Up'}
            </Button>
            {record && (
              <Button
                onClick={() => setConfirmDelete(true)}
                variant="danger"
                fullWidth
                size="lg"
              >
                Delete Record
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Fill-Up?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          setConfirmDelete(false);
          await onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
