import { format, formatDistanceToNow, isValid } from 'date-fns';

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatOdometer(km: number): string {
  return `${new Intl.NumberFormat('en-CA').format(Math.round(km))} km`;
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, yyyy');
}

export function formatDateShort(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d');
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(d, 'MMM yy');
}

export function formatMonthLong(key: string): string {
  const [year, month] = key.split('-');
  return format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy');
}

export function formatRelativeDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatLPer100km(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${value.toFixed(1)} L/100km`;
}

export function formatKmPerL(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${value.toFixed(1)} km/L`;
}

export function formatLitres(value: number): string {
  return `${value.toFixed(1)} L`;
}

export function formatPricePerLitre(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toFixed(3)}/L`;
}

export function formatKm(km: number | undefined | null): string {
  if (km == null) return '—';
  return `${new Intl.NumberFormat('en-CA').format(Math.round(km))} km`;
}

export function formatInputDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD form input back into a Date with sensible time:
 *  - If `fallback` is provided and the input string matches it, preserve the
 *    fallback's original time (so editing without changing the date keeps the
 *    record's original timestamp).
 *  - If the input is today, return `new Date()` (current ms-precision timestamp)
 *    so time-aware achievements (e.g. Late-Night Logger) can fire.
 *  - Otherwise (backdated entry), parse as midnight of that day.
 */
export function parseFormDate(input: string, fallback?: Date | string): Date {
  if (fallback != null && formatInputDate(fallback) === input) {
    return new Date(fallback);
  }
  if (input === formatInputDate(new Date())) {
    return new Date();
  }
  return new Date(input);
}
