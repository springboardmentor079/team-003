import { Link } from 'react-router-dom';

import { Logo } from '../components/layout/Logo';

/** Fallback route for unknown URLs. */
export function NotFoundPage() {
  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
      style={{ background: 'var(--bt-bg)' }}
    >
      <Logo size="md" />

      <p className="bt-label mt-5 mb-2">Error 404</p>
      <h1 className="bt-display mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
        This page isn&apos;t on the site plan.
      </h1>
      <p className="bt-text-dim mb-4" style={{ maxWidth: 440 }}>
        The page you requested does not exist or has been moved.
      </p>

      <div className="d-flex flex-wrap gap-2 justify-content-center">
        <Link to="/app/overview" className="btn btn-accent px-4">
          Go to dashboard
        </Link>
        <Link to="/" className="btn btn-outline-bt px-4">
          Back to home
        </Link>
      </div>
    </div>
  );
}
