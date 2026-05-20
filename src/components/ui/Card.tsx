interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', padding = true, onClick }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      className={`bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-ios dark:bg-white/[0.04] dark:border-white/[0.08] dark:shadow-none rounded-2xl overflow-hidden ${onClick ? 'active:scale-[0.98] cursor-pointer transition-transform' : ''} ${padding ? 'p-4' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
