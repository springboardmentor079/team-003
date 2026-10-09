import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingState, PageHeader, StateMessage } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { notificationService } from '../../services/notificationService';
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

type TypeFilter = 'All' | NotificationType;

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await notificationService.list({ limit: 100 }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const filtered = useMemo(
    () => items.filter((item) => {
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;
      return !unreadOnly || !item.read;
    }),
    [items, typeFilter, unreadOnly],
  );
  const unreadCount = items.filter((item) => !item.read).length;

  async function markRead(item: NotificationItem) {
    if (item.read) return;
    try {
      const updated = await notificationService.markAsRead(item.id);
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Notification could not be updated.');
    }
  }

  async function markAllRead() {
    try {
      await notificationService.markAllAsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Notifications could not be updated.');
    }
  }

  async function deleteNotification(id: string) {
    try {
      await notificationService.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Notification could not be deleted.');
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Project, procurement, attendance, deadline and system updates for your account."
        actions={(
          <>
            <button
              type="button"
              className={`bt-pill-tab ${unreadOnly ? 'active' : ''}`.trim()}
              onClick={() => setUnreadOnly((current) => !current)}
            >
              Unread only
            </button>
            <button type="button" className="btn btn-outline-bt" onClick={() => void markAllRead()} disabled={unreadCount === 0}>
              <i className="bi bi-check2-all me-2" aria-hidden="true" />
              Mark all read
            </button>
          </>
        )}
      />

      {error && (
        <div role="alert" className="alert alert-danger d-flex justify-content-between align-items-center gap-3">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void loadNotifications()}>Retry</button>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4">
        {(['All', ...NOTIFICATION_TYPES] as TypeFilter[]).map((type) => (
          <button key={type} type="button" className={`bt-pill-tab ${typeFilter === type ? 'active' : ''}`.trim()} onClick={() => setTypeFilter(type)}>
            {type} ({type === 'All' ? items.length : items.filter((item) => item.type === type).length})
          </button>
        ))}
      </div>

      <section className="bt-card">
        {loading ? (
          <LoadingState label="Loading notifications…" />
        ) : filtered.length === 0 ? (
          <StateMessage icon="bi-bell-slash" title="No notifications yet" message="New updates for your account will appear here." />
        ) : (
          <ul className="list-unstyled mb-0">
            {filtered.map((item, index) => (
              <li key={item.id} className="d-flex gap-3 p-4" style={{ borderBottom: index === filtered.length - 1 ? 'none' : '1px solid var(--bt-border)', background: item.read ? 'transparent' : 'var(--bt-surface-2)' }}>
                <span className="bt-icon-tile flex-shrink-0">
                  <i className={`bi ${SEVERITY_ICON[item.severity]}`} aria-hidden="true" />
                </span>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <StatusBadge status={item.type} tone="neutral" withDot={false} />
                      {!item.read && <span className="bt-badge bt-badge-accent py-0 px-2">New</span>}
                    </div>
                    <span className="bt-label mb-0" title={formatDateTime(item.timestamp)}>{formatRelative(item.timestamp)}</span>
                  </div>
                  <p className={`mb-1 ${item.read ? '' : 'fw-semibold'}`}>{item.title}</p>
                  <p className="bt-text-muted small mb-2">{item.message}</p>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="bt-label mb-0">{item.relatedTo}</span>
                    {!item.read && <button type="button" className="btn btn-ghost btn-sm p-0 bt-accent" onClick={() => void markRead(item)}>Mark as read</button>}
                    <button type="button" className="btn btn-ghost btn-sm p-0 text-danger" onClick={() => void deleteNotification(item.id)}>Delete</button>
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
