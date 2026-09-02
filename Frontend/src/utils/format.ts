/** Formatting helpers shared across tables, cards and charts. */

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const inrFull = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

/** ₹45.0L / ₹1.9Cr — used on stat cards and chart tooltips. */
export function formatCurrencyCompact(value: number): string {
  return inrCompact.format(value);
}

/** ₹24,73,800 — used in tables where the exact figure matters. */
export function formatCurrency(value: number): string {
  return inrFull.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** "2026-09-02" -> "2 Sep 2026". Passes through non-date placeholders. */
export function formatDate(value: string): string {
  if (!value || value === '—') return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2026-09-02 10:48" -> "2 Sep 2026, 10:48". */
export function formatDateTime(value: string): string {
  const [datePart, timePart] = value.split(' ');
  const formattedDate = formatDate(datePart);
  return timePart ? `${formattedDate}, ${timePart}` : formattedDate;
}

/** Relative age of a "YYYY-MM-DD HH:mm" timestamp, e.g. "3h ago". */
export function formatRelative(value: string, now = new Date()): string {
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return value;

  const diffMinutes = Math.round((now.getTime() - parsed.getTime()) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDate(value.split(' ')[0]);
}

/** Two-letter initials for avatar circles. */
export function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'BT'
  );
}
