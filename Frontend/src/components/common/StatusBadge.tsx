import { toneForStatus, type StatusTone } from '../../utils/statusTone';

interface StatusBadgeProps {
  status: string;
  /** Override the tone derived from the status text. */
  tone?: StatusTone;
  /** Hide the leading dot (used in dense table cells). */
  withDot?: boolean;
  className?: string;
}

/**
 * Coloured status pill. Every status string in the app resolves through
 * `toneForStatus`, so one status never renders in two different colours.
 */
export function StatusBadge({
  status,
  tone,
  withDot = true,
  className = '',
}: StatusBadgeProps) {
  const resolved = tone ?? toneForStatus(status);

  return (
    <span className={`bt-badge bt-badge-${resolved} ${className}`.trim()}>
      {withDot && <span className="bt-dot" aria-hidden="true" />}
      {status}
    </span>
  );
}
