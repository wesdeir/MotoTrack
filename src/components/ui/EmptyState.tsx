import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="min-h-full flex-1 flex flex-col items-center justify-center py-12 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm border border-gray-200/60 dark:border-white/[0.08] flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400 dark:text-white/40" />
      </div>
      <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-ios-gray dark:text-gray-500 mb-6 max-w-xs">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
