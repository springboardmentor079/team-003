import { NavLink } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { primaryNav, secondaryNav } from '../../routes/navigation';
import type { NavItem } from '../../types';
import { Logo } from './Logo';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNewProject: () => void;
}

/**
 * Application sidebar.
 *
 * Fixed on desktop, off-canvas drawer below the `lg` breakpoint. Entries are
 * filtered by the signed-in user's role, so a Worker or Client never sees
 * modules they have no access to (document module 1: role-based access).
 */
export function Sidebar({ open, onClose, onNewProject }: SidebarProps) {
  const { user, logout } = useAuth();

  function visibleTo(item: NavItem): boolean {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  }

  const primary = primaryNav.filter(visibleTo);
  const secondary = secondaryNav.filter(visibleTo);

  return (
    <aside
      className={`bt-sidebar ${open ? 'is-open' : ''}`.trim()}
      aria-label="Main navigation"
    >
      <div className="d-flex justify-content-between align-items-start gap-2 p-3 pt-4 px-4">
        <Logo caption="Enterprise Construction" to="/app/overview" />

        <button
          type="button"
          className="btn btn-ghost btn-icon d-lg-none"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <button type="button" className="btn btn-accent w-100" onClick={onNewProject}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          New Project
        </button>
      </div>

      <nav className="flex-grow-1 pb-2">
        <ul className="list-unstyled mb-0">
          {primary.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `bt-nav-link ${isActive ? 'active' : ''}`.trim()
                }
                onClick={onClose}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {secondary.length > 0 && (
          <>
            <p className="bt-nav-section bt-label mb-0">Administration</p>
            <ul className="list-unstyled mb-0">
              {secondary.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `bt-nav-link ${isActive ? 'active' : ''}`.trim()
                    }
                    onClick={onClose}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {user && (
        <div className="border-top p-3 px-4" style={{ borderColor: 'var(--bt-border)' }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="bt-avatar" style={{ width: 38, height: 38 }}>
              {user.initials}
            </span>

            <div className="min-w-0">
              <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.875rem' }}>
                {user.fullName}
              </p>
              {/* The Figma showed "System Operator / ID: 849-B"; replaced with
                  the user's actual role from the document's six roles. */}
              <p className="bt-label mb-0 text-truncate">{user.role}</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-bt btn-sm w-100"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
