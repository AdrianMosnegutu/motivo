'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  type AuthCredentials,
  type AuthUser,
  getAuthErrorMessage,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from './auth-api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  lastError: string | null;
  isAuthenticated: boolean;
  clearError: () => void;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
  register: (credentials: AuthCredentials) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setStatus(currentUser ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      active = false;
    };
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus(currentUser ? 'authenticated' : 'unauthenticated');
      setLastError(null);
      return currentUser;
    } catch (error) {
      setUser(null);
      setStatus('unauthenticated');
      setLastError(getAuthErrorMessage(error));
      return null;
    }
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    try {
      const nextUser = await loginUser(credentials);
      setUser(nextUser);
      setStatus('authenticated');
      setLastError(null);
      return nextUser;
    } catch (error) {
      setLastError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: AuthCredentials) => {
    try {
      const nextUser = await registerUser(credentials);
      setUser(nextUser);
      setStatus('authenticated');
      setLastError(null);
      return nextUser;
    } catch (error) {
      setLastError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      setStatus('unauthenticated');
      setLastError(null);
    } catch (error) {
      setLastError(getAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      lastError,
      isAuthenticated: Boolean(user),
      clearError,
      login,
      logout,
      refresh,
      register,
    }),
    [clearError, lastError, login, logout, refresh, register, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
