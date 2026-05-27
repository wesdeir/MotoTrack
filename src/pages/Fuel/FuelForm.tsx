import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Gauge } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ScanReceiptButton from '../../components/ui/ScanReceiptButton';
import { FUEL_GRADES, type FuelRecord, type FuelGrade } from '../../models';
import { formatInputDate, formatLPer100km, parseFormDate } from '../../utils/formatters';
import type { ParsedReceipt } from '../../utils/ocr';

interface Props {
  isOpen: boolean;
  record: FuelRecord | null;
  vehicleId: string;
  currentOdometer: number;
  /** All fuel records for this vehicle — used for live economy preview + warnings.
   *  Optional for backwards compatibility, but strongly recommended. */
  allRecords?: FuelRecord[];
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

export default function FuelForm({ isOpen, record, vehicleId, currentOdometer, allRecords, onSave, onDelete, onClose }: Props) {
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

  /**
   * Auto-fill fuel-related form fields from an OCR result. Only fills fields
   * the user hasn't already populated — never overwrites their input.
   */
  const applyParsedReceipt = (parsed: ParsedReceipt) => {
    setForm((prev) => {
      const next = { ...prev };
      if (parsed.date && !prev.date) next.date = parsed.date;
      if (parsed.amount != null && (prev.totalCost === '' || prev.totalCost === 0)) {
        next.totalCost = parsed.amount;
      }
      if (parsed.litres != null && (prev.litres === '' || prev.litres === 0)) {
        next.litres = parsed.litres;
      }
      if (parsed.pricePerLitre != null && (prev.pricePerLitre === '' || prev.pricePerLitre === 0)) {
        next.pricePerLitre = parsed.pricePerLitre;
      }
      if (parsed.odometer != null && (prev.odometer === '' || prev.odometer === 0)) {
        next.odometer = parsed.odometer;
      }
      return next;
    });
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

  /**
   * Previous full-tank fill (excluding the record currently being edited) used
   * to anchor the live economy preview. We need its odometer, plus the total
   * litres pumped in any partial fills between then and now — same math as
   * `enrichFuelRecords`'s full-tank-anchored algorithm.
   */
  const economyContext = useMemo(() => {
    if (!allRecords || allRecords.length === 0) return null;
    const odoNum = Number(form.odometer);
    if (!Number.isFinite(odoNum) || odoNum <= 0) return null;
    const editingId = record?.id ?? null;

    const candidates = allRecords
      .filter((r) => r.id !== editingId && r.odometer < odoNum)
      .sort((a, b) => a.odometer - b.odometer);
    if (candidates.length === 0) return null;

    // Walk back to the most recent full-tank fill, summing litres of partials
    // that came after it (but before the current entry).
    let prevFullIdx = -1;
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i].fullTank) { prevFullIdx = i; break; }
    }
    if (prevFullIdx < 0) return null;

    const prevFull = candidates[prevFullIdx];
    const litresBetween = candidates
      .slice(prevFullIdx + 1)
      .reduce((s, r) => s + r.litres, 0);

    return { prevFullOdometer: prevFull.odometer, litresBetween };
  }, [allRecords, form.odometer, record?.id]);

  /** Live L/100km preview for a full-tank entry. Null when we can't compute. */
  const previewLPer100km = useMemo(() => {
    if (!form.fullTank) return null;
    if (!economyContext) return null;
    const odoNum = Number(form.odometer);
    const litresNum = Number(form.litres);
    if (!odoNum || !litresNum) return null;
    const km = odoNum - economyContext.prevFullOdometer;
    const totalLitres = economyContext.litresBetween + litresNum;
    if (km <= 0 || totalLitres <= 0) return null;
    return (totalLitres / km) * 100;
  }, [form.fullTank, form.odometer, form.litres, economyContext]);

  /** Warn (don't block) when odometer goes backward vs. vehicle or prior fill. */
  const odometerWarning = useMemo<string | null>(() => {
    const odoNum = Number(form.odometer);
    if (!odoNum || odoNum <= 0) return null;
    const editingId = record?.id ?? null;
    const priors = (allRecords ?? []).filter((r) => r.id !== editingId);
    const highestPriorOdo = priors.reduce((max, r) => Math.max(max, r.odometer), 0);
    if (highestPriorOdo > 0 && odoNum < highestPriorOdo) {
      return `Lower than your previous fill-up (${highestPriorOdo.toLocaleString()} km). Double-check for a typo.`;
    }
    if (currentOdometer > 0 && odoNum < currentOdometer) {
      return `Lower than your vehicle's saved odometer (${currentOdometer.toLocaleString()} km).`;
    }
    return null;
  }, [form.odometer, allRecords, currentOdometer, record?.id]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        vehicleId: form.vehicleId,
        date: parseFormDate(form.date, record?.date),
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
          {!record && <ScanReceiptButton onParsed={applyParsedReceipt} />}

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
            {odometerWarning && (
              <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-ios-orange leading-snug">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{odometerWarning}</span>
              </div>
            )}
          </FormField>

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

          {previewLPer100km != null && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ios-blue/10 dark:bg-ios-blue/[0.12]">
              <Gauge size={16} className="text-ios-blue flex-shrink-0" />
              <div className="text-xs leading-snug">
                <span className="font-semibold text-black dark:text-white">
                  {formatLPer100km(previewLPer100km)}
                </span>
                <span className="text-ios-gray dark:text-gray-400">
                  {' '}for this fill, anchored to your last full tank.
                </span>
              </div>
            </div>
          )}

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

          {/* Full tank segmented control */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fill Type</p>
            <div className="flex gap-1 p-1 bg-white/30 backdrop-blur-sm border border-white/60 dark:bg-white/[0.07] dark:border-white/[0.10] rounded-xl">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => set('fullTank', val)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    form.fullTank === val
                      ? 'bg-white/80 dark:bg-white/[0.15] text-black dark:text-white shadow-glass'
                      : 'text-ios-gray dark:text-gray-400'
                  }`}
                >
                  {val ? 'Full Tank' : 'Partial'}
                </button>
              ))}
            </div>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-1 px-1">
              Full tank required for accurate fuel economy
            </p>
          </div>

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
