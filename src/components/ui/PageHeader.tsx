interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between px-4 pb-2 bg-ios-bg dark:bg-ios-dark-bg"
      style={{ paddingTop: `calc(1rem + var(--safe-top))` }}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] font-bold text-black dark:text-white leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-ios-gray dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-3 mt-1">{action}</div>}
    </div>
  );
}
