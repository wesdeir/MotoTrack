const inputCls =
  'w-full px-3.5 py-3 bg-white/50 dark:bg-white/[0.07] border border-white/70 dark:border-white/[0.10] rounded-xl text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ios-blue/40 focus:border-ios-blue transition-colors';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-ios-red ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ios-gray dark:text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-ios-red">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputCls} ${className}`} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select className={`${inputCls} ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputCls} resize-none ${className}`} rows={3} {...props} />;
}
