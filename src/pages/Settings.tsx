import { useState, useEffect, useRef } from 'react';
import {
  Sun, Moon, Monitor, Download, Upload, RefreshCw,
  ChevronRight, Check, Plus, PencilLine, FileText,
} from 'lucide-react';
import { useVehicle } from '../hooks/useVehicle';
import { useMaintenance } from '../hooks/useMaintenance';
import { useTheme } from '../context/ThemeContext';
import { useColorTheme, COLOR_THEMES } from '../context/ColorThemeContext';
import { db } from '../db/database';
import { clearAndReseed } from '../db/seed';
import type { Vehicle, MaintenanceRecord, FuelRecord, Reminder } from '../models';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatInputDate } from '../utils/formatters';
import { exportServiceHistoryPDF } from '../utils/pdfExport';

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}

const CURRENCY_OPTIONS = [
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'USD', label: 'USD ($)' },
];

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
  return {
    nickname: '', year: '', make: '', model: '',
    trim: '', engine: '', vin: '', currentOdometer: '', currency: 'CAD',
  };
}

function vehicleToForm(v: Vehicle): VehicleForm {
  return {
    nickname: v.nickname,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim ?? '',
    engine: v.engine ?? '',
    vin: v.vin ?? '',
    currentOdometer: v.currentOdometer,
    currency: (v.currency as 'CAD' | 'USD') ?? 'CAD',
  };
}

