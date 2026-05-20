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
      className={`bg-white dark:bg-white/[0.04] dark:backdrop-blur-md dark:border dark:border-white/[0.08] rounded-2xl shadow-ios dark:shadow-none overflow-hidden ${onClick ? 'active:scale-[0.98] cursor-pointer transition-transform' : ''} ${padding ? 'p-4' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
