import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '../types';
import { api } from '../services/api';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  login: (usernameOrEmail: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore stored session on mount & observe Firebase Auth state
  useEffect(() => {
    const savedToken = localStorage.getItem('portiva_token');
    const savedUser = localStorage.getItem('portiva_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('portiva_token');
        localStorage.removeItem('portiva_user');
      }
    }

    // Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const isSuper = fbUser.email?.toLowerCase() === 'intannfpipsmg@gmail.com';
        const adminUser: AdminUser = {
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || 'admin',
          email: fbUser.email || 'admin@portiva.co.id',
          full_name: fbUser.displayName || (isSuper ? 'Intan NFP (Super Admin)' : 'Administrator Portiva'),
          role: isSuper ? 'Super Admin' : 'Super Admin',
          avatar: fbUser.photoURL || undefined,
        };
        setUser(adminUser);
        const tok = `fb_token_${fbUser.uid}`;
        setToken(tok);
        localStorage.setItem('portiva_token', tok);
        localStorage.setItem('portiva_user', JSON.stringify(adminUser));
      }
      setIsLoading(false);
    });

    // Timeout safety for initial loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (usernameOrEmail: string, pass: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.login(usernameOrEmail, pass);
      if (res && res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('portiva_token', res.data.token);
        localStorage.setItem('portiva_user', JSON.stringify(res.data.user));
        return true;
      } else {
        const errMsg = res?.message || 'Username atau password salah.';
        setError(errMsg);
        return false;
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal menghubungi server database.';
      setError(msg);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res && res.user) {
        const isSuper = res.user.email?.toLowerCase() === 'intannfpipsmg@gmail.com';
        const adminUser: AdminUser = {
          id: res.user.uid,
          username: res.user.email?.split('@')[0] || 'google_user',
          email: res.user.email || '',
          full_name: res.user.displayName || 'Google Operator',
          role: isSuper ? 'Super Admin' : 'Super Admin',
          avatar: res.user.photoURL || undefined,
        };
        setUser(adminUser);
        const tok = `fb_token_${res.user.uid}`;
        setToken(tok);
        localStorage.setItem('portiva_token', tok);
        localStorage.setItem('portiva_user', JSON.stringify(adminUser));
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Login dengan akun Google gagal.');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('portiva_token');
    localStorage.removeItem('portiva_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        setError,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
