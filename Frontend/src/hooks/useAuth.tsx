import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authService } from '../services/authService';
import type { AuthSession, LoginCredentials, RegistrationDetails, User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True until the initial session lookup completes. */
  initializing: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (details: RegistrationDetails) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore any existing session on mount, then keep it in sync with
  // Supabase auth-state changes (token refresh, sign-out in another tab).
  useEffect(() => {
    let active = true;

    authService
      .getSession()
      .then((restored) => {
        if (active) setSession(restored);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    const unsubscribe = authService.onAuthStateChange((next) => {
      if (active) setSession(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await authService.login(credentials);
    authService.persist(next, credentials.rememberMe);
    setSession(next);
  }, []);

  const register = useCallback(async (details: RegistrationDetails) => {
    const next = await authService.register(details);
    authService.persist(next, false);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      initializing,
      login,
      register,
      logout,
    }),
    [session, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
