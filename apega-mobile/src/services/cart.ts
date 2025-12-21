import api from './api';
import { Product } from './products';
import { trackAddToCart, trackRemoveFromCart, trackCartActivity } from './analytics';

export interface CartItem extends Product {
  cart_item_id: string;
  added_at: string;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

interface CartResponse {
  success: boolean;
  items: CartItem[];
  summary: CartSummary;
}

// Listar itens do carrinho
export const getCart = async (): Promise<CartResponse> => {
  const response = await api.get<CartResponse>('/cart');

  // Track cart activity for abandonment monitoring
  if (response.items && response.items.length > 0) {
    trackCartActivity();
  }

  return response;
};

// Adicionar ao carrinho
export const addToCart = async (productId: string, price?: number): Promise<void> => {
  await api.post('/cart', { product_id: productId });

  // Track for analytics
  trackAddToCart(productId, price || 0);
};

// Remover do carrinho
export const removeFromCart = async (productId: string): Promise<void> => {
  await api.delete(`/cart/${productId}`);

  // Track for analytics
  trackRemoveFromCart(productId);
};

// Limpar carrinho
export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};

export default {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
};
