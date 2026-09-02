import type { ReactNode } from 'react';

import { Logo } from '../components/layout/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Split-screen authentication shell from the Figma login screen: an
 * atmospheric left panel carrying the brand promise, and the form card on
 * the right. The left panel collapses below `lg`, where the form takes the
 * full width.
 *
 * The Figma used a photographic site background; it is reproduced here with
 * layered CSS (radial site-light glow plus a blueprint grid) so the build
 * carries no unresolved binary asset.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--bt-bg)' }}>
      <div className="row g-0 flex-grow-1">
        {/* Brand panel */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 position-relative overflow-hidden"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 15%, rgba(30, 96, 82, 0.55) 0%, rgba(13,13,13,0) 55%), radial-gradient(90% 70% at 85% 80%, rgba(248, 185, 142, 0.14) 0%, rgba(13,13,13,0) 60%), #0a0a0a',
            borderRight: '1px solid var(--bt-border)',
          }}
        >
          {/* Blueprint grid */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(80% 70% at 40% 40%, #000 0%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          {/* Oversized watermark wordmark, as in the Figma */}
          <div
            className="position-absolute bt-display"
            style={{
              bottom: '-3.5rem',
              left: '-1rem',
              fontSize: 'clamp(6rem, 13vw, 11rem)',
              lineHeight: 1,
              color: 'rgba(255,255,255,0.028)',
              letterSpacing: '-0.05em',
              whiteSpace: 'nowrap',
            }}
            aria-hidden="true"
          >
            BUILDTRACK
          </div>

          <div className="position-relative">
            <Logo size="lg" />
          </div>

          <div className="position-relative" style={{ maxWidth: 520 }}>
            <h1
              className="bt-display mb-4"
              style={{ fontSize: 'clamp(2.2rem, 3.4vw, 3.1rem)', lineHeight: 1.12 }}
            >
              Build smarter.
              <br />
              Manage every project.
              <br />
              <span className="bt-accent">Stay in control.</span>
            </h1>

            <p className="bt-text-dim mb-4" style={{ maxWidth: 440 }}>
              One connected platform for projects, site progress, resources, materials,
              workforce, procurement and budgets.
            </p>

            <ul className="list-unstyled d-flex flex-wrap gap-4 mb-0">
              <li className="bt-label mb-0">Construction management, centralized</li>
              <li className="bt-label mb-0">Real-time project visibility</li>
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5">
          <div className="w-100" style={{ maxWidth: 420 }}>
            <div className="d-lg-none mb-4 text-center">
              <Logo size="md" />
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
