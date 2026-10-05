import type { ActivitySeverity, NotificationItem, NotificationType } from '../types';
import { request } from './apiClient';

export const NOTIFICATION_CHANGED_EVENT = 'buildtrack:notifications-changed';

function notifyChanged() {
  window.dispatchEvent(new Event(NOTIFICATION_CHANGED_EVENT));
}

interface BackendNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
}

function displayType(type: string): NotificationType {
  const types: Record<string, NotificationType> = {
    project: 'Project Update',
    task: 'Task Assignment',
    procurement: 'Procurement Alert',
    attendance: 'Attendance Alert',
    deadline: 'Deadline Notification',
    system: 'System Notification',
  };
  return types[type] ?? 'System Notification';
}

function severity(type: string): ActivitySeverity {
  if (type === 'deadline') return 'warning';
  if (type === 'attendance') return 'warning';
  if (type === 'procurement') return 'info';
  return 'info';
}

function mapNotification(row: BackendNotification): NotificationItem {
  const relatedTo = row.related_entity_type
    ? `${row.related_entity_type}${row.related_entity_id ? ` #${row.related_entity_id}` : ''}`
    : row.type;
  return {
    id: String(row.id),
    type: displayType(row.type),
    title: row.title,
    message: row.message,
    timestamp: row.created_at,
    read: row.is_read,
    severity: severity(row.type),
    relatedTo,
  };
}

export const notificationService = {
  async list(options: { unreadOnly?: boolean; skip?: number; limit?: number } = {}) {
    const params = new URLSearchParams({
      unread_only: String(options.unreadOnly ?? false),
      skip: String(options.skip ?? 0),
      limit: String(options.limit ?? 50),
    });
    const rows = await request<BackendNotification[]>(`/notifications?${params}`);
    return rows.map(mapNotification);
  },

  unreadCount: () => request<{ unread_count: number }>('/notifications/unread-count'),

  async markAsRead(id: string) {
    const notification = mapNotification(
      await request<BackendNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
    );
    notifyChanged();
    return notification;
  },

  async markAllAsRead() {
    const result = await request<{ message: string; updated_count: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
    notifyChanged();
    return result;
  },

  async delete(id: string) {
    await request<void>(`/notifications/${id}`, { method: 'DELETE' });
    notifyChanged();
  },
};
