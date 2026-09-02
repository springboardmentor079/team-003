import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Toast } from '../components/common/Toast';
import { NewProjectModal } from '../components/forms/NewProjectModal';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useAuth } from '../hooks/useAuth';
import { notifications as seedNotifications } from '../data/notifications';
import type { NotificationItem } from '../types';

/**
 * Authenticated application shell: fixed sidebar, sticky top bar and the
 * routed page content. Redirects to the sign-in screen when no session
 * exists (document module 1: JWT-protected routes).
 */
export function AppLayout() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Wait for the initial session lookup before deciding where to send the user,
  // otherwise a valid Supabase session would flash the login screen on reload.
  if (initializing) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--bt-bg)' }}
      >
        <span
          className="spinner-border"
          style={{ color: 'var(--bt-accent)' }}
          role="status"
          aria-label="Loading workspace"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="bt-app">
      <a className="bt-skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewProject={() => setProjectModalOpen(true)}
      />

      {sidebarOpen && (
        <div
          className="bt-sidebar-scrim d-lg-none"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="bt-main">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          notifications={notifications}
          onMarkAllRead={() =>
            setNotifications((current) => current.map((item) => ({ ...item, read: true })))
          }
        />

        <main className="bt-content" id="main-content">
          <div className="container-fluid px-0" style={{ maxWidth: 1360 }}>
            <Outlet />
          </div>
        </main>
      </div>

      <NewProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreated={(name) => setToast(`Project "${name}" created successfully.`)}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
