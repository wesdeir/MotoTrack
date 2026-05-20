import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANTS = {
  primary: 'bg-ios-blue text-white active:bg-blue-600',
  secondary: 'bg-gray-100 dark:bg-ios-dark-secondary text-black dark:text-white active:bg-gray-200 dark:active:bg-zinc-700',
  danger: 'bg-ios-red text-white active:bg-red-700',
  ghost: 'text-ios-blue active:bg-blue-50 dark:active:bg-blue-900/20',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm h-8 rounded-xl',
  md: 'px-5 py-2.5 text-[15px] h-10 rounded-xl',
  lg: 'px-6 py-3 text-base h-12 rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, children, disabled, className = '', ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin mr-2" />}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
export default Button;
