import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  tone?: 'success' | 'danger' | 'info';
  duration?: number;
}

const TONE_ICON: Record<'success' | 'danger' | 'info', string> = {
  success: 'bi-check-circle',
  danger: 'bi-exclamation-octagon',
  info: 'bi-info-circle',
};

const TONE_COLOR: Record<'success' | 'danger' | 'info', string> = {
  success: 'var(--bt-green)',
  danger: 'var(--bt-red)',
  info: 'var(--bt-blue)',
};

/** Transient confirmation message shown after a form action. */
export function Toast({ message, onDismiss, tone = 'success', duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      className="position-fixed bottom-0 end-0 m-3 m-md-4 bt-card p-3 d-flex align-items-center gap-3"
      style={{ zIndex: 1080, maxWidth: 'min(420px, calc(100vw - 2rem))', height: 'auto' }}
      role="status"
      aria-live="polite"
    >
      <i
        className={`bi ${TONE_ICON[tone]}`}
        style={{ color: TONE_COLOR[tone], fontSize: '1.15rem' }}
        aria-hidden="true"
      />
      <p className="mb-0 small flex-grow-1">{message}</p>
      <button
        type="button"
        className="btn btn-ghost btn-icon flex-shrink-0"
        style={{ width: 28, height: 28 }}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }} aria-hidden="true" />
      </button>
    </div>
  );
}
