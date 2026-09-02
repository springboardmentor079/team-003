import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible modal dialog rendered through a portal.
 *
 * Bootstrap's modal markup and utility classes are reused, but the show/hide
 * lifecycle is driven by React state rather than Bootstrap's JS bundle.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="bt-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`bt-modal bt-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="d-flex justify-content-between align-items-start gap-3 p-4 pb-3">
          <div>
            <h2 className="h5 mb-1">{title}</h2>
            {description && <p className="bt-text-dim small mb-0">{description}</p>}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon flex-shrink-0"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <hr className="bt-divider m-0" />

        <div className="p-4">{children}</div>

        {footer && (
          <>
            <hr className="bt-divider m-0" />
            <div className="d-flex flex-wrap justify-content-end gap-2 p-4 pt-3">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
