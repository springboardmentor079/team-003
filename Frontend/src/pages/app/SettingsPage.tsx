import { useState } from 'react';

import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/common/Toast';
import { FormField } from '../../components/forms/FormField';
import { useAuth } from '../../hooks/useAuth';
import { NOTIFICATION_TYPES } from '../../types';
import {
  isValid,
  requiredField,
  validateEmail,
  validatePhone,
  type FieldErrors,
} from '../../utils/validation';

interface ProfileFormValues {
  fullName: string;
  email: string;
  phone: string;
  department: string;
}

/**
 * Profile Management — document module 1, feature (iii). Combines the
 * profile form with notification preferences (module 8). The Figma had only
 * a gear icon with no settings screen.
 */
export function SettingsPage() {
  const { user } = useAuth();

  const [values, setValues] = useState<ProfileFormValues>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<ProfileFormValues>>({});
  const [toast, setToast] = useState<string | null>(null);

  const [channels, setChannels] = useState({ email: true, sms: false, inApp: true });
  const [subscribedTypes, setSubscribedTypes] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type, true])),
  );

  function setField(field: keyof ProfileFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<ProfileFormValues> = {
      fullName: requiredField(values.fullName, 'Full name'),
      email: validateEmail(values.email),
      phone: validatePhone(values.phone),
      department: requiredField(values.department, 'Department'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast('Profile updated successfully.');
  }

  return (
    <>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your profile, security and notification preferences."
      />

      <div className="row g-3 g-lg-4">
        {/* Profile */}
        <div className="col-12 col-xl-7">
          <section className="bt-card bt-card-pad mb-4 mb-xl-0">
            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="bt-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                {user?.initials}
              </span>
              <div>
                <h2 className="h5 mb-1">{user?.fullName}</h2>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <StatusBadge status={user?.role ?? 'Worker'} tone="info" withDot={false} />
                  <span className="bt-label mb-0">{user?.employeeId}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <FormField
                    label="Full name"
                    value={values.fullName}
                    onChange={(value) => setField('fullName', value)}
                    error={errors.fullName}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <FormField
                    type="email"
                    label="Email"
                    value={values.email}
                    onChange={(value) => setField('email', value)}
                    error={errors.email}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <FormField
                    type="tel"
                    label="Phone"
                    value={values.phone}
                    onChange={(value) => setField('phone', value)}
                    error={errors.phone}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <FormField
                    label="Department"
                    value={values.department}
                    onChange={(value) => setField('department', value)}
                    error={errors.department}
                    required
                  />
                </div>

                <div className="col-12">
                  <FormField
                    label="Role"
                    value={user?.role ?? ''}
                    onChange={() => undefined}
                    disabled
                    hint="Your role is managed by an administrator and cannot be changed here."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-accent">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Preferences */}
        <div className="col-12 col-xl-5">
          <section className="bt-card bt-card-pad mb-4">
            <h2 className="h6 mb-1">Notification channels</h2>
            <p className="bt-text-muted small mb-3">
              Choose how BuildTrack delivers alerts (SMTP email and Twilio SMS on the
              backend).
            </p>

            {(
              [
                { key: 'email', label: 'Email notifications', icon: 'bi-envelope' },
                { key: 'sms', label: 'SMS notifications', icon: 'bi-chat-dots' },
                { key: 'inApp', label: 'In-app notifications', icon: 'bi-bell' },
              ] as const
            ).map((channel) => (
              <div
                key={channel.key}
                className="form-check form-switch d-flex align-items-center justify-content-between mb-3 ps-0"
              >
                <label className="form-check-label d-flex align-items-center gap-2" htmlFor={`ch-${channel.key}`}>
                  <i className={`bi ${channel.icon} bt-text-dim`} aria-hidden="true" />
                  {channel.label}
                </label>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  id={`ch-${channel.key}`}
                  checked={channels[channel.key]}
                  onChange={(event) =>
                    setChannels((current) => ({
                      ...current,
                      [channel.key]: event.target.checked,
                    }))
                  }
                />
              </div>
            ))}
          </section>

          <section className="bt-card bt-card-pad">
            <h2 className="h6 mb-1">Notification types</h2>
            <p className="bt-text-muted small mb-3">
              Subscribe to the notification types you want to receive.
            </p>

            {NOTIFICATION_TYPES.map((type) => (
              <div
                key={type}
                className="form-check form-switch d-flex align-items-center justify-content-between mb-2 ps-0"
              >
                <label className="form-check-label" htmlFor={`type-${type}`}>
                  {type}
                </label>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  id={`type-${type}`}
                  checked={subscribedTypes[type]}
                  onChange={(event) =>
                    setSubscribedTypes((current) => ({
                      ...current,
                      [type]: event.target.checked,
                    }))
                  }
                />
              </div>
            ))}

            <div className="d-flex justify-content-end mt-3">
              <button
                type="button"
                className="btn btn-outline-bt btn-sm"
                onClick={() => setToast('Notification preferences saved.')}
              >
                Save preferences
              </button>
            </div>
          </section>
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
