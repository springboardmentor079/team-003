import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { FormField } from '../../components/forms/FormField';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../layouts/AuthLayout';
import { DEMO_PASSWORD, users } from '../../data/users';
import {
  isValid,
  validateEmail,
  validatePassword,
  type FieldErrors,
} from '../../utils/validation';

interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Sign-in screen — document module 1 (JWT authentication).
 *
 * Layout follows the Figma: underline fields, "Remember Me" plus "Forgot
 * Password?", a peach primary action and an OAuth2 alternative. The Figma
 * offered no route to registration or password reset beyond the links, both
 * of which the document requires as screens; they are wired up here.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app/overview';

  function setField(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<LoginFormValues> = {
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await login({ email: values.email, password: values.password, rememberMe });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  function signInAs(email: string) {
    setValues({ email, password: DEMO_PASSWORD });
    setErrors({});
    setFormError(null);
  }

  return (
    <AuthLayout>
      <div className="bt-card bt-card-pad" style={{ height: 'auto' }}>
        <p className="bt-label bt-label-green mb-3">Welcome back</p>

        <h1 className="h3 mb-4" style={{ lineHeight: 1.25 }}>
          Sign in to your workspace.
        </h1>

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
            value={values.email}
            onChange={(value) => setField('email', value)}
            error={errors.email}
            className="mb-3"
            required
          />

          <FormField
            variant="underline"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(value) => setField('password', value)}
            error={errors.password}
            className="mb-3"
            required
            trailing={
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
              </button>
            }
          />

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <label className="form-check-label" htmlFor="remember-me">
                Remember me
              </label>
            </div>

            <Link to="/forgot-password" className="bt-accent small">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-accent w-100 mb-3 d-inline-flex align-items-center justify-content-center gap-2"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
            {!submitting && <i className="bi bi-arrow-right" aria-hidden="true" />}
          </button>

          {/* Document module 1 lists OAuth2 alongside JWT. */}
          <button
            type="button"
            className="btn btn-outline-bt w-100 d-inline-flex align-items-center justify-content-center gap-2"
            onClick={() => signInAs('manager@buildtrack.com')}
          >
            <i className="bi bi-google" aria-hidden="true" />
            Continue with Google
          </button>
        </form>
      </div>

      <p className="text-center bt-text-dim small mt-4 mb-2">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="bt-accent">
          Create account
        </Link>
      </p>

      <p className="text-center bt-label mb-4">
        <i className="bi bi-shield-check me-1" aria-hidden="true" />
        Secure enterprise authentication
      </p>

      {/* Role switcher so every role from the document can be reviewed. */}
      <div className="bt-card p-3" style={{ height: 'auto' }}>
        <p className="bt-label mb-2">Demo accounts — password: {DEMO_PASSWORD}</p>
        <div className="d-flex flex-wrap gap-2">
          {users
            .filter((user) => user.status === 'Active')
            .slice(0, 6)
            .map((user) => (
              <button
                key={user.id}
                type="button"
                className="bt-pill-tab"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }}
                onClick={() => signInAs(user.email)}
              >
                {user.role}
              </button>
            ))}
        </div>
      </div>
    </AuthLayout>
  );
}
