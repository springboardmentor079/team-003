import { DEMO_PASSWORD, users } from '../data/users';
import type {
  AuthSession,
  LoginCredentials,
  RegistrationDetails,
  User,
} from '../types';
import { initialsOf } from '../utils/format';
import { mockError, mockResponse } from './apiClient';

const SESSION_KEY = 'buildtrack.session';
const TOKEN_KEY = 'buildtrack.token';

function issueMockToken(user: User): string {
  return `mock-jwt.${btoa(user.id)}.${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/* Clean Mock Implementation                                          */
/* ------------------------------------------------------------------ */

const mockAuth = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    const user = users.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!user || password !== DEMO_PASSWORD) {
      return mockError<AuthSession>('Invalid email address or password.', 401);
    }
    if (user.status !== 'Active') {
      return mockError<AuthSession>(
        'This account is not active. Contact your administrator.',
        403,
      );
    }

    return mockResponse({ user, token: issueMockToken(user) });
  },

  async register(details: RegistrationDetails): Promise<AuthSession> {
    const exists = users.some(
      (candidate) => candidate.email.toLowerCase() === details.email.trim().toLowerCase(),
    );
    if (exists) {
      return mockError<AuthSession>('An account with this email already exists.', 409);
    }

    const user: User = {
      id: `u-${Date.now()}`,
      fullName: details.fullName.trim(),
      email: details.email.trim().toLowerCase(),
      phone: details.phone.trim(),
      role: details.role,
      employeeId: `BT-NEW-${String(users.length + 1).padStart(3, '0')}`,
      department: 'Pending assignment',
      status: 'Active',
      lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' '),
      initials: initialsOf(details.fullName),
    };

    return mockResponse({ user, token: issueMockToken(user) });
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const exists = users.some(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!exists) {
      return mockError<{ message: string }>(
        'No BuildTrack account is registered with that email address.',
        404,
      );
    }
    return mockResponse({
      message: `Password reset instructions have been sent to ${email.trim()}.`,
    });
  },

  async getSession(): Promise<AuthSession | null> {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  onAuthStateChange(): () => void {
    // Mock sessions never change out from under us locally
    return () => undefined;
  },

  async listUsers(): Promise<User[]> {
    return mockResponse(users);
  },

  /** Persist a mock session */
  persist(session: AuthSession, remember: boolean): void {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_KEY, session.token);
  },
};

/* ------------------------------------------------------------------ */
/* Public surface                                                      */
/* ------------------------------------------------------------------ */

export const authService = {
  // Always false now since Supabase frontend functionality is removed
  isSupabase: false,

  login: mockAuth.login,
  register: mockAuth.register,
  requestPasswordReset: mockAuth.requestPasswordReset,
  getSession: mockAuth.getSession,
  logout: mockAuth.logout,
  onAuthStateChange: mockAuth.onAuthStateChange,
  listUsers: mockAuth.listUsers,

  /** Mock session persistence */
  persist(session: AuthSession, remember: boolean): void {
    mockAuth.persist(session, remember);
  },
};

export default authService;