export default function SettingsPage() {
  const { vehicle, allVehicles, activeId, switchVehicle, addVehicle, updateVehicle, deleteVehicle } = useVehicle();
  const { records: maintenanceRecords } = useMaintenance(vehicle?.id);
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  // null = fleet list; 'new' = add form; string id = edit form
  const [editId, setEditId] = useState<'new' | string | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyVehicleForm());
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Only auto-open the add form once per mount (after DB confirms no vehicles).
  // Using a ref prevents re-triggering on subsequent allVehicles changes.
  const autoOpenDone = useRef(false);
  useEffect(() => {
    if (vehicle === undefined) return; // DB still resolving
    if (!autoOpenDone.current) {
      autoOpenDone.current = true;
      if (allVehicles.length === 0) {
        setEditId('new');
        setForm(emptyVehicleForm());
      }
    }
  }, [vehicle, allVehicles]);

  // Separate effect: if the vehicle being edited is deleted elsewhere, close the form.
  useEffect(() => {
    if (editId && editId !== 'new' && !allVehicles.find((v) => v.id === editId)) {
      setEditId(null);
    }
  }, [allVehicles, editId]);

  const openAdd = () => {
    setForm(emptyVehicleForm());
    setFormErrors({});
    setEditId('new');
  };

  const openEdit = (v: Vehicle) => {
    setForm(vehicleToForm(v));
    setFormErrors({});
    setEditId(v.id);
  };

  const closeForm = () => {
    setEditId(null);
    setFormErrors({});
  };

  const setField = <K extends keyof VehicleForm>(key: K, val: VehicleForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFormErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
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
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveVehicle = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        nickname: form.nickname.trim(),
        year: Number(form.year),
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim() || undefined,
        engine: form.engine.trim() || undefined,
        vin: form.vin.trim() || undefined,
        currentOdometer: Number(form.currentOdometer),
        currency: form.currency,
        units: 'km' as const,
        fuelUnits: 'litres' as const,
      };
      if (editId === 'new') {
        await addVehicle(data);
        showToast('Vehicle added');
      } else if (editId) {
        await updateVehicle(editId, data);
        showToast('Vehicle updated');
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    setConfirmDeleteId(null);
    await deleteVehicle(id);
    closeForm();
    showToast('Vehicle deleted');
  };

  const handleExportPDF = async () => {
    if (!vehicle) return;
    try {
      await exportServiceHistoryPDF(vehicle, maintenanceRecords ?? []);
    } catch {
      showToast('PDF export failed');
    }
  };

  const handleExport = async () => {
    const [vehicles, maintenanceRecords, fuelRecords, reminders] = await Promise.all([
      db.vehicles.toArray(),
      db.maintenanceRecords.toArray(),
      db.fuelRecords.toArray(),
      db.reminders.toArray(),
    ]);
    const data = JSON.stringify({ vehicles, maintenanceRecords, fuelRecords, reminders }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mototrack-backup-${formatInputDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text, reviveDates) as {
        vehicles?: Vehicle[];
        maintenanceRecords?: unknown[];
        fuelRecords?: unknown[];
        reminders?: unknown[];
      };
      await db.transaction('rw', db.vehicles, db.maintenanceRecords, db.fuelRecords, db.reminders, async () => {
        if (parsed.vehicles?.length) await db.vehicles.bulkPut(parsed.vehicles);
        if (parsed.maintenanceRecords?.length) await db.maintenanceRecords.bulkPut(parsed.maintenanceRecords as MaintenanceRecord[]);
        if (parsed.fuelRecords?.length) await db.fuelRecords.bulkPut(parsed.fuelRecords as FuelRecord[]);
        if (parsed.reminders?.length) await db.reminders.bulkPut(parsed.reminders as Reminder[]);
      });
      showToast('Data imported successfully');
    } catch {
      showToast('Import failed — invalid file');
    }
    e.target.value = '';
  };

  const handleReseed = async () => {
    await clearAndReseed();
    setConfirmReseed(false);
    showToast('Demo data loaded');
  };

  const handleClearAll = async () => {
    await Promise.all([
      db.vehicles.clear(),
      db.maintenanceRecords.clear(),
      db.fuelRecords.clear(),
      db.reminders.clear(),
    ]);
    setConfirmClear(false);
    showToast('All data cleared');
  };

  const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const canCancel = allVehicles.length > 0;
  const editingVehicle = editId && editId !== 'new' ? allVehicles.find((v) => v.id === editId) : null;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      <PageHeader title="Settings" />

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-8 space-y-5">

        {/* Fleet section */}
        <section>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
              My Vehicles
            </p>
            {editId === null && (
              <button
                onClick={openAdd}
                className="text-ios-blue text-sm font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>

          {/* Add / Edit form */}
          {editId !== null && (
            <Card>
              <p className="text-base font-bold text-black dark:text-white mb-3">
                {editId === 'new' ? 'Add Vehicle' : 'Edit Vehicle'}
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Nickname" error={formErrors.nickname} required>
                    <Input
                      value={form.nickname}
                      onChange={(e) => setField('nickname', e.target.value)}
                      placeholder="e.g. Civic SiR"
                    />
                  </FormField>
                  <FormField label="Year" error={formErrors.year} required>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="2002"
                      min={1900}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Make" error={formErrors.make} required>
                    <Input
                      value={form.make}
                      onChange={(e) => setField('make', e.target.value)}
                      placeholder="Honda"
                    />
                  </FormField>
                  <FormField label="Model" error={formErrors.model} required>
                    <Input
                      value={form.model}
                      onChange={(e) => setField('model', e.target.value)}
                      placeholder="Civic"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Trim">
                    <Input
                      value={form.trim}
                      onChange={(e) => setField('trim', e.target.value)}
                      placeholder="SiR (EP3)"
                    />
                  </FormField>
                  <FormField label="Engine">
                    <Input
                      value={form.engine}
                      onChange={(e) => setField('engine', e.target.value)}
                      placeholder="2.0L K20A3"
                    />
                  </FormField>
                </div>
                <FormField label="Odometer (km)" error={formErrors.currentOdometer} required>
                  <Input
                    type="number"
                    value={form.currentOdometer}
                    onChange={(e) =>
                      setField('currentOdometer', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="150000"
                    min={0}
                  />
                </FormField>
                <FormField label="Currency">
                  <Select
                    value={form.currency}
                    onChange={(e) => setField('currency', e.target.value as 'CAD' | 'USD')}
                    options={CURRENCY_OPTIONS}
                  />
                </FormField>

                <div className="flex gap-3 pt-1">
                  <Button onClick={handleSaveVehicle} loading={saving} fullWidth>
                    {editId === 'new' ? 'Add Vehicle' : 'Save Changes'}
                  </Button>
                  {canCancel && (
                    <Button onClick={closeForm} variant="secondary" fullWidth>
                      Cancel
                    </Button>
                  )}
                </div>

                {editingVehicle && (
                  <Button
                    onClick={() => setConfirmDeleteId(editId as string)}
                    variant="danger"
                    fullWidth
                  >
                    Delete Vehicle
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Fleet list */}
          {editId === null && allVehicles.length > 0 && (
            <Card padding={false}>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
                {allVehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Tap row to switch active vehicle */}
                    <button
                      onClick={() => switchVehicle(v.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                          v.id === activeId
                            ? 'bg-ios-blue'
                            : 'border-2 border-gray-300 dark:border-white/25'
                        }`}
                      >
                        {v.id === activeId && (
                          <Check size={13} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-black dark:text-white truncate leading-tight">
                          {v.nickname}
                        </p>
                        <p className="text-xs text-ios-gray dark:text-gray-400 truncate">
                          {v.year} {v.make} {v.model}
                          {v.trim ? ` ${v.trim}` : ''}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => openEdit(v)}
                      className="p-2 text-ios-gray dark:text-gray-500 active:text-ios-blue flex-shrink-0"
                      aria-label={`Edit ${v.nickname}`}
                    >
                      <PencilLine size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Appearance */}
        <section>
          <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
            Appearance
          </p>
          <Card padding={false}>
            {/* Light / Dark / System */}
            <div className="flex border-b border-gray-100 dark:border-white/[0.08]">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 transition-colors ${
                    theme === value ? 'text-ios-blue' : 'text-ios-gray dark:text-gray-500'
                  }`}
                >
                  <Icon size={22} strokeWidth={theme === value ? 2.5 : 1.8} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Colour theme swatches */}
            <div className="px-4 pt-3.5 pb-4">
              <p className="text-xs font-medium text-ios-gray dark:text-gray-400 mb-3">
                Colour Theme
              </p>
              <div className="flex justify-between">
                {COLOR_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setColorTheme(t.id)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        colorTheme === t.id
                          ? 'ring-2 ring-white/70 scale-110'
                          : 'opacity-70 active:opacity-90 active:scale-105'
                      }`}
                      style={{ background: t.previewGradient }}
                    >
                      {colorTheme === t.id && (
                        <Check size={16} className="text-white drop-shadow" strokeWidth={3} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium transition-colors ${
                        colorTheme === t.id
                          ? 'text-ios-blue'
                          : 'text-ios-gray dark:text-gray-500'
                      }`}
                    >
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Data */}
        <section>
          <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
            Data
          </p>
          <Card padding={false}>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/50 dark:active:bg-white/[0.05] text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
                  <Download size={18} className="text-ios-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-black dark:text-white">Export Backup</p>
                  <p className="text-xs text-ios-gray dark:text-gray-400">Download all data as JSON</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/50 dark:active:bg-white/[0.05] text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-ios-green/10 flex items-center justify-center flex-shrink-0">
                  <Upload size={18} className="text-ios-green" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-black dark:text-white">Import Backup</p>
                  <p className="text-xs text-ios-gray dark:text-gray-400">Restore from a JSON backup file</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />

              <button
                onClick={() => setConfirmReseed(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/50 dark:active:bg-white/[0.05] text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-50 dark:bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={18} className="text-ios-yellow" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-black dark:text-white">Load Demo Data</p>
                  <p className="text-xs text-ios-gray dark:text-gray-400">Reset to 2002 Civic SiR sample data</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
              </button>
            </div>
          </Card>
        </section>

        {/* Service History */}
        <section>
          <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
            Service History
          </p>
          <Card padding={false}>
            <button
              onClick={handleExportPDF}
              disabled={!vehicle}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/50 dark:active:bg-white/[0.05] text-left disabled:opacity-40"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-400/10 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-black dark:text-white">Export as PDF</p>
                <p className="text-xs text-ios-gray dark:text-gray-400">
                  Share a formatted service history report
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-white/25" />
            </button>
          </Card>
        </section>

        {/* Danger zone */}
        <section>
          <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
            Danger Zone
          </p>
          <Button onClick={() => setConfirmClear(true)} variant="danger" fullWidth>
            Clear All Data
          </Button>
        </section>

        {/* About */}
        <section>
          <p className="text-xs font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
            About
          </p>
          <Card>
            <p className="text-[15px] font-semibold text-black dark:text-white">MotoTrack</p>
            <p className="text-sm text-ios-gray dark:text-gray-400">v{__APP_VERSION__}</p>
            <p className="text-xs text-ios-gray dark:text-gray-500 mt-2">
              All data is stored locally on your device using IndexedDB. No account required. No data leaves your device.
            </p>
          </Card>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900/80 backdrop-blur-xl border border-white/[0.12] text-white rounded-2xl text-sm font-medium shadow-glass-dark animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Vehicle?"
        message="This will permanently delete this vehicle and all its service records, fuel logs, and reminders."
        confirmLabel="Delete"
        onConfirm={() => confirmDeleteId && handleDeleteVehicle(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={confirmReseed}
        title="Load Demo Data?"
        message="This will replace ALL current data with the sample 2002 Civic SiR dataset."
        confirmLabel="Load Demo Data"
        destructive={false}
        onConfirm={handleReseed}
        onCancel={() => setConfirmReseed(false)}
      />

      <ConfirmDialog
        isOpen={confirmClear}
        title="Clear All Data?"
        message="This permanently deletes all vehicles, services, fuel records, and reminders."
        confirmLabel="Clear Everything"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
