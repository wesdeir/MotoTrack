import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatInputDate, parseFormDate } from '../../utils/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { FormField, Input, Textarea } from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ReceiptUpload from '../../components/ui/ReceiptUpload';
import {
  type MaintenanceRecord,
  type MaintenanceCategory,
  type PartUsed,
} from '../../models';

interface ServicePreset {
  label: string;
  title: string;
  category: MaintenanceCategory;
}

// EP3 SiR / K-series Honda maintenance schedule + general items.
// 'Custom' must stay last.
const SERVICE_PRESETS: ServicePreset[] = [
  // Oil & fluids
  { label: 'Oil & Filter',     title: 'Engine Oil & Filter Change',        category: 'oil-change' },
  { label: 'Coolant Flush',    title: 'Coolant Flush & Fill',               category: 'coolant' },
  { label: 'Brake Fluid',      title: 'Brake Fluid Flush',                  category: 'brake-fluid' },
  { label: 'Trans. Fluid',     title: 'Manual Transmission Fluid Change',   category: 'transmission-fluid' },
  // Filters
  { label: 'Air Filter',       title: 'Engine Air Filter Replacement',      category: 'filter' },
  { label: 'Cabin Filter',     title: 'Cabin Air Filter Replacement',       category: 'filter' },
  { label: 'Fuel Filter',      title: 'Fuel Filter Replacement',            category: 'filter' },
  { label: 'PCV Valve',        title: 'PCV Valve Replacement',              category: 'filter' },
  // Ignition
  { label: 'Spark Plugs',      title: 'Spark Plug Replacement',             category: 'spark-plugs' },
  // Brakes
  { label: 'Brake Pads',       title: 'Brake Pad Replacement',              category: 'brakes' },
  { label: 'Brake Rotors',     title: 'Brake Rotor Replacement',            category: 'brakes' },
  { label: 'Brake Caliper',    title: 'Brake Caliper Service',              category: 'brakes' },
  // Tires & wheels
  { label: 'Tire Rotation',    title: 'Tire Rotation',                      category: 'tires' },
  { label: 'New Tires',        title: 'New Tires',                          category: 'tires' },
  { label: 'Alignment',        title: 'Four-Wheel Alignment',               category: 'tires' },
  { label: 'Wheel Balance',    title: 'Wheel Balance',                      category: 'tires' },
  { label: 'Wheel Bearing',    title: 'Wheel Bearing Replacement',          category: 'wheel-bearing' },
  // K-series engine
  { label: 'Valve Clearance',  title: 'Valve Clearance Adjustment',         category: 'inspection' },
  { label: 'Timing Chain',     title: 'Timing Chain Inspection',            category: 'inspection' },
  { label: 'Throttle Body',    title: 'Throttle Body Cleaning',             category: 'other' },
  { label: 'VTC Solenoid',     title: 'VTC Solenoid Service',               category: 'other' },
  // General
  { label: 'Clutch',           title: 'Clutch Replacement',                 category: 'other' },
  { label: 'Battery',          title: 'Battery Replacement',                category: 'other' },
  { label: 'Wiper Blades',     title: 'Wiper Blade Replacement',            category: 'other' },
  { label: 'Inspection',       title: 'General Vehicle Inspection',         category: 'inspection' },
  { label: 'Custom',           title: '',                                   category: 'other' },
];

