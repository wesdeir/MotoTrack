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
      className={`bg-white dark:bg-ios-dark-card rounded-2xl shadow-ios overflow-hidden ${onClick ? 'active:scale-[0.98] cursor-pointer transition-transform' : ''} ${padding ? 'p-4' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
