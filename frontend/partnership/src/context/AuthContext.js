import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('accessToken')
  );
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      return undefined;
    }

    let cancelled = false;
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const user = await response.json();
        if (!cancelled) {
          setIsAdmin(user.authorities?.some((entry) =>
            (typeof entry === 'string' ? entry : entry?.authority) === 'ROLE_ADMIN'
          ) || false);
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };

    fetchCurrentUser();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const login = useCallback((accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setIsAdmin(false);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAdmin(false);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, login, logout }),
    [isAuthenticated, isAdmin, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}