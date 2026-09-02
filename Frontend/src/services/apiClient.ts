/**
 * Thin API boundary.
 *
 * Every service in this folder returns a Promise, so switching from the
 * bundled mock data to the FastAPI backend is a one-line change inside each
 * service: replace `mockResponse(...)` with `request(...)`.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Network latency simulated for mock responses, in milliseconds. */
const MOCK_LATENCY_MS = 220;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Resolves with the supplied fixture after a short, realistic delay. */
export function mockResponse<T>(data: T, latency = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), latency);
  });
}

/** Rejects with an ApiError after a short delay — used for failed logins. */
export function mockError<T>(message: string, status = 400): Promise<T> {
  return new Promise((_resolve, reject) => {
    window.setTimeout(() => reject(new ApiError(message, status)), MOCK_LATENCY_MS);
  });
}

/**
 * Real HTTP call against the FastAPI backend. Not exercised by the demo
 * fixtures, but kept here so services have a drop-in replacement ready.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('buildtrack.token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status);
  }

  return (await response.json()) as T;
}
