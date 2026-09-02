import type { Milestone, MilestoneStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { ProgressBar } from '../common/ProgressBar';

const STATUS_ICON: Record<MilestoneStatus, string> = {
  Completed: 'bi-check-lg',
  'In Progress': 'bi-record-circle',
  Scheduled: 'bi-circle',
  Delayed: 'bi-exclamation-lg',
};

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  Completed: 'var(--bt-green)',
  'In Progress': 'var(--bt-accent)',
  Scheduled: 'var(--bt-text-muted)',
  Delayed: 'var(--bt-red)',
};

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

/**
 * Vertical milestone timeline — document module 2, feature (iv).
 *
 * The Figma listed invented stage names ("Superstructure Erect"); the
 * milestone names here come from the document's six progress categories.
 */
export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <p className="bt-text-muted small mb-0">
        No milestones have been defined for this project yet.
      </p>
    );
  }

  return (
    <ol className="list-unstyled mb-0 position-relative">
      {milestones.map((milestone, index) => {
        const color = STATUS_COLOR[milestone.status];
        const isLast = index === milestones.length - 1;
        const isActive = milestone.status === 'In Progress';

        return (
          <li className="d-flex gap-3" key={milestone.id}>
            {/* Marker + connector rail */}
            <div className="d-flex flex-column align-items-center flex-shrink-0">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 30,
                  height: 30,
                  border: `1.5px solid ${color}`,
                  color,
                  background:
                    milestone.status === 'Completed' ? 'rgba(34,197,94,0.12)' : 'transparent',
                  fontSize: '0.8rem',
                }}
              >
                <i className={`bi ${STATUS_ICON[milestone.status]}`} aria-hidden="true" />
              </span>

              {!isLast && (
                <span
                  style={{
                    flex: 1,
                    width: 1,
                    minHeight: 28,
                    background: 'var(--bt-border)',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            <div
              className={`flex-grow-1 mb-3 ${isActive ? 'p-3 rounded-3' : 'pb-1'}`}
              style={
                isActive
                  ? {
                      background: 'var(--bt-surface-2)',
                      border: '1px solid var(--bt-border)',
                    }
                  : undefined
              }
            >
              <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2">
                <h3
                  className="h6 mb-1"
                  style={{ color: isActive ? 'var(--bt-accent)' : undefined }}
                >
                  {milestone.name}
                </h3>
                <span className="bt-label mb-0" style={{ color }}>
                  {milestone.status}
                </span>
              </div>

              <p className="bt-text-muted small mb-2">{milestone.description}</p>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <span className="bt-label mb-0">
                  {formatDate(milestone.plannedStart)} — {formatDate(milestone.plannedEnd)}
                </span>
                <span className="bt-label mb-0">
                  Owner: {milestone.owner} · {milestone.progress}%
                </span>
              </div>

              <ProgressBar
                value={milestone.progress}
                color={color}
                label={`${milestone.name} progress`}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
