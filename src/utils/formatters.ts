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
