import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Wrench, Droplets, FolderOpen } from 'lucide-react';
import Button from '../components/ui/Button';
import { useVehicle } from '../hooks/useVehicle';
import { useMaintenance } from '../hooks/useMaintenance';
import { useFuel } from '../hooks/useFuel';
import { useReminders } from '../hooks/useReminders';
import { useDocuments } from '../hooks/useDocuments';
import GloveBox from './GloveBox';
import {
  calculateTotalMaintenanceSpend,
  getRecentRecords,
} from '../utils/maintenanceCalc';
import {
  calculateAvgKmPerDay,
  calculateTotalFuelSpend,
} from '../utils/fuelCalc';
import { calculateCostPerKm } from '../utils/costOfOwnership';
import { getUrgentReminders } from '../utils/reminderLogic';
import { formatOdometer, formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ReminderCard from '../components/features/ReminderCard';
import MaintenanceItem from '../components/features/MaintenanceItem';
import FuelItem from '../components/features/FuelItem';
import MaintenanceForm from './Maintenance/MaintenanceForm';
import FuelForm from './Fuel/FuelForm';

export default function Dashboard() {
  const { vehicle } = useVehicle();
  const { records: maintenance, addRecord: addMaintenanceRecord } = useMaintenance(vehicle?.id);
  const { records: fuel, addRecord: addFuelRecord } = useFuel(vehicle?.id);

  const avgKmPerDay = useMemo(() => calculateAvgKmPerDay(fuel), [fuel]);
  const { reminders } = useReminders(vehicle?.id, vehicle?.currentOdometer ?? 0, avgKmPerDay);

  const urgentReminders = useMemo(() => getUrgentReminders(reminders), [reminders]);
  const recentMaintenance = useMemo(() => getRecentRecords(maintenance, 3), [maintenance]);
  const recentFuel = useMemo(() => fuel.slice(0, 3), [fuel]);
  const totalMainSpend = useMemo(() => calculateTotalMaintenanceSpend(maintenance), [maintenance]);
  const totalFuelSpend = useMemo(() => calculateTotalFuelSpend(fuel), [fuel]);
  const costPerKm = useMemo(
    () => vehicle ? calculateCostPerKm(maintenance, fuel, vehicle.currentOdometer) : null,
    [maintenance, fuel, vehicle],
  );
  const lastFuel = fuel[0] ?? null;
  const { documents } = useDocuments(vehicle?.id);

  const thisYearSpend = useMemo(() => {
    const year = new Date().getFullYear();
    const mSpend = maintenance
      .filter((r) => new Date(r.date).getFullYear() === year)
      .reduce((s, r) => s + r.totalCost, 0);
    const fSpend = fuel
      .filter((r) => new Date(r.date).getFullYear() === year)
      .reduce((s, r) => s + r.totalCost, 0);
    return mSpend + fSpend;
  }, [maintenance, fuel]);

  const nextDueReminder = reminders[0] ?? null;
  const hasExpiringDoc = documents.some((d) => {
    if (!d.expiresAt) return false;
    return (d.expiresAt.getTime() - Date.now()) / 86400000 <= 30;
  });

  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [fuelFormOpen, setFuelFormOpen] = useState(false);
  const [gloveBoxOpen, setGloveBoxOpen] = useState(false);

  if (vehicle === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ios-gray">Loading…</p>
      </div>
    );
  }

  if (vehicle === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">🚗</div>
        <h2 className="text-xl font-bold text-black dark:text-white mb-2">No vehicle added</h2>
        <p className="text-sm text-ios-gray dark:text-gray-400 mb-6">
          Head to Settings to add your first vehicle.
        </p>
        <Link to="/settings">
          <Button>Go to Settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="px-4 space-y-5 pb-4"
      style={{ paddingTop: `calc(1rem + var(--safe-top))` }}
    >
      {/* Vehicle card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
              {vehicle.year} {vehicle.make}
            </p>
            <h2 className="text-xl font-bold text-black dark:text-white mt-1 leading-tight">
              {vehicle.nickname}
            </h2>
            <p className="text-sm text-ios-gray dark:text-gray-400 mt-0.5">
              {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ''}
            </p>
            {vehicle.engine && (
              <p className="text-xs text-ios-gray dark:text-gray-500 mt-0.5">{vehicle.engine}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-4 text-right">
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide">
              Odometer
            </p>
            <p className="text-lg font-bold text-black dark:text-white mt-1">
              {formatOdometer(vehicle.currentOdometer)}
            </p>
          </div>
        </div>

        {/* Card detail rows */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.08] space-y-2">
          {thisYearSpend > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ios-gray dark:text-gray-400">This year</span>
              <span className="text-xs font-semibold text-black dark:text-white">{formatCurrency(thisYearSpend)}</span>
            </div>
          )}
          {nextDueReminder && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ios-gray dark:text-gray-400">Next due</span>
              <span className="text-xs font-semibold text-black dark:text-white truncate ml-4 text-right">{nextDueReminder.title}</span>
            </div>
          )}
          <button
            onClick={() => setGloveBoxOpen(true)}
            className="flex items-center justify-between w-full active:opacity-70"
          >
            <span className="flex items-center gap-1.5 text-xs text-ios-gray dark:text-gray-400">
              <FolderOpen size={12} />
              Documents
              {hasExpiringDoc && <span className="w-1.5 h-1.5 rounded-full bg-ios-orange" />}
            </span>
            <span className="text-xs font-semibold text-ios-blue">
              {documents.length > 0 ? `${documents.length} file${documents.length !== 1 ? 's' : ''}` : 'Add'}
            </span>
          </button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setServiceFormOpen(true)}
        >
          <Wrench size={15} className="mr-1.5 text-ios-blue" />
          Log Service
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setFuelFormOpen(true)}
        >
          <Droplets size={15} className="mr-1.5 text-ios-green" />
          Add Fuel
        </Button>
      </div>

      {/* Action needed */}
      {urgentReminders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] font-bold text-black dark:text-white flex items-center gap-2">
              Action Needed
              <span className="w-5 h-5 rounded-full bg-ios-red text-white text-xs font-bold inline-flex items-center justify-center">
                {urgentReminders.length}
              </span>
            </h2>
            <Link to="/maintenance" className="text-ios-blue text-sm">
              All Reminders
            </Link>
          </div>
          <Card padding={false}>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
              {urgentReminders.map((r) => (
                <ReminderCard key={r.id} reminder={r} />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Maintenance Spend"
          value={formatCurrency(totalMainSpend)}
          subValue="all time"
          accent="blue"
        />
        <StatCard
          label="Fuel Spend"
          value={formatCurrency(totalFuelSpend)}
          subValue="all time"
          accent="green"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Cost / km"
          value={costPerKm != null ? `$${costPerKm.toFixed(2)}` : '—'}
          subValue={costPerKm != null ? 'all costs' : 'need 2+ fill-ups'}
          accent="blue"
        />
        <StatCard
          label="Last Fill-Up"
          value={lastFuel ? formatCurrency(lastFuel.totalCost) : '—'}
          subValue={lastFuel ? formatDate(lastFuel.date) : 'No data'}
          accent="green"
        />
      </div>

      {/* Recent maintenance */}
      {recentMaintenance.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] font-bold text-black dark:text-white">Recent Services</h2>
            <Link
              to="/maintenance"
              className="text-ios-blue text-sm flex items-center gap-0.5"
            >
              All <ChevronRight size={14} />
            </Link>
          </div>
          <Card padding={false}>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
              {recentMaintenance.map((r) => (
                <MaintenanceItem key={r.id} record={r} />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Recent fuel */}
      {recentFuel.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] font-bold text-black dark:text-white">Recent Fuel</h2>
            <Link
              to="/fuel"
              className="text-ios-blue text-sm flex items-center gap-0.5"
            >
              All <ChevronRight size={14} />
            </Link>
          </div>
          <Card padding={false}>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
              {recentFuel.map((r) => (
                <FuelItem key={r.id} record={r} />
              ))}
            </div>
          </Card>
        </section>
      )}

      <MaintenanceForm
        isOpen={serviceFormOpen}
        record={null}
        vehicleId={vehicle.id}
        currentOdometer={vehicle.currentOdometer}
        onSave={async (data) => { await addMaintenanceRecord(data); setServiceFormOpen(false); }}
        onDelete={async () => { setServiceFormOpen(false); }}
        onClose={() => setServiceFormOpen(false)}
      />
      <FuelForm
        isOpen={fuelFormOpen}
        record={null}
        vehicleId={vehicle.id}
        currentOdometer={vehicle.currentOdometer}
        onSave={async (data) => { await addFuelRecord(data); setFuelFormOpen(false); }}
        onDelete={async () => { setFuelFormOpen(false); }}
        onClose={() => setFuelFormOpen(false)}
      />
      {gloveBoxOpen && (
        <GloveBox vehicleId={vehicle.id} onClose={() => setGloveBoxOpen(false)} />
      )}
    </div>
  );
}
