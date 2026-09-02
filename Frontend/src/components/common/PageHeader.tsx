import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small mono caption above the title, e.g. "PROJECT ID: GVR-094". */
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

/** Standard page heading block used by every module screen. */
export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        {eyebrow && <div className="d-flex align-items-center gap-3 mb-2">{eyebrow}</div>}
        <h1 className="bt-page-title">{title}</h1>
        {subtitle && <p className="bt-page-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Removes body padding — useful when the body is a full-bleed table. */
  flush?: boolean;
  className?: string;
}

/** Titled surface used for tables, charts and grouped content. */
export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  flush = false,
  className = '',
}: SectionCardProps) {
  return (
    <section className={`bt-card d-flex flex-column ${className}`.trim()}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 p-4 pb-3">
        <div>
          <h2 className="h5 mb-1">{title}</h2>
          {subtitle && <p className="bt-text-dim small mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex flex-wrap align-items-center gap-2">{actions}</div>}
      </div>

      <div className={flush ? 'flex-grow-1' : 'flex-grow-1 px-4 pb-4'}>{children}</div>
    </section>
  );
}

interface StateMessageProps {
  icon: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

/** Empty / error placeholder shown inside cards. */
export function StateMessage({ icon, title, message, action }: StateMessageProps) {
  return (
    <div className="text-center py-5">
      <i
        className={`bi ${icon} bt-text-muted d-block mb-3`}
        style={{ fontSize: '2rem' }}
        aria-hidden="true"
      />
      <h3 className="h6 mb-1">{title}</h3>
      {message && <p className="bt-text-muted small mb-3">{message}</p>}
      {action}
    </div>
  );
}

/** Inline spinner for async card content. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 bt-text-muted">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span className="bt-label mb-0">{label}</span>
    </div>
  );
}
