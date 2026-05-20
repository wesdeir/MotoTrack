import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { useVehicle } from '../hooks/useVehicle';
import { useMaintenance } from '../hooks/useMaintenance';
import { useFuel } from '../hooks/useFuel';
import { useReminders } from '../hooks/useReminders';
import {
  calculateTotalMaintenanceSpend,
  getRecentRecords,
} from '../utils/maintenanceCalc';
import {
  calculateAverageFuelEconomy,
  calculateAvgKmPerDay,
  calculateTotalFuelSpend,
} from '../utils/fuelCalc';
import { getUrgentReminders } from '../utils/reminderLogic';
import { formatOdometer, formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ReminderCard from '../components/features/ReminderCard';
import MaintenanceItem from '../components/features/MaintenanceItem';
import FuelItem from '../components/features/FuelItem';

export default function Dashboard() {
  const { vehicle } = useVehicle();
  const { records: maintenance } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);

  const avgKmPerDay = useMemo(() => calculateAvgKmPerDay(fuel), [fuel]);
  const { reminders } = useReminders(vehicle?.id, vehicle?.currentOdometer ?? 0, avgKmPerDay);

  const urgentReminders = useMemo(() => getUrgentReminders(reminders), [reminders]);
  const recentMaintenance = useMemo(() => getRecentRecords(maintenance, 3), [maintenance]);
  const recentFuel = useMemo(() => fuel.slice(0, 3), [fuel]);
  const avgEconomy = useMemo(() => calculateAverageFuelEconomy(fuel), [fuel]);
  const totalMainSpend = useMemo(() => calculateTotalMaintenanceSpend(maintenance), [maintenance]);
  const totalFuelSpend = useMemo(() => calculateTotalFuelSpend(fuel), [fuel]);
  const lastFuel = fuel[0] ?? null;

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
      </Card>

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
          label="Avg Fuel Economy"
          value={avgEconomy != null ? `${avgEconomy.toFixed(1)}` : '—'}
          subValue="L / 100 km"
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
    </div>
  );
}
