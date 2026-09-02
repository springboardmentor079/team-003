import type { ActivityLogEntry, ActivitySeverity } from '../../types';
import { formatRelative } from '../../utils/format';

const SEVERITY_ICON: Record<ActivitySeverity, string> = {
  info: 'bi-info-circle',
  success: 'bi-check-circle',
  warning: 'bi-exclamation-triangle',
  danger: 'bi-exclamation-octagon',
};

const SEVERITY_COLOR: Record<ActivitySeverity, string> = {
  info: 'var(--bt-blue)',
  success: 'var(--bt-green)',
  warning: 'var(--bt-amber)',
  danger: 'var(--bt-red)',
};

interface ActivityFeedProps {
  entries: ActivityLogEntry[];
  limit?: number;
}

/**
 * Site activity log — document module 3, feature (vi). Reproduces the
 * "Recent Activity" card from the Figma Overview screen.
 */
export function ActivityFeed({ entries, limit }: ActivityFeedProps) {
  const visible = limit ? entries.slice(0, limit) : entries;

  return (
    <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
      {visible.map((entry) => (
        <li className="d-flex gap-3" key={entry.id}>
          <i
            className={`bi ${SEVERITY_ICON[entry.severity]} flex-shrink-0`}
            style={{ color: SEVERITY_COLOR[entry.severity], fontSize: '1.05rem', lineHeight: 1.4 }}
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="mb-1 fw-semibold" style={{ fontSize: '0.9rem' }}>
              {entry.title}
            </p>
            <p className="bt-text-muted small mb-1">{entry.detail}</p>
            <p className="bt-label mb-0">
              {formatRelative(entry.timestamp)} · {entry.loggedBy}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
