import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { primaryNav, secondaryNav } from '../../routes/navigation';
import type { NotificationItem } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { NotificationPanel } from './NotificationPanel';

interface TopbarProps {
  onOpenSidebar: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

/** Derives the "Dashboard › Resources" breadcrumb from the current route. */
function useBreadcrumb(): string {
  const { pathname } = useLocation();
  const match = [...primaryNav, ...secondaryNav].find((item) =>
    pathname.startsWith(item.to),
  );
  return match?.label ?? 'Overview';
}

/**
 * Application top bar: breadcrumb, global search, notifications and the
 * account menu. Combines the header treatments from the three Figma app
 * screens into one consistent component.
 */
export function Topbar({ onOpenSidebar, notifications, onMarkAllRead }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const breadcrumb = useBreadcrumb();

  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const term = search.trim();
    if (term) navigate(`/app/projects?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="bt-topbar">
      <button
        type="button"
        className="btn btn-ghost btn-icon d-lg-none"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <i className="bi bi-list" style={{ fontSize: '1.3rem' }} aria-hidden="true" />
      </button>

      <nav aria-label="Breadcrumb" className="d-none d-md-block">
        <ol className="list-unstyled d-flex align-items-center gap-2 mb-0">
          <li>
            <Link to="/app/overview" className="bt-label" style={{ color: 'var(--bt-text-muted)' }}>
              Dashboard
            </Link>
          </li>
          <li className="bt-text-muted" aria-hidden="true">
            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }} />
          </li>
          <li className="bt-label" style={{ color: 'var(--bt-text)' }} aria-current="page">
            {breadcrumb}
          </li>
        </ol>
      </nav>

      <form
        className="flex-grow-1 d-none d-sm-block"
        style={{ maxWidth: 420 }}
        onSubmit={handleSearchSubmit}
        role="search"
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search projects, resources, workers…"
          label="Search BuildTrack"
          size="sm"
        />
      </form>

      <div className="d-flex align-items-center gap-2 ms-auto">
        {/* Notifications */}
        <div className="position-relative" ref={notificationsRef}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setAccountOpen(false);
            }}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notificationsOpen}
          >
            <i className="bi bi-bell" aria-hidden="true" />
            {unreadCount > 0 && <span className="bt-dot-indicator" aria-hidden="true" />}
          </button>

          {notificationsOpen && (
            <NotificationPanel
              notifications={notifications}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setNotificationsOpen(false)}
            />
          )}
        </div>

        <Link
          to="/app/settings"
          className="btn btn-ghost btn-icon d-none d-sm-inline-flex"
          aria-label="Settings"
        >
          <i className="bi bi-gear" aria-hidden="true" />
        </Link>

        {/* Account menu */}
        <div className="position-relative" ref={accountRef}>
          <button
            type="button"
            className="btn btn-ghost d-flex align-items-center gap-2 p-1 ps-2"
            onClick={() => {
              setAccountOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={accountOpen}
          >
            <span className="d-none d-lg-flex flex-column text-end lh-1">
              <span style={{ fontSize: '0.8rem', color: 'var(--bt-text)' }}>
                {user?.fullName}
              </span>
              <span className="bt-label mt-1">{user?.role}</span>
            </span>
            <span className="bt-avatar" style={{ width: 34, height: 34, fontSize: '0.75rem' }}>
              {user?.initials}
            </span>
          </button>

          {accountOpen && (
            <div
              className="dropdown-menu show"
              style={{
                display: 'block',
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 0.6rem)',
                minWidth: 220,
                zIndex: 40,
              }}
            >
              <div className="px-3 py-2">
                <p className="mb-0 fw-semibold" style={{ fontSize: '0.875rem' }}>
                  {user?.fullName}
                </p>
                <p className="bt-text-muted small mb-0 text-truncate">{user?.email}</p>
              </div>

              <hr className="dropdown-divider" />

              <Link
                className="dropdown-item"
                to="/app/settings"
                onClick={() => setAccountOpen(false)}
              >
                <i className="bi bi-person me-2" aria-hidden="true" />
                Profile & settings
              </Link>

              <Link
                className="dropdown-item"
                to="/app/notifications"
                onClick={() => setAccountOpen(false)}
              >
                <i className="bi bi-bell me-2" aria-hidden="true" />
                Notifications
              </Link>

              <hr className="dropdown-divider" />

              <button type="button" className="dropdown-item" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
