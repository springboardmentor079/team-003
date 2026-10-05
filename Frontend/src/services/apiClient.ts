/**
 * Thin API boundary for the BuildTrack FastAPI backend.
 *
 * `request()` performs the real HTTP call (JWT bearer auth, JSON body,
 * backend error-detail surfacing). `mockResponse` / `mockError` remain for
 * the modules that are not part of Milestone 2 and still serve bundled data.
 */

/**
 * Base path for all API v1 calls. In dev, Vite proxies `/api` → the FastAPI
 * server (see vite.config.ts), so the default keeps the browser same-origin.
 * Override with VITE_API_BASE_URL to point at a deployed backend.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const TOKEN_KEY = 'buildtrack.token';

/** Network latency simulated for the mock (non-M2) services, in ms. */
const MOCK_LATENCY_MS = 180;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function mockResponse<T>(data: T, latency = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), latency);
  });
}

export function mockError<T>(message: string, status = 400): Promise<T> {
  return new Promise((_resolve, reject) => {
    window.setTimeout(() => reject(new ApiError(message, status)), MOCK_LATENCY_MS);
  });
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serialisable body. */
  body?: unknown;
  /** Multipart body. The browser supplies the boundary and Content-Type. */
  formData?: FormData;
  /** Send as application/x-www-form-urlencoded (OAuth2 token endpoints). */
  form?: Record<string, string>;
  /** Attach the stored bearer token. Defaults to true. */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function download(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError('Cannot reach the BuildTrack server. Is the backend running?', 0);
  }
  if (!response.ok) {
    const raw = await response.text();
    let payload: unknown = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = null; }
    throw new ApiError(readErrorDetail(payload, `Download failed (${response.status}).`), response.status);
  }
  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
  return { blob: await response.blob(), filename };
}

function readErrorDetail(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    // FastAPI validation errors come back as an array of {msg,...}.
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object') {
      const first = detail[0] as { msg?: string };
      if (first.msg) return first.msg;
    }
  }
  return fallback;
}

/** Performs an authenticated JSON request against the FastAPI backend. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, form, auth = true, signal } = options;
  const token = auth ? localStorage.getItem(TOKEN_KEY) : null;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload, signal });
  } catch {
    throw new ApiError('Cannot reach the BuildTrack server. Is the backend running?', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  const data = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(
      readErrorDetail(data, `Request to ${path} failed (${response.status}).`),
      response.status,
    );
  }

  return data as T;
}

/** True when a failure was a transport error (backend unreachable). */
export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}
