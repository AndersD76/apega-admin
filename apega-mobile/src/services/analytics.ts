import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// ID de sessão único para rastreamento
let sessionId: string | null = null;

// Obter ou criar session ID
const getSessionId = async (): Promise<string> => {
  if (sessionId) return sessionId;

  try {
    sessionId = await AsyncStorage.getItem('@apega:session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('@apega:session_id', sessionId);
    }
    return sessionId;
  } catch {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return sessionId;
  }
};

// Detectar tipo de dispositivo
const getDeviceType = (): string => {
  if (Platform.OS === 'web') return 'desktop';
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'mobile';
};

// ==================== TRACKING FUNCTIONS ====================

/**
 * Registrar visualização de produto
 */
export const trackProductView = async (productId: string, source?: string): Promise<void> => {
  try {
    const session = await getSessionId();

    await api.post('/analytics/track/product-view', {
      product_id: productId,
      session_id: session,
      device_type: getDeviceType(),
      source: source || 'app',
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.log('Analytics: Error tracking product view', error);
  }
};

/**
 * Registrar atividade do carrinho (para monitoramento de abandono)
 */
export const trackCartActivity = async (): Promise<void> => {
  try {
    await api.post('/analytics/track/cart-activity', {
      device_type: getDeviceType(),
    });
  } catch (error) {
    console.log('Analytics: Error tracking cart activity', error);
  }
};

/**
 * Registrar evento genérico (page views, ações, etc.)
 */
export const trackEvent = async (
  eventType: string,
  eventData?: Record<string, any>
): Promise<void> => {
  try {
    const session = await getSessionId();

    await api.post('/analytics/track/event', {
      event_type: eventType,
      event_data: eventData,
      session_id: session,
      device_type: getDeviceType(),
    });
  } catch (error) {
    console.log('Analytics: Error tracking event', error);
  }
};

// ==================== PRESET EVENTS ====================

// Navegação
export const trackPageView = (pageName: string, params?: Record<string, any>) =>
  trackEvent('page_view', { page: pageName, ...params });

// Busca
export const trackSearch = (query: string, resultsCount: number) =>
  trackEvent('search', { query, results_count: resultsCount });

// Favoritos
export const trackFavorite = (productId: string, action: 'add' | 'remove') =>
  trackEvent('favorite', { product_id: productId, action });

// Carrinho
export const trackAddToCart = (productId: string, price: number) => {
  trackEvent('add_to_cart', { product_id: productId, price });
  trackCartActivity();
};

export const trackRemoveFromCart = (productId: string) =>
  trackEvent('remove_from_cart', { product_id: productId });

// Checkout
export const trackCheckoutStart = (cartValue: number, itemsCount: number) =>
  trackEvent('checkout_start', { cart_value: cartValue, items_count: itemsCount });

export const trackCheckoutComplete = (orderId: string, orderValue: number) =>
  trackEvent('checkout_complete', { order_id: orderId, order_value: orderValue });

// Produto
export const trackProductShare = (productId: string) =>
  trackEvent('product_share', { product_id: productId });

export const trackProductCreate = (productId: string) =>
  trackEvent('product_create', { product_id: productId });

// Assinatura
export const trackSubscriptionView = () => trackEvent('subscription_view');

export const trackSubscriptionStart = (plan: string) =>
  trackEvent('subscription_start', { plan });

// Mensagem
export const trackMessageSent = (conversationId: string) =>
  trackEvent('message_sent', { conversation_id: conversationId });

// Erro
export const trackError = (errorType: string, errorMessage: string) =>
  trackEvent('error', { error_type: errorType, error_message: errorMessage });

export const analytics = {
  trackProductView,
  trackCartActivity,
  trackEvent,
  trackPageView,
  trackSearch,
  trackFavorite,
  trackAddToCart,
  trackRemoveFromCart,
  trackCheckoutStart,
  trackCheckoutComplete,
  trackProductShare,
  trackProductCreate,
  trackSubscriptionView,
  trackSubscriptionStart,
  trackMessageSent,
  trackError,
};

export default analytics;
