require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

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
const promoRoutes = require('./routes/promo');
const adminRoutes = require('./routes/admin');
const tagsRoutes = require('./routes/tags');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store online users: { odí: { odí, socketId } }
const onlineUsers = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);

  // Add user to online users
  onlineUsers.set(socket.userId, {
    odí: socket.userId,
    socketId: socket.id
  });

  // Send the list of currently online users to the newly connected user
  const onlineUserIds = Array.from(onlineUsers.keys());
  socket.emit('online_users_list', { users: onlineUserIds });

  // Broadcast user online status to ALL users
  io.emit('user_status', {
    userId: socket.userId,
    online: true
  });

  // Join user's personal room for private messages
  socket.join(`user_${socket.userId}`);

  // Handle sending a message
  socket.on('send_message', async (data) => {
    const { conversationId, receiverId, content, productId } = data;

    // Emit to receiver's room
    io.to(`user_${receiverId}`).emit('new_message', {
      conversationId,
      senderId: socket.userId,
      content,
      productId,
      timestamp: new Date().toISOString()
    });

    // Also emit notification
    io.to(`user_${receiverId}`).emit('notification', {
      type: 'message',
      title: 'Nova mensagem',
      message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      data: { conversationId }
    });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { conversationId, receiverId } = data;
    io.to(`user_${receiverId}`).emit('user_typing', {
      conversationId,
      userId: socket.userId
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    const { conversationId, receiverId } = data;
    io.to(`user_${receiverId}`).emit('user_stop_typing', {
      conversationId,
      userId: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);

    // Broadcast user offline status
    io.emit('user_status', {
      userId: socket.userId,
      online: false
    });
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Middlewares - CORS configurado para permitir requests do app mobile e web
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow all origins for mobile app compatibility
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests explicitly
app.options('*', cors());

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'largo-api', version: '2.0.0' });
});

// Rota do Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
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
app.use('/api/promo', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tags', tagsRoutes);

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

server.listen(PORT, () => {
  console.log(`🚀 Largô API rodando na porta ${PORT}`);
  console.log(`📦 API disponível em http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}`);
});
