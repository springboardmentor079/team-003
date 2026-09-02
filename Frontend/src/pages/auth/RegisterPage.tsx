import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormField } from '../../components/forms/FormField';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../layouts/AuthLayout';
import { USER_ROLES, type UserRole } from '../../types';
import {
  isValid,
  requiredField,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  type FieldErrors,
} from '../../utils/validation';

interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: RegisterFormValues = {
  fullName: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  confirmPassword: '',
};

/**
 * Registration screen — required by the document (Milestone 1 wireframes
 * list a Registration Page) but absent from the Figma. Built in the same
 * visual language as the sign-in card, and it captures the role so
 * role-based access can be applied from first login.
 */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: keyof RegisterFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<RegisterFormValues> = {
      fullName: requiredField(values.fullName, 'Full name'),
      email: validateEmail(values.email),
      phone: validatePhone(values.phone),
      role: requiredField(values.role, 'Role'),
      password: validatePassword(values.password),
      confirmPassword: validatePasswordMatch(values.password, values.confirmPassword),
    };

    setErrors(nextErrors);
    setTermsError(acceptedTerms ? null : 'You must accept the terms to continue.');

    if (!isValid(nextErrors) || !acceptedTerms) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        role: values.role as UserRole,
        password: values.password,
        confirmPassword: values.confirmPassword,
        acceptedTerms,
      });
      navigate('/app/overview', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bt-card bt-card-pad" style={{ height: 'auto' }}>
        <p className="bt-label bt-label-green mb-3">Get started</p>

        <h1 className="h3 mb-4" style={{ lineHeight: 1.25 }}>
          Create your account.
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
            label="Full name"
            placeholder="e.g. Anita Desai"
            value={values.fullName}
            onChange={(value) => setField('fullName', value)}
            error={errors.fullName}
            className="mb-3"
            required
          />

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
            type="tel"
            label="Phone number"
            placeholder="+91 98400 00000"
            value={values.phone}
            onChange={(value) => setField('phone', value)}
            error={errors.phone}
            className="mb-3"
            required
          />

          <FormField
            as="select"
            label="Role"
            value={values.role}
            onChange={(value) => setField('role', value)}
            options={USER_ROLES}
            error={errors.role}
            placeholderOption="Select your role"
            hint="Determines which modules you can access."
            className="mb-3"
            required
          />

          <FormField
            variant="underline"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(value) => setField('password', value)}
            error={errors.password}
            className="mb-3"
            required
          />

          <FormField
            variant="underline"
            type="password"
            label="Confirm password"
            placeholder="Re-enter your password"
            value={values.confirmPassword}
            onChange={(value) => setField('confirmPassword', value)}
            error={errors.confirmPassword}
            className="mb-3"
            required
          />

          <div className="form-check mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="accept-terms"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setTermsError(null);
              }}
            />
            <label className="form-check-label" htmlFor="accept-terms">
              I accept the terms of service and privacy policy.
            </label>
            {termsError && <div className="invalid-feedback d-block">{termsError}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-accent w-100 d-inline-flex align-items-center justify-content-center gap-2"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Create account'}
            {!submitting && <i className="bi bi-arrow-right" aria-hidden="true" />}
          </button>
        </form>
      </div>

      <p className="text-center bt-text-dim small mt-4 mb-0">
        Already have an account?{' '}
        <Link to="/login" className="bt-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
