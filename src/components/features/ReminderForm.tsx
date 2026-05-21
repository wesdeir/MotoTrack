import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormField, Input, Textarea } from '../ui/FormField';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  CATEGORY_LIST,
  CATEGORY_LABELS,
  type MaintenanceCategory,
  type ReminderMode,
  type Reminder,
  type ReminderWithStatus,
} from '../../models';
import { CATEGORY_EMOJI } from '../../utils/categoryEmoji';
import { formatInputDate } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  reminder: ReminderWithStatus | null;
  vehicleId: string;
  currentOdometer: number;
  onSave: (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface FormState {
  vehicleId: string;
  serviceType: MaintenanceCategory;
  title: string;
  mode: ReminderMode;
  intervalKm: number | '';
  intervalMonths: number | '';
  dueDate: string;
  lastServiceOdometer: number | '';
  lastServiceDate: string;
  isActive: boolean;
  notes: string;
}

function emptyForm(vehicleId: string, odo: number): FormState {
  return {
    vehicleId,
    serviceType: 'oil-change',
    title: CATEGORY_LABELS['oil-change'],
    mode: 'km',
    intervalKm: 5000,
    intervalMonths: '',
    dueDate: '',
    lastServiceOdometer: odo || '',
    lastServiceDate: formatInputDate(new Date()),
    isActive: true,
    notes: '',
  };
}

export default function ReminderForm({
  isOpen, reminder, vehicleId, currentOdometer, onSave, onDelete, onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicleId, currentOdometer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (reminder) {
      setForm({
        vehicleId: reminder.vehicleId,
        serviceType: reminder.serviceType,
        title: reminder.title,
        mode: reminder.mode,
        intervalKm: reminder.intervalKm ?? '',
        intervalMonths: reminder.intervalMonths ?? '',
        dueDate: reminder.dueDate ? formatInputDate(reminder.dueDate) : '',
        lastServiceOdometer: reminder.lastServiceOdometer ?? '',
        lastServiceDate: reminder.lastServiceDate ? formatInputDate(reminder.lastServiceDate) : '',
        isActive: reminder.isActive,
        notes: reminder.notes ?? '',
      });
    } else {
      setForm(emptyForm(vehicleId, currentOdometer));
    }
    setErrors({});
  }, [isOpen, reminder, vehicleId, currentOdometer]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const selectCategory = (cat: MaintenanceCategory) => {
    setForm((p) => ({
      ...p,
      serviceType: cat,
      title: p.title === CATEGORY_LABELS[p.serviceType] ? CATEGORY_LABELS[cat] : p.title,
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.mode === 'km') {
      if (!form.intervalKm || Number(form.intervalKm) <= 0) errs.intervalKm = 'Enter interval';
      if (form.lastServiceOdometer === '' || Number(form.lastServiceOdometer) < 0) errs.lastServiceOdometer = 'Enter last service km';
    }
    if (form.mode === 'months') {
      if (!form.intervalMonths || Number(form.intervalMonths) <= 0) errs.intervalMonths = 'Enter interval';
      if (!form.lastServiceDate) errs.lastServiceDate = 'Enter last service date';
    }
    if (form.mode === 'date') {
      if (!form.dueDate) errs.dueDate = 'Enter due date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        vehicleId: form.vehicleId,
        serviceType: form.serviceType,
        title: form.title.trim(),
        mode: form.mode,
        intervalKm: form.mode === 'km' && form.intervalKm !== '' ? Number(form.intervalKm) : undefined,
        intervalMonths: form.mode === 'months' && form.intervalMonths !== '' ? Number(form.intervalMonths) : undefined,
        dueDate: form.mode === 'date' && form.dueDate ? new Date(form.dueDate) : undefined,
        lastServiceOdometer: form.lastServiceOdometer !== '' ? Number(form.lastServiceOdometer) : undefined,
        lastServiceDate: form.lastServiceDate ? new Date(form.lastServiceDate) : undefined,
        isActive: form.isActive,
        notes: form.notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={reminder ? 'Edit Reminder' : 'Add Reminder'}>
        <div className="px-5 py-4 space-y-4 pb-24">

          {/* Service type chips */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_LIST.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => selectCategory(c.value)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold text-center transition-colors flex items-center gap-1 ${
                    form.serviceType === c.value
                      ? 'bg-ios-blue text-white'
                      : 'bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.07] dark:border-white/[0.10] text-gray-700 dark:text-gray-300 active:bg-white/60'
                  }`}
                >
                  <span className="flex-shrink-0">{CATEGORY_EMOJI[c.value]}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <FormField label="Title" error={errors.title} required>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Reminder name…"
            />
          </FormField>

          {/* Mode segmented control */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Track By</p>
            <div className="flex gap-1 p-1 bg-white/30 backdrop-blur-sm border border-white/60 dark:bg-white/[0.07] dark:border-white/[0.10] rounded-xl">
              {(['km', 'months', 'date'] as ReminderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mode', m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    form.mode === m
                      ? 'bg-white/80 dark:bg-white/[0.15] text-black dark:text-white shadow-glass'
                      : 'text-ios-gray dark:text-gray-400'
                  }`}
                >
                  {m === 'km' ? 'Mileage' : m === 'months' ? 'Time' : 'Date'}
                </button>
              ))}
            </div>
          </div>

          {form.mode === 'km' && (
            <>
              <FormField label="Service Interval (km)" error={errors.intervalKm} required>
                <Input
                  type="number"
                  value={form.intervalKm}
                  onChange={(e) => set('intervalKm', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5000"
                  min={0}
                />
              </FormField>
              <FormField label="Last Service (km)" error={errors.lastServiceOdometer} required>
                <Input
                  type="number"
                  value={form.lastServiceOdometer}
                  onChange={(e) => set('lastServiceOdometer', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="211000"
                  min={0}
                />
              </FormField>
              <FormField label="Last Service Date" hint="Optional — used to estimate due date">
                <Input
                  type="date"
                  value={form.lastServiceDate}
                  onChange={(e) => set('lastServiceDate', e.target.value)}
                />
              </FormField>
            </>
          )}

          {form.mode === 'months' && (
            <>
              <FormField label="Service Interval (months)" error={errors.intervalMonths} required>
                <Input
                  type="number"
                  value={form.intervalMonths}
                  onChange={(e) => set('intervalMonths', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="12"
                  min={1}
                />
              </FormField>
              <FormField label="Last Service Date" error={errors.lastServiceDate} required>
                <Input
                  type="date"
                  value={form.lastServiceDate}
                  onChange={(e) => set('lastServiceDate', e.target.value)}
                />
              </FormField>
            </>
          )}

          {form.mode === 'date' && (
            <FormField label="Due Date" error={errors.dueDate} required>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </FormField>
          )}

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Use Valvoline 5W-20"
            />
          </FormField>

          <div className="pt-2 space-y-3">
            <Button onClick={handleSubmit} fullWidth loading={saving} size="lg">
              {reminder ? 'Save Changes' : 'Add Reminder'}
            </Button>
            {reminder && (
              <Button onClick={() => setConfirmDelete(true)} variant="danger" fullWidth size="lg">
                Delete Reminder
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Reminder?"
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
