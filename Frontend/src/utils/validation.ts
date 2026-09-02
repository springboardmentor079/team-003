/** Small, dependency-free validators used by the auth and entity forms. */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{7,17}$/;

export function requiredField(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email address is required.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address.';
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  if (!value.trim()) return 'Phone number is required.';
  if (!PHONE_PATTERN.test(value.trim())) return 'Enter a valid phone number.';
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return undefined;
}

export function validatePasswordMatch(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return 'Confirm your password.';
  if (password !== confirmation) return 'Passwords do not match.';
  return undefined;
}

export function validatePositiveNumber(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} must be a number.`;
  if (parsed <= 0) return `${label} must be greater than zero.`;
  return undefined;
}

/** True when every value in the error map is undefined. */
export function isValid<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).every((error) => !error);
}
