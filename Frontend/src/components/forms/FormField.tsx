import { useId, type ChangeEvent, type ReactNode } from 'react';

type FieldType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date';

interface BaseFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Renders the underline style used by the Figma sign-in card. */
  variant?: 'boxed' | 'underline';
  /** Element rendered inside the field on the right, e.g. a reveal toggle. */
  trailing?: ReactNode;
}

interface InputFieldProps extends BaseFieldProps {
  as?: 'input';
  type?: FieldType;
  min?: number;
  step?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  as: 'select';
  options: readonly string[];
  placeholderOption?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  as: 'textarea';
  rows?: number;
}

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

/**
 * Labelled form control with validation messaging.
 *
 * One component covers inputs, selects and textareas so every form in the
 * app produces identical markup, spacing and error styling.
 */
export function FormField(props: FormFieldProps) {
  const {
    label,
    value,
    onChange,
    error,
    hint,
    required,
    disabled,
    placeholder,
    className = '',
    variant = 'boxed',
    trailing,
  } = props;

  const fieldId = useId();
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  const invalidClass = error ? 'is-invalid' : '';

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    onChange(event.target.value);
  }

  return (
    <div
      className={`${variant === 'underline' ? 'bt-field-underline' : ''} ${className}`.trim()}
    >
      <label className="form-label d-block" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="bt-accent ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="position-relative">
        {props.as === 'select' ? (
          <select
            id={fieldId}
            className={`form-select ${invalidClass}`.trim()}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          >
            <option value="">{props.placeholderOption ?? `Select ${label.toLowerCase()}`}</option>
            {props.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : props.as === 'textarea' ? (
          <textarea
            id={fieldId}
            className={`form-control ${invalidClass}`.trim()}
            value={value}
            onChange={handleChange}
            rows={props.rows ?? 3}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          />
        ) : (
          <input
            id={fieldId}
            type={props.type ?? 'text'}
            className={`form-control ${invalidClass}`.trim()}
            style={trailing ? { paddingRight: '2.75rem' } : undefined}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={props.min}
            step={props.step}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          />
        )}

        {trailing && (
          <div
            className="position-absolute top-50 translate-middle-y d-flex align-items-center"
            style={{ right: '0.5rem' }}
          >
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <div className="invalid-feedback d-block" id={`${fieldId}-error`}>
          {error}
        </div>
      ) : hint ? (
        <div className="bt-text-muted small mt-1" id={`${fieldId}-hint`}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
