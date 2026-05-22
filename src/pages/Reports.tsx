import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
// recharts is large (~280KB) but only used here; it will be in its own chunk once
// App.tsx lazy-loads this page via React.lazy()
import { useVehicle } from '../hooks/useVehicle';
import { useMaintenance } from '../hooks/useMaintenance';
import { useFuel } from '../hooks/useFuel';
import { useTheme } from '../context/ThemeContext';
import {
  calculateTotalMaintenanceSpend,
  calculateSpendByCategory,
  getMostExpensiveRepair,
  getLastServiceByCategory,
  getMonthlyMaintenanceSpend,
} from '../utils/maintenanceCalc';
import {
  calculateAverageFuelEconomy,
  calculateTotalFuelSpend,
  getFuelEconomyByMonth,
  getMonthlyFuelSpend,
  detectEconomyAnomalies,
} from '../utils/fuelCalc';
import { calculateCostPerKm } from '../utils/costOfOwnership';
import {
  formatCurrency,
  formatDate,
  formatOdometer,
  formatMonthLabel,
  formatMonthLong,
} from '../utils/formatters';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { BarChart2 } from 'lucide-react';
import { useTutorialHighlight } from '../hooks/useTutorialHighlight';

type BreakdownType = 'maintenance' | 'fuel' | 'economy' | 'total';

