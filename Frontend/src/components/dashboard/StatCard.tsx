import type { KpiMetric } from '../../types';
import { Sparkline } from '../charts/Sparkline';
import { ProgressBar } from '../common/ProgressBar';

const ACCENT_COLOR: Record<KpiMetric['accent'], string> = {
  accent: 'var(--bt-accent)',
  green: 'var(--bt-green)',
  amber: 'var(--bt-amber)',
  red: 'var(--bt-red)',
  blue: 'var(--bt-blue)',
};

const TREND_ICON: Record<'up' | 'down' | 'flat', string> = {
  up: 'bi-arrow-up-right',
  down: 'bi-arrow-down-right',
  flat: 'bi-dash',
};

const TREND_CLASS: Record<'up' | 'down' | 'flat', string> = {
  up: 'bt-green',
  down: 'bt-red',
  flat: 'bt-text-dim',
};

interface StatCardProps {
  metric: KpiMetric;
  /** Values for the optional micro trend line. */
  sparkline?: number[];
  /** Show the thin progress track under the value. */
  showProgress?: boolean;
}

/**
 * KPI card from the Figma Overview and Analytics screens: icon tile, delta
 * chip, monospace caption, large value and an optional trend visual.
 */
export function StatCard({ metric, sparkline, showProgress = true }: StatCardProps) {
  const color = ACCENT_COLOR[metric.accent];
  const trend = metric.trend ?? 'flat';

  return (
    <article className="bt-card bt-card-hover bt-card-pad d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
        <span className="bt-icon-tile" style={{ color }}>
          <i className={`bi ${metric.icon}`} aria-hidden="true" />
        </span>

        {metric.delta && (
          <span
            className={`bt-label d-inline-flex align-items-center gap-1 ${TREND_CLASS[trend]}`}
          >
            <i className={`bi ${TREND_ICON[trend]}`} aria-hidden="true" />
            {metric.delta}
          </span>
        )}
      </div>

      <h3 className="bt-label mb-2">{metric.label}</h3>

      <p className="d-flex align-items-baseline gap-1 mb-1">
        <span className="bt-display" style={{ fontSize: '1.85rem', lineHeight: 1.1 }}>
          {metric.value}
        </span>
        {metric.unit && <span className="bt-text-dim small">{metric.unit}</span>}
      </p>

      {metric.caption && (
        <p className="bt-text-muted small mb-0 flex-grow-1">{metric.caption}</p>
      )}

      {sparkline ? (
        <div className="mt-3">
          <Sparkline
            values={sparkline}
            color={color}
            ariaLabel={`${metric.label} trend`}
          />
        </div>
      ) : (
        showProgress &&
        metric.progress !== undefined && (
          <div className="mt-3">
            <ProgressBar
              value={metric.progress}
              color={color}
              label={`${metric.label}: ${metric.progress}%`}
            />
          </div>
        )
      )}
    </article>
  );
}
