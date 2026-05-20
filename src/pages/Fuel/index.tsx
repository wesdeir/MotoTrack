import { useState, useMemo } from 'react';
import { Plus, Droplets } from 'lucide-react';
import { useVehicle } from '../../hooks/useVehicle';
import { useFuel } from '../../hooks/useFuel';
import {
  calculateAverageFuelEconomy,
  calculateTotalFuelSpend,
} from '../../utils/fuelCalc';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import FuelItem from '../../components/features/FuelItem';
import FuelForm from './FuelForm';
import type { FuelRecord } from '../../models';

export default function FuelPage() {
  const { vehicle } = useVehicle();
  const { records, addRecord, updateRecord, deleteRecord } = useFuel(vehicle?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<FuelRecord | null>(null);

  const avgEconomy = useMemo(() => calculateAverageFuelEconomy(records), [records]);
  const totalSpend = useMemo(() => calculateTotalFuelSpend(records), [records]);
  const lastFull = useMemo(
    () => records.find((r) => r.lPer100km != null) ?? null,
    [records],
  );

  const openNew = () => { setSelected(null); setFormOpen(true); };
  const openEdit = (r: FuelRecord) => { setSelected(r); setFormOpen(true); };

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
        title="Fuel Log"
        subtitle={`${records.length} fill-up${records.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={openNew} size="sm">
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        }
      />

      {records.length > 0 && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-3">
          <StatCard
            label="Avg Economy"
            value={avgEconomy != null ? `${avgEconomy.toFixed(1)}` : '—'}
            subValue="L / 100 km"
            accent="blue"
          />
          <StatCard
            label="Total Fuel Spend"
            value={formatCurrency(totalSpend)}
            subValue="all time"
            accent="green"
          />
        </div>
      )}

      {records.length > 0 && lastFull && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-3">
          <StatCard
            label="Last Tank Economy"
            value={lastFull.lPer100km != null ? `${lastFull.lPer100km.toFixed(1)}` : '—'}
            subValue="L / 100 km"
            accent="blue"
          />
          <StatCard
            label="Last Fill Cost"
            value={formatCurrency(records[0]?.totalCost ?? 0)}
            subValue={records[0]?.litres ? `${records[0].litres.toFixed(1)} L` : ''}
            accent="green"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4">
        {records.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="No fuel records"
            description="Tap Add to log your first fill-up and start tracking fuel economy."
            action={{ label: 'Log Fill-Up', onClick: openNew }}
          />
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {records.map((r) => (
                <FuelItem key={r.id} record={r} onClick={() => openEdit(r)} />
              ))}
            </div>
          </Card>
        )}
      </div>

      <FuelForm
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
