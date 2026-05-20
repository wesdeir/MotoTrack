import { useState, useMemo } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { useVehicle } from '../../hooks/useVehicle';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useFuel } from '../../hooks/useFuel';
import { useReminders } from '../../hooks/useReminders';
import { calculateAvgKmPerDay } from '../../utils/fuelCalc';
import { CATEGORY_LIST, type MaintenanceCategory, type MaintenanceRecord } from '../../models';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import MaintenanceItem from '../../components/features/MaintenanceItem';
import ReminderCard from '../../components/features/ReminderCard';
import MaintenanceForm from './MaintenanceForm';

export default function MaintenancePage() {
  const { vehicle } = useVehicle();
  const { records, addRecord, updateRecord, deleteRecord } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);

  const avgKmPerDay = useMemo(() => calculateAvgKmPerDay(fuel), [fuel]);
  const { reminders } = useReminders(vehicle?.id, vehicle?.currentOdometer ?? 0, avgKmPerDay);

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRecord | null>(null);
  const [filter, setFilter] = useState<MaintenanceCategory | 'all'>('all');
  const [tab, setTab] = useState<'log' | 'reminders'>('log');

  const filtered = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.category === filter)),
    [records, filter],
  );

  const usedCategories = useMemo(
    () => CATEGORY_LIST.filter((c) => records.some((r) => r.category === c.value)),
    [records],
  );

  const openNew = () => { setSelected(null); setFormOpen(true); };
  const openEdit = (r: MaintenanceRecord) => { setSelected(r); setFormOpen(true); };

  const handleSave = async (data: Parameters<typeof addRecord>[0]) => {
    if (selected) {
      await updateRecord(selected.id, data);
    } else {
      await addRecord(data);
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (selected) await deleteRecord(selected.id);
    setFormOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Maintenance"
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="px-4 pt-1 pb-2 flex gap-2">
        {(['log', 'reminders'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-ios-blue text-white'
                : 'bg-white dark:bg-ios-dark-card text-ios-gray dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
            }`}
          >
            {t === 'log' ? 'Service Log' : `Reminders${reminders.length ? ` (${reminders.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'log' ? (
        <>
          {/* Category filter */}
          {usedCategories.length > 1 && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-ios-blue text-white'
                      : 'bg-white dark:bg-ios-dark-card text-ios-gray dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
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
                        : 'bg-white dark:bg-ios-dark-card text-ios-gray dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
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
                title="No service records"
                description="Tap Add to log your first maintenance entry."
                action={{ label: 'Log Service', onClick: openNew }}
              />
            ) : (
              <Card padding={false}>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filtered.map((r) => (
                    <MaintenanceItem key={r.id} record={r} onClick={() => openEdit(r)} />
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
              description="Reminders are added automatically when you log a service with a next-due date or km."
            />
          ) : (
            <Card padding={false}>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {reminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} />
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
    </div>
  );
}
