require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const favoritesRoutes = require('./routes/favorites');
const addressesRoutes = require('./routes/addresses');
const paymentsRoutes = require('./routes/payments');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const reviewsRoutes = require('./routes/reviews');
const categoriesRoutes = require('./routes/categories');
const checkoutRoutes = require('./routes/checkout');
const shippingRoutes = require('./routes/shipping');
const subscriptionsRoutes = require('./routes/subscriptions');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir frontend web (build do Expo)
app.use(express.static(path.join(__dirname, '../public')));

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Erro interno do servidor'
  });
});

// 404 handler - Para rotas da API, retorna JSON. Para outras rotas, serve o frontend
app.use((req, res) => {
  // Se é rota da API, retorna JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Rota não encontrada' });
  }

  // Se é um arquivo estático (tem extensão), retorna 404
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(req.path);
  if (hasExtension) {
    return res.status(404).send('File not found');
  }

  // Para rotas de navegação (SPA), serve o index.html
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📦 API disponível em http://localhost:${PORT}/api`);
});
