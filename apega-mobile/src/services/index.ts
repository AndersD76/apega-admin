// Re-exportar todos os serviços
export * from './api';
export * from './auth';
export * from './products';
export * from './orders';
export * from './cart';
export * from './favorites';
export * from './analytics';

// Importar serviços como módulos
import api from './api';
import auth from './auth';
import products from './products';
import orders from './orders';
import cart from './cart';
import favorites from './favorites';
import analytics from './analytics';

export default {
  api,
  auth,
  products,
  orders,
  cart,
  favorites,
  analytics,
};
