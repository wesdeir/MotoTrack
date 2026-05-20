import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  accent?: 'blue' | 'green' | 'red' | 'orange';
  onClick?: () => void;
}

const ACCENT_CLS = {
  blue: 'text-ios-blue',
  green: 'text-ios-green',
  red: 'text-ios-red',
  orange: 'text-ios-orange',
};

export default function StatCard({ label, value, subValue, accent = 'blue', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-ios dark:bg-white/[0.04] dark:border-white/[0.08] dark:shadow-none rounded-2xl p-4 ${onClick ? 'cursor-pointer active:opacity-75' : ''}`}
    >
      {onClick && (
        <ChevronRight size={12} className="absolute top-3.5 right-3 text-gray-300 dark:text-white/25" />
      )}
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
