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
      className={`bg-white/40 backdrop-blur-2xl border border-white/60 shadow-glass dark:bg-white/[0.06] dark:border-white/[0.12] dark:shadow-glass-dark rounded-2xl overflow-hidden ${onClick ? 'active:scale-[0.98] cursor-pointer transition-transform' : ''} ${padding ? 'p-4' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
