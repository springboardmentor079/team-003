import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Logo } from '../components/layout/Logo';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Modules', href: '#modules' },
  { label: 'Site Progress', href: '#progress' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Resources', href: '#resources' },
];

/**
 * Marketing shell for the public landing page: transparent sticky top nav
 * and the site footer, matching the Figma landing frame.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bt-bg)' }}>
      <header
        className="sticky-top"
        style={{
          background: 'rgba(13,13,13,0.82)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--bt-border)',
        }}
      >
        <nav className="container-xl d-flex align-items-center gap-3 py-3" aria-label="Main">
          <Logo size="sm" />

          <ul className="list-unstyled d-none d-lg-flex align-items-center gap-4 mb-0 mx-auto">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="bt-text-dim"
                  style={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="d-none d-md-flex align-items-center gap-3 ms-auto ms-lg-0">
            <Link to="/login" className="bt-label" style={{ color: 'var(--bt-text)' }}>
              Sign in
            </Link>
            <Link to="/register" className="btn btn-accent btn-sm px-3 rounded-pill">
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon d-md-none ms-auto"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: '1.2rem' }} aria-hidden="true" />
          </button>
        </nav>

        {menuOpen && (
          <div className="d-md-none border-top" style={{ borderColor: 'var(--bt-border)' }}>
            <ul className="list-unstyled container-xl py-3 mb-0 d-flex flex-column gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="bt-nav-link"
                    style={{ margin: 0 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="d-flex gap-2 pt-2">
                <Link to="/login" className="btn btn-outline-bt flex-grow-1">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-accent flex-grow-1">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main className="flex-grow-1">{children}</main>

      <footer className="border-top py-5" style={{ borderColor: 'var(--bt-border)' }}>
        <div className="container-xl">
          <div className="row g-4 align-items-start">
            <div className="col-12 col-md-4">
              <Logo size="sm" />
              <p className="bt-text-muted small mt-3 mb-0" style={{ maxWidth: 300 }}>
                Construction project management and site monitoring, from planning
                through closure.
              </p>
            </div>

            <div className="col-6 col-md-4">
              <p className="bt-label mb-2">Platform</p>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li>
                  <a href="#modules" className="bt-text-dim small">
                    Modules
                  </a>
                </li>
                <li>
                  <a href="#analytics" className="bt-text-dim small">
                    Dashboards &amp; analytics
                  </a>
                </li>
                <li>
                  <a href="#progress" className="bt-text-dim small">
                    Site progress monitoring
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-6 col-md-4">
              <p className="bt-label mb-2">Account</p>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li>
                  <Link to="/login" className="bt-text-dim small">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="bt-text-dim small">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="bt-text-dim small">
                    Reset password
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <hr className="bt-divider my-4" />

          <p className="bt-label mb-0 text-center">
            © 2026 BuildTrack — Construction Project Management &amp; Site Monitoring
            Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
