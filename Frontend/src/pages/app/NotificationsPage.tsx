import { useMemo, useState } from 'react';

import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { notifications as seedNotifications } from '../../data/notifications';
import {
  NOTIFICATION_TYPES,
  type ActivitySeverity,
  type NotificationItem,
  type NotificationType,
} from '../../types';
import { formatDateTime, formatRelative } from '../../utils/format';

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

type TypeFilter = 'All' | NotificationType;

/**
 * Notification centre — document module 8. All six notification types are
 * represented; the Figma had only a bell icon with no notification screen.
 */
export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(seedNotifications);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (typeFilter !== 'All' && item.type !== typeFilter) return false;
        if (unreadOnly && item.read) return false;
        return true;
      }),
    [items, typeFilter, unreadOnly],
  );

  const unreadCount = items.filter((item) => !item.read).length;

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  function toggleRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: !item.read } : item)),
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Project updates, task assignments, procurement and attendance alerts, deadlines and system notices."
        actions={
          <>
            <button
              type="button"
              className={`bt-pill-tab ${unreadOnly ? 'active' : ''}`.trim()}
              style={{ padding: '0.5rem 1rem' }}
              onClick={() => setUnreadOnly((current) => !current)}
            >
              Unread only
            </button>
            <button
              type="button"
              className="btn btn-outline-bt"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <i className="bi bi-check2-all me-2" aria-hidden="true" />
              Mark all read
            </button>
          </>
        }
      />

      {/* Type filter chips */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {(['All', ...NOTIFICATION_TYPES] as TypeFilter[]).map((type) => {
          const count =
            type === 'All'
              ? items.length
              : items.filter((item) => item.type === type).length;
          return (
            <button
              key={type}
              type="button"
              className={`bt-pill-tab ${typeFilter === type ? 'active' : ''}`.trim()}
              style={{ padding: '0.4rem 0.9rem' }}
              onClick={() => setTypeFilter(type)}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      <section className="bt-card">
        {filtered.length === 0 ? (
          <StateMessage
            icon="bi-bell-slash"
            title="No notifications"
            message="There are no notifications matching the current filters."
          />
        ) : (
          <ul className="list-unstyled mb-0">
            {filtered.map((item, index) => (
              <li
                key={item.id}
                className="d-flex gap-3 p-4"
                style={{
                  borderBottom:
                    index === filtered.length - 1 ? 'none' : '1px solid var(--bt-border)',
                  background: item.read ? 'transparent' : 'var(--bt-surface-2)',
                }}
              >
                <span
                  className="bt-icon-tile flex-shrink-0"
                  style={{ color: SEVERITY_COLOR[item.severity] }}
                >
                  <i className={`bi ${SEVERITY_ICON[item.severity]}`} aria-hidden="true" />
                </span>

                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <StatusBadge status={item.type} tone="neutral" withDot={false} />
                      {!item.read && (
                        <span className="bt-badge bt-badge-accent py-0 px-2">New</span>
                      )}
                    </div>
                    <span className="bt-label mb-0" title={formatDateTime(item.timestamp)}>
                      {formatRelative(item.timestamp)}
                    </span>
                  </div>

                  <p className="mb-1 fw-semibold">{item.title}</p>
                  <p className="bt-text-muted small mb-2">{item.message}</p>

                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="bt-label mb-0">Ref: {item.relatedTo}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-0 bt-accent"
                      onClick={() => toggleRead(item.id)}
                    >
                      Mark as {item.read ? 'unread' : 'read'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
