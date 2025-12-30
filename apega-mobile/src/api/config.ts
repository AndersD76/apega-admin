import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// URLs do Backend
const PRODUCTION_URL = 'https://apega-desapega-production.up.railway.app/api';
const DEVELOPMENT_URL = Platform.select({
  web: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api', // Android Emulator
  ios: 'http://localhost:3001/api',
  default: 'http://localhost:3001/api',
});

// Altere para true quando fizer deploy para produção
const USE_PRODUCTION = true;

export const API_URL = USE_PRODUCTION ? PRODUCTION_URL : DEVELOPMENT_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('@auth_token');
      AsyncStorage.removeItem('@user');
    }
    return Promise.reject(error);
  }
);

export default api;
