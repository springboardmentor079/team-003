import type { ResourceAllocationSummary } from '../../types';
import { SegmentedBar } from '../common/ProgressBar';

interface ResourceAllocationListProps {
  allocation: ResourceAllocationSummary[];
}

/**
 * Resource Allocation card from the Figma Overview screen.
 *
 * The Figma listed "Tower Cranes" and "Concrete Pumps" and showed only four
 * rows; the categories here are the document's six resource categories.
 * A row turns amber once fewer than two thirds of its units are active.
 */
export function ResourceAllocationList({ allocation }: ResourceAllocationListProps) {
  return (
    <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
      {allocation.map((entry) => {
        const ratio = entry.total > 0 ? entry.active / entry.total : 0;
        const color = ratio >= 0.66 ? 'var(--bt-green)' : 'var(--bt-accent)';

        return (
          <li key={entry.category}>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
              <span className="bt-label mb-0">{entry.category}</span>
              <span className="bt-label mb-0" style={{ color }}>
                {entry.active} / {entry.total} Active
              </span>
            </div>

            <SegmentedBar
              active={entry.active}
              total={entry.total}
              color={color}
              label={`${entry.category}: ${entry.active} of ${entry.total} active`}
            />
          </li>
        );
      })}
    </ul>
  );
}