export default function ReportsPage() {
  const { vehicle } = useVehicle();
  const { records: maintenance } = useMaintenance(vehicle?.id);
  const { records: fuel } = useFuel(vehicle?.id);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const hlStats = useTutorialHighlight('reports-stats');

  const totalMaint = useMemo(() => calculateTotalMaintenanceSpend(maintenance), [maintenance]);
  const totalFuel = useMemo(() => calculateTotalFuelSpend(fuel), [fuel]);
  const avgEconomy = useMemo(() => calculateAverageFuelEconomy(fuel), [fuel]);
  const costPerKm = useMemo(
    () => vehicle ? calculateCostPerKm(maintenance, fuel, vehicle.currentOdometer) : null,
    [maintenance, fuel, vehicle],
  );
  const anomalyIds = useMemo(() => detectEconomyAnomalies(fuel), [fuel]);
  const recentAnomalyCount = useMemo(
    () => fuel.slice(0, 5).filter((r) => anomalyIds.has(r.id)).length,
    [fuel, anomalyIds],
  );
  const mostExpensive = useMemo(() => getMostExpensiveRepair(maintenance), [maintenance]);
  const lastOilChange = useMemo(() => getLastServiceByCategory(maintenance, 'oil-change'), [maintenance]);
  const spendByCategory = useMemo(() => calculateSpendByCategory(maintenance), [maintenance]);

  // Shared monthly aggregations — computed once, reused by both chart and breakdown modal
  const maintMonthly = useMemo(() => getMonthlyMaintenanceSpend(maintenance), [maintenance]);
  const fuelMonthly = useMemo(() => getMonthlyFuelSpend(fuel), [fuel]);
  const fuelEconomyMonthly = useMemo(() => getFuelEconomyByMonth(fuel), [fuel]);

  const fuelEconomyData = useMemo(
    () =>
      fuelEconomyMonthly.map((m) => ({
        month: formatMonthLabel(m.month),
        'L/100km': parseFloat(m.lPer100km.toFixed(2)),
      })),
    [fuelEconomyMonthly],
  );

  const monthlyData = useMemo(() => {
    const allMonths = Array.from(
      new Set([...maintMonthly.map((m) => m.month), ...fuelMonthly.map((f) => f.month)]),
    ).sort();
    return allMonths.slice(-12).map((month) => ({
      month: formatMonthLabel(month),
      Maintenance: parseFloat((maintMonthly.find((m) => m.month === month)?.spend ?? 0).toFixed(2)),
      Fuel: parseFloat((fuelMonthly.find((f) => f.month === month)?.spend ?? 0).toFixed(2)),
    }));
  }, [maintMonthly, fuelMonthly]);

  const [breakdownType, setBreakdownType] = useState<BreakdownType | null>(null);

  const breakdownData = useMemo(() => {
    if (!breakdownType) return null;

    if (breakdownType === 'maintenance') {
      return {
        title: 'Maintenance by Month',
        rows: [...maintMonthly]
          .reverse()
          .map((m) => ({ label: formatMonthLong(m.month), value: formatCurrency(m.spend) })),
      };
    }
    if (breakdownType === 'fuel') {
      return {
        title: 'Fuel Spend by Month',
        rows: [...fuelMonthly]
          .reverse()
          .map((m) => ({ label: formatMonthLong(m.month), value: formatCurrency(m.spend) })),
      };
    }
    if (breakdownType === 'economy') {
      return {
        title: 'Fuel Economy by Month',
        rows: [...fuelEconomyMonthly]
          .reverse()
          .map((m) => ({ label: formatMonthLong(m.month), value: `${m.lPer100km.toFixed(1)} L/100km` })),
      };
    }
    // total
    const mMap = Object.fromEntries(maintMonthly.map((m) => [m.month, m.spend]));
    const fMap = Object.fromEntries(fuelMonthly.map((f) => [f.month, f.spend]));
    const months = [...new Set([...Object.keys(mMap), ...Object.keys(fMap)])].sort((a, b) =>
      b.localeCompare(a),
    );
    return {
      title: 'Total Spend by Month',
      rows: months.map((month) => ({
        label: formatMonthLong(month),
        value: formatCurrency((mMap[month] ?? 0) + (fMap[month] ?? 0)),
      })),
    };
  }, [breakdownType, maintMonthly, fuelMonthly, fuelEconomyMonthly]);

  const textColor = dark ? '#98989F' : '#6C6C70';
  const gridColor = dark ? '#3A3A3C' : '#E5E5EA';

  const tooltipStyle = useMemo(() => ({
    backgroundColor: dark ? '#1C1C1E' : '#fff',
    border: `1px solid ${dark ? '#3A3A3C' : '#E5E5EA'}`,
    color: dark ? '#fff' : '#000',
    borderRadius: '12px',
    fontSize: '13px',
  }), [dark]);

  if (maintenance.length === 0 && fuel.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Reports" />
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          description="Add maintenance records and fuel fill-ups to see your stats here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      <PageHeader title="Reports" subtitle="Lifetime statistics" />

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-6 space-y-5">
        <div className={`grid grid-cols-2 gap-3 rounded-2xl ${hlStats}`}>
          <StatCard
            label="Maintenance"
            value={formatCurrency(totalMaint)}
            subValue="all time"
            accent="blue"
            onClick={() => setBreakdownType('maintenance')}
          />
          <StatCard
            label="Fuel"
            value={formatCurrency(totalFuel)}
            subValue="all time"
            accent="green"
            onClick={() => setBreakdownType('fuel')}
          />
          <StatCard
            label="Avg Economy"
            value={avgEconomy != null ? `${avgEconomy.toFixed(1)} L/100` : '—'}
            accent="blue"
            onClick={() => setBreakdownType('economy')}
          />
          <StatCard
            label="Total Spent"
            value={formatCurrency(totalMaint + totalFuel)}
            subValue="maintenance + fuel"
            accent="orange"
            onClick={() => setBreakdownType('total')}
          />
          <StatCard
            label="Cost / km"
            value={costPerKm != null ? formatCurrency(costPerKm) : '—'}
            subValue={costPerKm != null ? 'all costs included' : 'need 2+ fill-ups'}
            accent="blue"
          />
        </div>

        {/* Fuel efficiency insight */}
        {recentAnomalyCount > 0 && fuel.length >= 5 && (
          <Card>
            <p className="text-[11px] font-semibold text-ios-orange uppercase tracking-wide mb-1">
              Fuel Efficiency Notice
            </p>
            <p className="text-[15px] font-semibold text-black dark:text-white">
              {recentAnomalyCount === 1 ? '1 recent fill-up' : `${recentAnomalyCount} recent fill-ups`} above average
            </p>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-1">
              Higher than normal fuel consumption detected. Check tire pressure, air filter, or driving patterns.
            </p>
          </Card>
        )}

        {/* Highlight cards */}
        {mostExpensive && (
          <Card>
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide mb-1">
              Most Expensive Repair
            </p>
            <p className="text-[15px] font-semibold text-black dark:text-white">
              {mostExpensive.title}
            </p>
            <p className="text-2xl font-bold text-ios-red mt-0.5">
              {formatCurrency(mostExpensive.totalCost)}
            </p>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-1">
              {formatDate(mostExpensive.date)} · {formatOdometer(mostExpensive.odometer)}
            </p>
          </Card>
        )}

        {lastOilChange && (
          <Card>
            <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide mb-1">
              Last Oil Change
            </p>
            <p className="text-[15px] font-semibold text-black dark:text-white">
              {formatDate(lastOilChange.date)} · {formatOdometer(lastOilChange.odometer)}
            </p>
            {lastOilChange.nextDueKm && (
              <p className="text-sm text-ios-blue mt-1">
                Next due: {formatOdometer(lastOilChange.nextDueKm)}
              </p>
            )}
          </Card>
        )}

        {/* Monthly spend chart */}
        {monthlyData.length > 0 && (
          <Card>
            <p className="text-[15px] font-bold text-black dark:text-white mb-4">
              Monthly Spend
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => formatCurrency(v)}
                  cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: textColor }}
                />
                <Bar dataKey="Maintenance" stackId="a" fill="#007AFF" />
                <Bar dataKey="Fuel" stackId="a" fill="#34C759" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Fuel economy trend */}
        {fuelEconomyData.length > 1 && (
          <Card>
            <p className="text-[15px] font-bold text-black dark:text-white mb-4">
              Fuel Economy Trend
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={fuelEconomyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} unit="L" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(1)} L/100km`, 'Economy']}
                  cursor={{ stroke: dark ? '#555' : '#ccc' }}
                />
                <Line
                  type="monotone"
                  dataKey="L/100km"
                  stroke="#007AFF"
                  strokeWidth={2.5}
                  dot={{ fill: '#007AFF', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Spend by category */}
        {spendByCategory.length > 0 && (
          <Card>
            <p className="text-[15px] font-bold text-black dark:text-white mb-4">
              Spend by Category
            </p>
            <div className="space-y-3">
              {spendByCategory.map(({ category, label, total }) => {
                const max = spendByCategory[0].total;
                const pct = (total / max) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-black dark:text-white">{label}</span>
                      <span className="text-sm font-semibold text-black dark:text-white">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-ios-blue"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Monthly breakdown modal */}
      {breakdownData && (
        <Modal
          isOpen={breakdownType !== null}
          onClose={() => setBreakdownType(null)}
          title={breakdownData.title}
        >
          <div className="px-5 py-2 pb-6">
            {breakdownData.rows.length === 0 ? (
              <p className="text-sm text-ios-gray dark:text-gray-400 text-center py-10">
                No data yet
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                {breakdownData.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <span className="text-[15px] text-black dark:text-white">{row.label}</span>
                    <span className="text-[15px] font-semibold text-black dark:text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
