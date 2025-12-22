import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredUser, getCurrentUser, login as authLogin, logout as authLogout, register as authRegister, User } from '../services/auth';
import { loadToken, saveToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário ao iniciar - SEMPRE valida o token com o servidor
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Iniciando verificação de autenticação...');
      try {
        const token = await loadToken();
        console.log('[Auth] Token encontrado:', !!token);

        if (!token) {
          console.log('[Auth] Sem token, limpando dados...');
          await authLogout();
          setUser(null);
          return;
        }

        // SEMPRE verificar se o token é válido com o servidor
        console.log('[Auth] Validando token com servidor...');
        const freshUser = await getCurrentUser();

        if (freshUser) {
          console.log('[Auth] Token válido, usuário:', freshUser.name);
          setUser(freshUser);
        } else {
          console.log('[Auth] Token inválido, fazendo logout...');
          await authLogout();
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Erro ao inicializar:', error);
        await authLogout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authLogin(email, password);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Erro ao fazer login' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response = await authRegister(email, password, name, phone);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Erro ao criar conta' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao criar conta' };
    }
  };

  const refreshUser = async () => {
    const freshUser = await getCurrentUser();
    if (freshUser) {
      setUser(freshUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
