import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';

const TOKEN_KEY = 'sm_auth_token';
const USER_KEY = 'sm_auth_user';
const EXP_KEY = 'sm_auth_expires';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { token: string | null; username: string | null } {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const username = sessionStorage.getItem(USER_KEY);
    const exp = sessionStorage.getItem(EXP_KEY);
    if (!token || !exp) return { token: null, username: null };
    if (Date.now() > new Date(exp).getTime()) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(EXP_KEY);
      return { token: null, username: null };
    }
    return { token, username };
  } catch {
    return { token: null, username: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState<string | null>(stored.token);
  const [username, setUsername] = useState<string | null>(stored.username);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.setAuthToken(token);
    setReady(true);
  }, [token]);

  const login = useCallback(async (user: string, password: string) => {
    const result = await api.login(user, password);
    sessionStorage.setItem(TOKEN_KEY, result.token);
    sessionStorage.setItem(USER_KEY, result.username);
    sessionStorage.setItem(EXP_KEY, result.expiresAt);
    api.setAuthToken(result.token);
    setToken(result.token);
    setUsername(result.username);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(EXP_KEY);
    api.setAuthToken(null);
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, username, ready, login, logout }),
    [token, username, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
