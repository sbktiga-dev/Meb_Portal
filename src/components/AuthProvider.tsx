'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  inn: string | null;
  avatar: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getToken(): string | null {
  const token = localStorage.getItem('token');
  if (token) return token;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    window.location.href = '/';
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  // Refetch on tab focus / visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUser();
      }
    };
    window.addEventListener('focus', fetchUser);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', fetchUser);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
