import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('portiva_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('portiva_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('portiva_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('portiva_user', JSON.stringify(res.user));
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('portiva_token');
            localStorage.removeItem('portiva_user');
          }
        } catch (err) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('portiva_token');
          localStorage.removeItem('portiva_user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setError('Sesi login telah habis. Silakan masuk kembali.');
    };

    window.addEventListener('portiva:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('portiva:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, pass: string) => {
    setError(null);
    try {
      const res = await api.login(username, pass);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('portiva_token', res.token);
        localStorage.setItem('portiva_user', JSON.stringify(res.user));
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
      throw err;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        error,
        setError,
      }}
    >
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
