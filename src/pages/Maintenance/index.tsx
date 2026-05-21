import { useState, useMemo } from 'react';
import { Plus, Wrench, Search, X } from 'lucide-react';
import ReceiptViewer from '../../components/ui/ReceiptViewer';
import { useVehicle } from '../../hooks/useVehicle';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useFuel } from '../../hooks/useFuel';
import { useReminders } from '../../hooks/useReminders';
import { calculateAvgKmPerDay } from '../../utils/fuelCalc';
import { buildLastShopMap } from '../../utils/maintenanceCalc';
import { CATEGORY_LIST, type MaintenanceCategory, type MaintenanceRecord, type ReminderWithStatus } from '../../models';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import MaintenanceItem from '../../components/features/MaintenanceItem';
import ReminderCard from '../../components/features/ReminderCard';
import ReminderSuggestion, { getDefaultInterval } from '../../components/features/ReminderSuggestion';
import ReminderForm from '../../components/features/ReminderForm';
import MaintenanceForm from './MaintenanceForm';
import TimelineView from './TimelineView';

export default function MaintenancePage() {
  const { vehicle } = useVehicle();
  const { records, addRecord, updateRecord, deleteRecord } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);

  const avgKmPerDay = useMemo(() => calculateAvgKmPerDay(fuel), [fuel]);
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders(
    vehicle?.id,
    vehicle?.currentOdometer ?? 0,
    avgKmPerDay,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRecord | null>(null);
  const [filter, setFilter] = useState<MaintenanceCategory | 'all'>('all');
  const [tab, setTab] = useState<'log' | 'timeline' | 'reminders'>('log');
  const [viewingReceipt, setViewingReceipt] = useState<MaintenanceRecord | null>(null);
  const [search, setSearch] = useState('');
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithStatus | null>(null);

  const [pendingSuggestion, setPendingSuggestion] = useState<{
    category: MaintenanceCategory;
    title: string;
    odometer: number;
    date: Date;
  } | null>(null);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.shop?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q),
    );
  }, [records, search]);

  const filtered = useMemo(
    () => (filter === 'all' ? searched : searched.filter((r) => r.category === filter)),
    [searched, filter],
  );

  const lastShopMap = useMemo(() => buildLastShopMap(records), [records]);

  const usedCategories = useMemo(
    () => CATEGORY_LIST.filter((c) => records.some((r) => r.category === c.value)),
    [records],
  );

  const existingReminder = useMemo(
    () => pendingSuggestion
      ? reminders.find((r) => r.serviceType === pendingSuggestion.category)
      : undefined,
    [pendingSuggestion, reminders],
  );

  const openNew = () => { setSelected(null); setFormOpen(true); };
  const openEdit = (r: MaintenanceRecord) => { setSelected(r); setFormOpen(true); };
  const openNewReminder = () => { setSelectedReminder(null); setReminderFormOpen(true); };
  const openEditReminder = (r: ReminderWithStatus) => { setSelectedReminder(r); setReminderFormOpen(true); };

  const handleSaveReminder = async (data: Parameters<typeof addReminder>[0]) => {
    if (selectedReminder) {
      await updateReminder(selectedReminder.id, data);
    } else {
      await addReminder(data);
    }
    setReminderFormOpen(false);
  };

  const handleDeleteReminder = async () => {
    if (selectedReminder) await deleteReminder(selectedReminder.id);
    setReminderFormOpen(false);
  };

  const handleSave = async (data: Parameters<typeof addRecord>[0]) => {
    if (selected) {
      await updateRecord(selected.id, data);
      setFormOpen(false);
    } else {
      await addRecord(data);
      setFormOpen(false);
      if (getDefaultInterval(data.category)) {
        setPendingSuggestion({
          category: data.category,
          title: data.title,
          odometer: data.odometer,
          date: data.date,
        });
      }
    }
  };

  const handleDelete = async () => {
    if (selected) await deleteRecord(selected.id);
    setFormOpen(false);
  };

  const handleSuggestionAccept = async () => {
    if (!pendingSuggestion || !vehicle) return;
    const interval = getDefaultInterval(pendingSuggestion.category)!;

    if (existingReminder) {
      await updateReminder(existingReminder.id, {
        lastServiceOdometer: pendingSuggestion.odometer,
        lastServiceDate: pendingSuggestion.date,
      });
    } else {
      await addReminder({
        vehicleId: vehicle.id,
        serviceType: pendingSuggestion.category,
        title: pendingSuggestion.title,
        mode: interval.km > 0 ? 'km' : 'months',
        intervalKm: interval.km > 0 ? interval.km : undefined,
        intervalMonths: interval.km === 0 ? 12 : undefined,
        lastServiceOdometer: pendingSuggestion.odometer,
        lastServiceDate: pendingSuggestion.date,
        isActive: true,
      });
    }
    setPendingSuggestion(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Maintenance"
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={tab === 'reminders' ? openNewReminder : openNew} size="sm">
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="px-4 pt-1 pb-2 flex gap-2">
        {(
          [
            { value: 'log',       label: 'Log' },
            { value: 'timeline',  label: 'Timeline' },
            { value: 'reminders', label: `Reminders${reminders.length ? ` (${reminders.length})` : ''}` },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === value
                ? 'bg-ios-blue text-white'
                : 'bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.06] dark:border-white/[0.10] text-ios-gray dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'timeline' ? (
        <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4">
          <TimelineView
            maintenanceRecords={records}
            fuelRecords={fuel}
            onEditMaintenance={openEdit}
            onViewReceipt={(r) => setViewingReceipt(r)}
          />
        </div>
      ) : tab === 'log' ? (
        <>
          {/* Search bar */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-gray dark:text-gray-400 pointer-events-none"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services…"
                className="w-full pl-9 pr-8 py-2.5 bg-white/40 dark:bg-white/[0.07] border border-white/60 dark:border-white/[0.10] rounded-xl text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ios-blue/40 focus:border-ios-blue transition-colors text-[15px]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ios-gray dark:text-gray-400"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Category filter */}
          {usedCategories.length > 1 && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-ios-blue text-white'
                      : 'bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.06] dark:border-white/[0.10] text-ios-gray dark:text-gray-400'
                  }`}
                >
                  All
                </button>
                {usedCategories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFilter(c.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === c.value
                        ? 'bg-ios-blue text-white'
                        : 'bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.06] dark:border-white/[0.10] text-ios-gray dark:text-gray-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title={search ? 'No matching records' : 'No service records'}
                description={
                  search
                    ? 'Try a different search term.'
                    : 'Tap Add to log your first maintenance entry.'
                }
                action={search ? undefined : { label: 'Log Service', onClick: openNew }}
              />
            ) : (
              <Card padding={false}>
                <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
                  {filtered.map((r) => (
                    <MaintenanceItem
                      key={r.id}
                      record={r}
                      onClick={() => openEdit(r)}
                      onViewReceipt={() => setViewingReceipt(r)}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4">
          {reminders.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No reminders"
              description="Add a reminder to track when any service is due, or log a service with a next-due date."
              action={{ label: 'Add Reminder', onClick: openNewReminder }}
            />
          ) : (
            <Card padding={false}>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.07]">
                {reminders.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onClick={() => openEditReminder(r)}
                    lastServiceShop={lastShopMap.get(r.serviceType)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <MaintenanceForm
        isOpen={formOpen}
        record={selected}
        vehicleId={vehicle?.id ?? ''}
        currentOdometer={vehicle?.currentOdometer ?? 0}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setFormOpen(false)}
      />

      {pendingSuggestion && (
        <ReminderSuggestion
          category={pendingSuggestion.category}
          serviceTitle={pendingSuggestion.title}
          existingReminder={existingReminder}
          onAccept={handleSuggestionAccept}
          onSkip={() => setPendingSuggestion(null)}
        />
      )}

      <ReminderForm
        isOpen={reminderFormOpen}
        reminder={selectedReminder}
        vehicleId={vehicle?.id ?? ''}
        currentOdometer={vehicle?.currentOdometer ?? 0}
        onSave={handleSaveReminder}
        onDelete={handleDeleteReminder}
        onClose={() => setReminderFormOpen(false)}
      />

      {viewingReceipt?.receiptImage && (
        <ReceiptViewer
          dataUrl={viewingReceipt.receiptImage}
          fileName={viewingReceipt.receiptFileName}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}
