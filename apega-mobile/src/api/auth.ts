import api from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  instagram?: string;
  store_name?: string;
  store_description?: string;
  subscription_type: 'free' | 'premium' | 'premium_plus';
  rating?: number;
  total_reviews?: number;
  total_sales?: number;
  total_followers?: number;
  total_following?: number;
  balance?: number;
  is_verified?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });

    if (response.data.success) {
      await AsyncStorage.setItem('@auth_token', response.data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);

    if (response.data.success) {
      await AsyncStorage.setItem('@auth_token', response.data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const response = await api.get('/auth/me');

    // Save updated user to AsyncStorage to persist changes like avatar_url
    if (response.data.success && response.data.user) {
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<{ success: boolean; user: User }> {
    const response = await api.put('/auth/me', data);

    if (response.data.success) {
      await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@user');
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const user = await AsyncStorage.getItem('@user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('@auth_token');
    return !!token;
  },
};

export default authService;
