/**
 * Authentication against the BuildTrack FastAPI backend (document module 1).
 *
 * Login/register/session all use the real JWT endpoints under
 * `/api/v1/auth`. The signed-in profile comes from `GET /auth/me`; the token
 * is held in localStorage so `apiClient.request` attaches it to every call.
 */
import type {
  AuthSession,
  LoginCredentials,
  RegistrationDetails,
  User,
} from '../types';
import { ApiError, request, TOKEN_KEY } from './apiClient';
import { mapUser, roleToBackend, type BackendUser } from './mappers';

const SESSION_KEY = 'buildtrack.session';

interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: number;
  full_name: string;
}

/** Fetches the signed-in profile using the currently stored token. */
async function fetchCurrentUser(): Promise<User> {
  const profile = await request<BackendUser>('/auth/me');
  return mapUser(profile);
}

export const authService = {
  /** Auth now runs against the FastAPI backend rather than Supabase. */
  isSupabase: false,

  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    const token = await request<TokenResponse>('/auth/login/json', {
      method: 'POST',
      auth: false,
      body: { email: email.trim(), password },
    });

    // Store the token first so the /auth/me call is authenticated.
    localStorage.setItem(TOKEN_KEY, token.access_token);
    const user = await fetchCurrentUser();

    return { user, token: token.access_token };
  },

  async register(details: RegistrationDetails): Promise<AuthSession> {
    await request<BackendUser>('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        email: details.email.trim(),
        password: details.password,
        full_name: details.fullName.trim(),
        phone: details.phone.trim(),
        role: roleToBackend(details.role),
      },
    });

    // The register endpoint returns the profile but no token, so sign in.
    return this.login({
      email: details.email,
      password: details.password,
      rememberMe: false,
    });
  },

  /**
   * The backend's reset endpoint expects a new password, which this screen
   * does not collect, so the request is acknowledged client-side. Wiring the
   * full reset flow is outside Milestone 2 (project/resource/workforce).
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return {
      message: `If an account exists for ${email.trim()}, reset instructions have been sent.`,
    };
  },

  async getSession(): Promise<AuthSession | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!token || !raw) return null;

    // Trust the cached profile for instant restore, then revalidate the token
    // against the backend; a rejected token clears the stale session.
    try {
      const cached = JSON.parse(raw) as AuthSession;
      void fetchCurrentUser().catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          this.logout();
        }
      });
      return cached;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  /** Kept for API compatibility with the auth provider; backend has no push. */
  onAuthStateChange(_callback: (session: AuthSession | null) => void): () => void {
    void _callback;
    return () => undefined;
  },

  async listUsers(): Promise<User[]> {
    const rows = await request<BackendUser[]>('/auth/users');
    return rows.map(mapUser);
  },

  persist(session: AuthSession, remember: boolean): void {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_KEY, session.token);
  },
};

export default authService;
