import api, { saveToken, removeToken, loadToken } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  store_name?: string;
  store_description?: string;
  subscription_type: 'free' | 'premium';
  subscription_expires_at?: string;
  rating: number;
  total_reviews: number;
  total_sales: number;
  total_followers: number;
  total_following: number;
  balance: number;
  cashback_balance: number;
  is_verified: boolean;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

// Registrar novo usuário
export const register = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    name,
    phone,
  });

  if (response.token) {
    await saveToken(response.token);
    await saveUser(response.user);
  }

  return response;
};

// Login
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  if (response.token) {
    await saveToken(response.token);
    await saveUser(response.user);
  }

  return response;
};

// Logout - limpa TODOS os dados de autenticação
export const logout = async (): Promise<void> => {
  try {
    await removeToken();
    await AsyncStorage.removeItem('@apega:user');
    await AsyncStorage.removeItem('@apega:token');
    // Limpar qualquer outro dado de sessão
    const keys = await AsyncStorage.getAllKeys();
    const sessionKeys = keys.filter(k => k.startsWith('@apega:'));
    if (sessionKeys.length > 0) {
      await AsyncStorage.multiRemove(sessionKeys);
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

// Obter usuário atual
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await loadToken();
    if (!token) return null;

    const response = await api.get<{ user: User }>('/auth/me');
    await saveUser(response.user);
    return response.user;
  } catch {
    return null;
  }
};

// Atualizar perfil
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put<{ user: User }>('/auth/me', data);
  await saveUser(response.user);
  return response.user;
};

// Alterar senha
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.put('/auth/password', { currentPassword, newPassword });
};

// Salvar usuário localmente
const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem('@apega:user', JSON.stringify(user));
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
  }
};

// Carregar usuário do storage
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem('@apega:user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

// Verificar se está autenticado
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await loadToken();
  return !!token;
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  getStoredUser,
  isAuthenticated,
};
