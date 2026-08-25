import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import api, { AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT, AUTH_USER_KEY } from 'services/api';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // api.ts can't reach into React context (it's a plain module), so a global
  // 401 there dispatches this event and we react to it here instead.
  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  // Restore session on first load: validate the stored token against the
  // backend rather than trusting whatever is cached in localStorage.
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    api
      .get<AuthUser>('/auth/me')
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearSession]);

  const login = async (username: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
    persistSession(data.token, data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password,
    });
    persistSession(data.token, data.user);
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
