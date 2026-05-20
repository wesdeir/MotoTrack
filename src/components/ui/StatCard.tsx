interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  accent?: 'blue' | 'green' | 'red' | 'orange';
}

const ACCENT_CLS = {
  blue: 'text-ios-blue',
  green: 'text-ios-green',
  red: 'text-ios-red',
  orange: 'text-ios-orange',
};

export default function StatCard({ label, value, subValue, accent = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-ios-dark-card rounded-2xl p-4 shadow-ios">
      <p className="text-[11px] font-semibold text-ios-gray dark:text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold leading-tight ${ACCENT_CLS[accent]}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-ios-gray dark:text-gray-500 mt-0.5">{subValue}</p>
      )}
    </div>
  );
}
