import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  CATEGORY_LIST,
  type MaintenanceRecord,
  type MaintenanceCategory,
} from '../../models';
import { formatInputDate } from '../../utils/formatters';

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
}

function emptyForm(vehicleId: string, odo: number): FormState {
  return {
    vehicleId,
    category: 'oil-change',
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

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
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
      });
    } else {
      setForm(emptyForm(vehicleId, currentOdometer));
    }
    setErrors({});
  }, [isOpen, record, vehicleId, currentOdometer]);

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
        date: new Date(form.date),
        odometer: Number(form.odometer),
        notes: form.notes.trim() || undefined,
        parts: [],
        laborCost: Number(form.laborCost) || 0,
        partsCost: Number(form.partsCost) || 0,
        tax: Number(form.tax) || 0,
        totalCost: form.totalCost,
        shop: form.shop.trim() || undefined,
        nextDueKm: form.nextDueKm !== '' ? Number(form.nextDueKm) : undefined,
        nextDueDate: form.nextDueDate ? new Date(form.nextDueDate) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={record ? 'Edit Service' : 'Log Service'}>
        <div className="px-5 py-4 space-y-4 pb-24">
          <FormField label="Category" required>
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value as MaintenanceCategory)}
              options={CATEGORY_LIST}
            />
          </FormField>

          <FormField label="Title" error={errors.title} required>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Oil Change – Mobil 1 5W-30"
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
              <FormField label="Parts">
                <Input
                  type="number"
                  value={form.partsCost}
                  onChange={(e) => handleCost('partsCost', e.target.value)}
                  placeholder="0"
                  min={0}
                  step={0.01}
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
            <div className="mt-2 flex items-center justify-between px-1 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              <span className="text-sm text-ios-gray dark:text-gray-400">Total</span>
              <span className="text-xl font-bold text-black dark:text-white">
                ${form.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Next due */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Additional notes about this service…"
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
