import { useState } from 'react';
import { Link } from 'react-router-dom';

import { FormField } from '../../components/forms/FormField';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services';
import { validateEmail } from '../../utils/validation';

/**
 * Password reset request — document module 1, feature (ii). The Figma linked
 * to "Forgot Password?" but had no screen behind it.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateEmail(email);
    setError(validationError);
    if (validationError) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await authService.requestPasswordReset(email);
      setSentMessage(result.message);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'Unable to send reset instructions.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bt-card bt-card-pad" style={{ height: 'auto' }}>
        <p className="bt-label bt-label-green mb-3">Account recovery</p>

        <h1 className="h3 mb-2" style={{ lineHeight: 1.25 }}>
          Reset your password.
        </h1>

        <p className="bt-text-dim small mb-4">
          Enter the email address linked to your BuildTrack account and we will send you a
          reset link.
        </p>

        {sentMessage ? (
          <div
            className="d-flex align-items-start gap-2 p-3 rounded-3 mb-4"
            style={{
              background: 'var(--bt-green-soft)',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
            role="status"
          >
            <i className="bi bi-check-circle bt-green" aria-hidden="true" />
            <span className="small bt-green">{sentMessage}</span>
          </div>
        ) : (
          <>
            {formError && (
              <div
                className="d-flex align-items-start gap-2 p-3 mb-3 rounded-3"
                style={{
                  background: 'var(--bt-red-soft)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
                role="alert"
              >
                <i className="bi bi-exclamation-octagon bt-red" aria-hidden="true" />
                <span className="small bt-red">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                variant="underline"
                type="email"
                label="Work email"
                placeholder="you@company.com"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setError(undefined);
                  setFormError(null);
                }}
                error={error}
                className="mb-4"
                required
              />

              <button
                type="submit"
                className="btn btn-accent w-100 d-inline-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Send reset link'}
                {!submitting && <i className="bi bi-arrow-right" aria-hidden="true" />}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center bt-text-dim small mt-4 mb-0">
        <Link to="/login" className="bt-accent">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
