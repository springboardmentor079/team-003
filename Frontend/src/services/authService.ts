import type { Session } from '@supabase/supabase-js';

import { DEMO_PASSWORD, users } from '../data/users';
import type {
  AuthSession,
  LoginCredentials,
  RegistrationDetails,
  User,
  UserRole,
} from '../types';
import { initialsOf } from '../utils/format';
import { mockError, mockResponse } from './apiClient';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const SESSION_KEY = 'buildtrack.session';
const TOKEN_KEY = 'buildtrack.token';

/** Shape of a row in public.profiles. */
interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  employee_id: string | null;
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  last_login: string | null;
}

function profileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    employeeId: row.employee_id ?? '—',
    department: row.department,
    status: row.status,
    lastLogin: row.last_login
      ? row.last_login.slice(0, 16).replace('T', ' ')
      : '—',
    initials: initialsOf(row.full_name),
  };
}

/** Loads the profile row for an authenticated user id. */
async function loadProfile(userId: string): Promise<User> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, role, employee_id, department, status, last_login',
    )
    .eq('id', userId)
    .single<ProfileRow>();

  if (error || !data) {
    throw new Error('Signed in, but your profile could not be loaded.');
  }

  return profileToUser(data);
}

function toAuthSession(user: User, session: Session): AuthSession {
  return { user, token: session.access_token };
}

/* ------------------------------------------------------------------ */
/* Supabase-backed implementation                                      */
/* ------------------------------------------------------------------ */

const supabaseAuth = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Invalid email address or password.');
    }

    const user = await loadProfile(data.session.user.id);

    if (user.status !== 'Active') {
      await supabase.auth.signOut();
      throw new Error('This account is not active. Contact your administrator.');
    }

    // Record the login time (fire-and-forget; guarded by RLS to own row).
    void supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return toAuthSession(user, data.session);
  },

  async register(details: RegistrationDetails): Promise<AuthSession> {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: details.email.trim(),
      password: details.password,
      options: {
        data: {
          full_name: details.fullName.trim(),
          phone: details.phone.trim(),
          role: details.role,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      // Email confirmation is enabled on the project.
      throw new Error(
        'Account created. Please confirm your email address, then sign in.',
      );
    }

    const user = await loadProfile(data.session.user.id);
    return toAuthSession(user, data.session);
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: `If an account exists for ${email.trim()}, a reset link has been sent.`,
    };
  },

  async getSession(): Promise<AuthSession | null> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    try {
      const user = await loadProfile(data.session.user.id);
      return toAuthSession(user, data.session);
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await getSupabase().auth.signOut();
  },

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const supabase = getSupabase();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        callback(null);
        return;
      }
      loadProfile(session.user.id)
        .then((user) => callback(toAuthSession(user, session)))
        .catch(() => callback(null));
    });

    return () => data.subscription.unsubscribe();
  },

  async listUsers(): Promise<User[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, phone, role, employee_id, department, status, last_login',
      )
      .order('full_name');

    if (error || !data) {
      throw new Error('Unable to load users.');
    }

    return (data as ProfileRow[]).map(profileToUser);
  },
};

/* ------------------------------------------------------------------ */
/* Mock implementation (used when Supabase env vars are absent)        */
/* ------------------------------------------------------------------ */

function issueMockToken(user: User): string {
  return `mock-jwt.${btoa(user.id)}.${Date.now()}`;
}

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
    // Mock sessions never change out from under us.
    return () => undefined;
  },

  async listUsers(): Promise<User[]> {
    return mockResponse(users);
  },

  /** Persist a mock session (no-op for the Supabase client, which self-persists). */
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
  isSupabase: isSupabaseConfigured,

  login: isSupabaseConfigured ? supabaseAuth.login : mockAuth.login,
  register: isSupabaseConfigured ? supabaseAuth.register : mockAuth.register,
  requestPasswordReset: isSupabaseConfigured
    ? supabaseAuth.requestPasswordReset
    : mockAuth.requestPasswordReset,
  getSession: isSupabaseConfigured ? supabaseAuth.getSession : mockAuth.getSession,
  logout: isSupabaseConfigured ? supabaseAuth.logout : mockAuth.logout,
  onAuthStateChange: isSupabaseConfigured
    ? supabaseAuth.onAuthStateChange
    : mockAuth.onAuthStateChange,
  listUsers: isSupabaseConfigured ? supabaseAuth.listUsers : mockAuth.listUsers,

  /** Mock-only session persistence; a no-op under Supabase. */
  persist(session: AuthSession, remember: boolean): void {
    if (!isSupabaseConfigured) mockAuth.persist(session, remember);
  },
};
