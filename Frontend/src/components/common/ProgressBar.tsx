import { toneColor, type StatusTone } from '../../utils/statusTone';

interface ProgressBarProps {
  value: number;
  tone?: StatusTone;
  /** Explicit colour, overrides `tone`. */
  color?: string;
  height?: number;
  label?: string;
  className?: string;
}

/** Slim rounded progress track used in cards and table cells. */
export function ProgressBar({
  value,
  tone = 'accent',
  color,
  height = 6,
  label,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`bt-progress ${className}`.trim()}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div
        className="bt-progress-bar"
        style={{ width: `${clamped}%`, background: color ?? toneColor(tone) }}
      />
    </div>
  );
}

interface SegmentedBarProps {
  active: number;
  total: number;
  color?: string;
  label?: string;
}

/**
 * Discrete allocation bar — one segment per unit, filled segments coloured.
 * Reproduces the Resource Allocation card in the Figma Overview screen.
 */
export function SegmentedBar({
  active,
  total,
  color = 'var(--bt-green)',
  label,
}: SegmentedBarProps) {
  return (
    <div
      className="bt-segments"
      role="img"
      aria-label={label ?? `${active} of ${total} active`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className="bt-segment"
          style={index < active ? { background: color } : undefined}
        />
      ))}
    </div>
  );
}
