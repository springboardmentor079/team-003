import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Legend chips or a "View all" link rendered in the header. */
  actions?: ReactNode;
  children: ReactNode;
  /** Summary rows rendered beneath the chart, e.g. the budget legend. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Card wrapper for a chart. The body has no fixed height so the chart's own
 * responsive container controls sizing and never overflows the card.
 */
export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
}: ChartCardProps) {
  return (
    <section className={`bt-card bt-card-pad d-flex flex-column ${className}`.trim()}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="h5 mb-1">{title}</h2>
          {subtitle && <p className="bt-label mb-0">{subtitle}</p>}
        </div>
        {actions && (
          <div className="d-flex flex-wrap align-items-center gap-3">{actions}</div>
        )}
      </div>

      <div className="flex-grow-1">{children}</div>

      {footer && <div className="mt-3">{footer}</div>}
    </section>
  );
}

interface LegendChipProps {
  label: string;
  color: string;
}

/** Small dot + label pair used as a manual chart legend in card headers. */
export function LegendChip({ label, color }: LegendChipProps) {
  return (
    <span className="bt-label d-inline-flex align-items-center gap-2 mb-0">
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