interface Props {
  isOpen: boolean;
  record: MaintenanceRecord | null;
  vehicleId: string;
  currentOdometer: number;
  onSave: (data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  vehicleId: string;
  category: MaintenanceCategory;
  title: string;
  date: string;
  odometer: number | '';
  notes: string;
  laborCost: number | '';
  partsCost: number | '';
  tax: number | '';
  totalCost: number;
  shop: string;
  nextDueKm: number | '';
  nextDueDate: string;
  receiptImage: string | undefined;
  receiptFileName: string | undefined;
  parts: PartUsed[];
}

function emptyForm(vehicleId: string, odo: number): FormState {
  return {
    vehicleId,
    category: 'other',
    title: '',
    date: formatInputDate(new Date()),
    odometer: odo || '',
    notes: '',
    laborCost: '',
    partsCost: '',
    tax: '',
    totalCost: 0,
    shop: '',
    nextDueKm: '',
    nextDueDate: '',
    receiptImage: undefined,
    receiptFileName: undefined,
    parts: [],
  };
}

function calcTotal(labor: number | '', parts: number | '', tax: number | ''): number {
  return Math.round(((Number(labor) || 0) + (Number(parts) || 0) + (Number(tax) || 0)) * 100) / 100;
}

export default function MaintenanceForm({
  isOpen, record, vehicleId, currentOdometer, onSave, onDelete, onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicleId, currentOdometer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      // Restore chip highlight: match by title first, fall back to 'Custom'
      const match = SERVICE_PRESETS.find((p) => p.title === record.title && p.label !== 'Custom');
      setSelectedPreset(match ? match.label : 'Custom');
      setForm({
        vehicleId: record.vehicleId,
        category: record.category,
        title: record.title,
        date: formatInputDate(record.date),
        odometer: record.odometer,
        notes: record.notes ?? '',
        laborCost: record.laborCost || '',
        partsCost: record.partsCost || '',
        tax: record.tax || '',
        totalCost: record.totalCost,
        shop: record.shop ?? '',
        nextDueKm: record.nextDueKm ?? '',
        nextDueDate: record.nextDueDate ? formatInputDate(record.nextDueDate) : '',
        receiptImage: record.receiptImage,
        receiptFileName: record.receiptFileName,
        parts: record.parts ?? [],
      });
    } else {
      setSelectedPreset(null);
      setForm(emptyForm(vehicleId, currentOdometer));
    }
    setErrors({});
  }, [isOpen, record, vehicleId, currentOdometer]);

  const selectPreset = (preset: ServicePreset) => {
    setSelectedPreset(preset.label);
    setErrors((e) => ({ ...e, title: '' }));
    setForm((p) => ({
      ...p,
      category: preset.category,
      // Custom: keep whatever the user already typed; preset: fill the title
      title: preset.label !== 'Custom' ? preset.title : p.title,
    }));
  };

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleCost = (field: 'laborCost' | 'partsCost' | 'tax', raw: string) => {
    const val = raw === '' ? '' : Number(raw);
    setForm((p) => {
      const next = { ...p, [field]: val };
      next.totalCost = calcTotal(next.laborCost, next.partsCost, next.tax);
      return next;
    });
  };

  // Shared updater: recalculates partsCost and totalCost from a new parts array
  const applyParts = (p: FormState, parts: PartUsed[]) => {
    const partsCost = parts.reduce((s, pt) => s + pt.cost, 0);
    return { ...p, parts, partsCost, totalCost: calcTotal(p.laborCost, partsCost, p.tax) };
  };

  const addPart = () => setForm((p) => applyParts(p, [...p.parts, { name: '', cost: 0 }]));

  const removePart = (i: number) =>
    setForm((p) => applyParts(p, p.parts.filter((_, idx) => idx !== i)));

  const updatePart = (i: number, field: keyof PartUsed, value: string | number) =>
    setForm((p) => applyParts(
      p,
      p.parts.map((pt, idx) =>
        idx === i ? { ...pt, [field]: field === 'cost' ? Number(value) || 0 : value } : pt,
      ),
    ));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.odometer || Number(form.odometer) <= 0) errs.odometer = 'Enter a valid odometer';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        vehicleId: form.vehicleId,
        category: form.category,
        title: form.title.trim(),
        date: parseFormDate(form.date, record?.date),
        odometer: Number(form.odometer),
        notes: form.notes.trim() || undefined,
        parts: form.parts.filter((p) => p.name.trim()),
        laborCost: Number(form.laborCost) || 0,
        partsCost: Number(form.partsCost) || 0,
        tax: Number(form.tax) || 0,
        totalCost: form.totalCost,
        shop: form.shop.trim() || undefined,
        nextDueKm: form.nextDueKm !== '' ? Number(form.nextDueKm) : undefined,
        nextDueDate: form.nextDueDate ? new Date(form.nextDueDate) : undefined,
        receiptImage: form.receiptImage,
        receiptFileName: form.receiptFileName,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={record ? 'Edit Service' : 'Log Service'}>
        <div className="px-5 py-4 space-y-4 pb-24">

          {/* Service type chip picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`py-2.5 px-3 rounded-xl text-[13px] font-semibold text-center transition-colors ${
                    preset.label === 'Custom' ? 'col-span-2' : ''
                  } ${
                    selectedPreset === preset.label
                      ? 'bg-ios-blue text-white'
                      : 'bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.07] dark:border-white/[0.10] text-gray-700 dark:text-gray-300 active:bg-white/60 dark:active:bg-white/[0.12]'
                  }`}
                >
                  {preset.label === 'Custom' ? '+ Custom' : preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title — auto-filled by chip, always editable */}
          <FormField label="Title" error={errors.title} required>
            <Input
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                // If user edits the title manually, switch to Custom highlight
                const match = SERVICE_PRESETS.find(
                  (p) => p.title === e.target.value && p.label !== 'Custom',
                );
                setSelectedPreset(match ? match.label : 'Custom');
              }}
              placeholder={selectedPreset === 'Custom' || !selectedPreset
                ? 'Describe the service…'
                : 'Customise if needed'}
            />
          </FormField>

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

          <FormField label="Shop / Vendor">
            <Input
              value={form.shop}
              onChange={(e) => set('shop', e.target.value)}
              placeholder="e.g. AJ's Auto Service"
            />
          </FormField>

          {/* Costs */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Costs (CAD)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Labour">
                <Input
                  type="number"
                  value={form.laborCost}
                  onChange={(e) => handleCost('laborCost', e.target.value)}
                  placeholder="0"
                  min={0}
                  step={0.01}
                />
              </FormField>
              <FormField label="Parts" hint={form.parts.length > 0 ? 'from list' : undefined}>
                <Input
                  type="number"
                  value={form.partsCost}
                  onChange={(e) => handleCost('partsCost', e.target.value)}
                  placeholder="0"
                  min={0}
                  step={0.01}
                  disabled={form.parts.length > 0}
                />
              </FormField>
              <FormField label="Tax">
                <Input
                  type="number"
                  value={form.tax}
                  onChange={(e) => handleCost('tax', e.target.value)}
                  placeholder="0"
                  min={0}
                  step={0.01}
                />
              </FormField>
            </div>
            <div className="mt-2 flex items-center justify-between px-1 py-2 bg-white/30 dark:bg-white/[0.05] border border-white/60 dark:border-white/[0.08] rounded-xl">
              <span className="text-sm text-ios-gray dark:text-gray-400">Total</span>
              <span className="text-xl font-bold text-black dark:text-white">
                ${form.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Next due */}
          <FormField label="Next Due (km)" hint="Optional">
            <Input
              type="number"
              value={form.nextDueKm}
              onChange={(e) =>
                set('nextDueKm', e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="216000"
              min={0}
            />
          </FormField>
          <FormField label="Next Due (date)" hint="Optional">
            <Input
              type="date"
              value={form.nextDueDate}
              onChange={(e) => set('nextDueDate', e.target.value)}
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Additional notes about this service…"
            />
          </FormField>

          {/* Parts Used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Parts Used</p>
              <button
                type="button"
                onClick={addPart}
                className="flex items-center gap-1 text-xs font-semibold text-ios-blue"
              >
                <Plus size={13} /> Add Part
              </button>
            </div>
            {form.parts.length > 0 && (
              <div className="space-y-2 mb-2">
                {form.parts.map((part, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={part.name}
                      onChange={(e) => updatePart(i, 'name', e.target.value)}
                      placeholder="Part name"
                      className="flex-1 !py-2 text-sm"
                    />
                    <Input
                      type="number"
                      value={part.cost || ''}
                      onChange={(e) => updatePart(i, 'cost', e.target.value)}
                      placeholder="$0"
                      className="w-20 !py-2 text-sm"
                      min={0}
                      step={0.01}
                    />
                    <button
                      type="button"
                      onClick={() => removePart(i)}
                      className="p-2 text-ios-red flex-shrink-0"
                      aria-label="Remove part"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {form.parts.length === 0 && (
              <p className="text-xs text-ios-gray dark:text-gray-500">
                Add individual parts to auto-calculate the parts cost.
              </p>
            )}
          </div>

          <FormField label="Receipt">
            <ReceiptUpload
              value={form.receiptImage}
              fileName={form.receiptFileName}
              onChange={(dataUrl, name) =>
                setForm((p) => ({ ...p, receiptImage: dataUrl, receiptFileName: name }))
              }
              onRemove={() =>
                setForm((p) => ({ ...p, receiptImage: undefined, receiptFileName: undefined }))
              }
            />
          </FormField>

          <div className="pt-2 space-y-3">
            <Button onClick={handleSubmit} fullWidth loading={saving} size="lg">
              {record ? 'Save Changes' : 'Save Record'}
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
        title="Delete Service Record?"
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
