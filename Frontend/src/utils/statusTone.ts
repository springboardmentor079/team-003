/**
 * Maps every status string in the application to a badge tone.
 *
 * Centralised so that "Delayed" looks identical whether it appears on a
 * project row, a milestone or a progress report.
 */
export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'info'
  | 'neutral';

const TONE_BY_STATUS: Record<string, StatusTone> = {
  /* Projects */
  Planning: 'info',
  'In Progress': 'accent',
  'On Hold': 'warning',
  Delayed: 'danger',
  Completed: 'success',
  Closed: 'neutral',

  /* Schedule health */
  'On Track': 'success',
  'At Risk': 'warning',

  /* Milestones */
  Scheduled: 'neutral',

  /* Resources */
  Available: 'success',
  Allocated: 'accent',
  'Under Maintenance': 'warning',
  'Out of Service': 'danger',

  /* Inventory */
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'danger',
  Reordered: 'info',

  /* Requests, orders, invoices, expenses */
  Pending: 'warning',
  'Pending Approval': 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Issued: 'info',
  Fulfilled: 'success',
  Draft: 'neutral',
  Ordered: 'accent',
  Delivered: 'success',
  Cancelled: 'neutral',
  Paid: 'success',
  Overdue: 'danger',

  /* Attendance */
  Present: 'success',
  Absent: 'danger',
  'On Leave': 'info',
  'Half Day': 'warning',

  /* Budget */
  'Within Budget': 'success',
  'Near Limit': 'warning',
  'Over Budget': 'danger',

  /* Progress reports */
  Submitted: 'info',
  'Under Review': 'warning',

  /* Reports */
  Ready: 'success',
  Generating: 'info',
  Failed: 'danger',

  /* Users & vendors */
  Active: 'success',
  Inactive: 'neutral',
  Suspended: 'danger',
  Blacklisted: 'danger',
};

export function toneForStatus(status: string): StatusTone {
  return TONE_BY_STATUS[status] ?? 'neutral';
}

/** Resolves a tone to the matching CSS custom property. */
export function toneColor(tone: StatusTone): string {
  switch (tone) {
    case 'success':
      return 'var(--bt-green)';
    case 'warning':
      return 'var(--bt-amber)';
    case 'danger':
      return 'var(--bt-red)';
    case 'accent':
      return 'var(--bt-accent)';
    case 'info':
      return 'var(--bt-blue)';
    default:
      return 'var(--bt-text-muted)';
  }
}
