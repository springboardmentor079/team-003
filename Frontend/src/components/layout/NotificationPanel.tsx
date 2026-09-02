import { Link } from 'react-router-dom';

import type { ActivitySeverity, NotificationItem } from '../../types';
import { formatRelative } from '../../utils/format';

const SEVERITY_COLOR: Record<ActivitySeverity, string> = {
  info: 'var(--bt-blue)',
  success: 'var(--bt-green)',
  warning: 'var(--bt-amber)',
  danger: 'var(--bt-red)',
};

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

/**
 * Dropdown notification list behind the top-bar bell.
 * Covers the six notification types from document module 8.
 */
export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onClose,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div
      className="dropdown-menu show p-0"
      style={{
        display: 'block',
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 0.6rem)',
        width: 'min(380px, calc(100vw - 2rem))',
        zIndex: 40,
      }}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="d-flex justify-content-between align-items-center gap-2 p-3">
        <div>
          <h2 className="h6 mb-0">Notifications</h2>
          <p className="bt-label mb-0">{unreadCount} unread</p>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>

      <hr className="bt-divider m-0" />

      <ul
        className="list-unstyled mb-0 overflow-auto"
        style={{ maxHeight: '340px' }}
      >
        {notifications.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="p-3 border-bottom"
            style={{
              borderColor: 'var(--bt-border)',
              background: item.read ? 'transparent' : 'var(--bt-surface-3)',
            }}
          >
            <div className="d-flex gap-2 align-items-start">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: SEVERITY_COLOR[item.severity],
                  marginTop: 7,
                  flex: '0 0 auto',
                }}
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="bt-label mb-1">{item.type}</p>
                <p className="mb-1 fw-semibold" style={{ fontSize: '0.85rem' }}>
                  {item.title}
                </p>
                <p className="bt-text-muted small mb-0">{formatRelative(item.timestamp)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="p-2">
        <Link
          to="/app/notifications"
          className="btn btn-outline-bt btn-sm w-100"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
