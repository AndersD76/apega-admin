const express = require('express');
const { sql } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ==================== TRACKING ENDPOINTS ====================

// Registrar visualização de produto (chamado pelo app quando usuário vê um produto)
router.post('/track/product-view', optionalAuth, async (req, res, next) => {
  try {
    const { product_id, session_id, device_type, source } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: true, message: 'product_id é obrigatório' });
    }

    // Inserir na tabela product_views
    await sql`
      INSERT INTO product_views (product_id, user_id, session_id, device_type, source)
      VALUES (
        ${product_id},
        ${req.user?.id || null},
        ${session_id || null},
        ${device_type || 'mobile'},
        ${source || 'app'}
      )
    `;

    // Também incrementar o contador de views do produto
    await sql`UPDATE products SET views = views + 1 WHERE id = ${product_id}`;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Registrar atividade do carrinho (para monitorar abandono)
router.post('/track/cart-activity', authenticate, async (req, res, next) => {
  try {
    const { device_type } = req.body;
    const userId = req.user.id;

    // Buscar itens atuais do carrinho
    const cartItems = await sql`
      SELECT ci.*, p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ${userId} AND p.status = 'active'
    `;

    const itemsCount = cartItems.length;
    const totalValue = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

    if (itemsCount === 0) {
      // Se não tem itens, não precisa rastrear
      return res.json({ success: true, cart_id: null });
    }

    // Verificar se já existe um carrinho ativo para este usuário
    const existingCart = await sql`
      SELECT id FROM carts
      WHERE user_id = ${userId} AND status = 'active'
      LIMIT 1
    `;

    let cartId;

    if (existingCart.length > 0) {
      // Atualizar carrinho existente
      cartId = existingCart[0].id;
      await sql`
        UPDATE carts
        SET
          total_value = ${totalValue},
          items_count = ${itemsCount},
          last_activity_at = NOW(),
          device_type = COALESCE(${device_type}, device_type),
          abandoned_at = NULL
        WHERE id = ${cartId}
      `;
    } else {
      // Criar novo carrinho
      const newCart = await sql`
        INSERT INTO carts (user_id, total_value, items_count, last_activity_at, device_type, status)
        VALUES (${userId}, ${totalValue}, ${itemsCount}, NOW(), ${device_type || 'mobile'}, 'active')
        RETURNING id
      `;
      cartId = newCart[0].id;
    }

    res.json({ success: true, cart_id: cartId });
  } catch (error) {
    next(error);
  }
});

// Registrar evento genérico (page views, ações, etc)
router.post('/track/event', optionalAuth, async (req, res, next) => {
  try {
    const { event_type, event_data, session_id, device_type } = req.body;

    // Inserir na tabela de eventos (vamos criar)
    await sql`
      INSERT INTO analytics_events (user_id, event_type, event_data, session_id, device_type)
      VALUES (
        ${req.user?.id || null},
        ${event_type},
        ${JSON.stringify(event_data || {})},
        ${session_id || null},
        ${device_type || 'mobile'}
      )
    `;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN DASHBOARD ENDPOINTS ====================

// Dashboard KPIs principais
router.get('/admin/dashboard', async (req, res, next) => {
  try {
    // Período atual (mês)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Período anterior (mês passado)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    // KPIs principais
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalProducts,
      activeProducts,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      commissionThisMonth,
      pendingWithdrawals,
      abandonedCarts
    ] = await Promise.all([
      // Total de usuários
      sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`,
      // Usuários ativos (logaram nos últimos 30 dias)
      sql`SELECT COUNT(*) as count FROM users WHERE last_login_at > NOW() - INTERVAL '30 days'`,
      // Novos usuários este mês
      sql`SELECT COUNT(*) as count FROM users WHERE created_at >= ${startOfMonth.toISOString()}`,
      // Novos usuários mês passado
      sql`SELECT COUNT(*) as count FROM users WHERE created_at >= ${startOfLastMonth.toISOString()} AND created_at < ${startOfMonth.toISOString()}`,
      // Total de produtos
      sql`SELECT COUNT(*) as count FROM products WHERE status != 'deleted'`,
      // Produtos ativos
      sql`SELECT COUNT(*) as count FROM products WHERE status = 'active'`,
      // Total de pedidos
      sql`SELECT COUNT(*) as count FROM orders`,
      // Pedidos este mês
      sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= ${startOfMonth.toISOString()}`,
      // Pedidos mês passado
      sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= ${startOfLastMonth.toISOString()} AND created_at < ${startOfMonth.toISOString()}`,
      // Receita este mês
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE created_at >= ${startOfMonth.toISOString()} AND status != 'cancelled'`,
      // Receita mês passado
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE created_at >= ${startOfLastMonth.toISOString()} AND created_at < ${startOfMonth.toISOString()} AND status != 'cancelled'`,
      // Comissão este mês
      sql`SELECT COALESCE(SUM(commission_amount), 0) as total FROM orders WHERE created_at >= ${startOfMonth.toISOString()} AND status != 'cancelled'`,
      // Saques pendentes
      sql`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE type = 'withdrawal' AND status = 'pending'`,
      // Carrinhos abandonados (última atividade > 1 hora)
      sql`SELECT COUNT(*) as count FROM carts WHERE status = 'abandoned' OR (status = 'active' AND last_activity_at < NOW() - INTERVAL '1 hour')`
    ]);

    // Calcular variações
    const usersGrowth = newUsersLastMonth[0].count > 0
      ? ((newUsersThisMonth[0].count - newUsersLastMonth[0].count) / newUsersLastMonth[0].count * 100).toFixed(1)
      : 100;

    const ordersGrowth = ordersLastMonth[0].count > 0
      ? ((ordersThisMonth[0].count - ordersLastMonth[0].count) / ordersLastMonth[0].count * 100).toFixed(1)
      : 100;

    const revenueGrowth = parseFloat(revenueLastMonth[0].total) > 0
      ? ((parseFloat(revenueThisMonth[0].total) - parseFloat(revenueLastMonth[0].total)) / parseFloat(revenueLastMonth[0].total) * 100).toFixed(1)
      : 100;

    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(totalUsers[0].count),
          active: parseInt(activeUsers[0].count),
          newThisMonth: parseInt(newUsersThisMonth[0].count),
          growth: parseFloat(usersGrowth)
        },
        products: {
          total: parseInt(totalProducts[0].count),
          active: parseInt(activeProducts[0].count)
        },
        orders: {
          total: parseInt(totalOrders[0].count),
          thisMonth: parseInt(ordersThisMonth[0].count),
          growth: parseFloat(ordersGrowth)
        },
        revenue: {
          thisMonth: parseFloat(revenueThisMonth[0].total),
          lastMonth: parseFloat(revenueLastMonth[0].total),
          growth: parseFloat(revenueGrowth),
          commission: parseFloat(commissionThisMonth[0].total)
        },
        withdrawals: {
          pendingAmount: parseFloat(pendingWithdrawals[0].total),
          pendingCount: parseInt(pendingWithdrawals[0].count)
        },
        carts: {
          abandoned: parseInt(abandonedCarts[0].count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Gráfico de receita por período
router.get('/admin/revenue-chart', async (req, res, next) => {
  try {
    const { period = '6months' } = req.query;

    let interval, groupBy;
    if (period === '7days') {
      interval = '7 days';
      groupBy = 'day';
    } else if (period === '30days') {
      interval = '30 days';
      groupBy = 'day';
    } else {
      interval = '6 months';
      groupBy = 'month';
    }

    const data = await sql`
      SELECT
        DATE_TRUNC(${groupBy}, created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(commission_amount), 0) as commission,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL ${interval}
        AND status != 'cancelled'
      GROUP BY DATE_TRUNC(${groupBy}, created_at)
      ORDER BY date
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Pedidos por status
router.get('/admin/orders-by-status', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY status
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Vendas por categoria
router.get('/admin/sales-by-category', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        c.name as category,
        COUNT(o.id) as sales,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.status != 'cancelled'
      GROUP BY c.name
      ORDER BY sales DESC
      LIMIT 10
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Carrinhos abandonados
router.get('/admin/abandoned-carts', async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Primeiro, marcar carrinhos como abandonados se última atividade > 1 hora
    await sql`
      UPDATE carts
      SET status = 'abandoned', abandoned_at = NOW()
      WHERE status = 'active'
        AND last_activity_at < NOW() - INTERVAL '1 hour'
    `;

    let whereClause = sql`1=1`;
    if (status !== 'all') {
      whereClause = sql`c.status = ${status}`;
    }

    const carts = await sql`
      SELECT
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM carts c
      JOIN users u ON c.user_id = u.id
      WHERE ${whereClause}
      ORDER BY c.last_activity_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned,
        COUNT(*) FILTER (WHERE status = 'recovered') as recovered,
        COUNT(*) FILTER (WHERE status = 'active' AND last_activity_at < NOW() - INTERVAL '1 hour') as expiring,
        COALESCE(SUM(total_value) FILTER (WHERE status = 'abandoned'), 0) as lost_revenue
      FROM carts
    `;

    res.json({
      success: true,
      carts,
      stats: stats[0]
    });
  } catch (error) {
    next(error);
  }
});

// Usuários por tipo de assinatura
router.get('/admin/users-by-subscription', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        subscription_type,
        COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY subscription_type
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Top vendedores
router.get('/admin/top-sellers', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.subscription_type,
        COUNT(o.id) as total_sales,
        COALESCE(SUM(o.seller_receives), 0) as total_revenue
      FROM users u
      JOIN orders o ON u.id = o.seller_id
      WHERE o.status = 'delivered'
        AND o.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id
      ORDER BY total_sales DESC
      LIMIT 10
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Produtos mais visualizados
router.get('/admin/top-products', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        p.id,
        p.title,
        p.price,
        p.views,
        p.favorites,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
        u.name as seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.views DESC
      LIMIT 10
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Métricas de conversão
router.get('/admin/conversion-metrics', async (req, res, next) => {
  try {
    const [
      totalViews,
      uniqueVisitors,
      cartAdds,
      completedOrders
    ] = await Promise.all([
      sql`SELECT COALESCE(SUM(views), 0) as total FROM products`,
      sql`SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) as count FROM product_views WHERE created_at >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) as count FROM cart_items WHERE created_at >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'cancelled'`
    ]);

    const viewsCount = parseInt(totalViews[0].total);
    const visitorsCount = parseInt(uniqueVisitors[0].count) || 1;
    const cartCount = parseInt(cartAdds[0].count);
    const ordersCount = parseInt(completedOrders[0].count);

    res.json({
      success: true,
      data: {
        totalViews: viewsCount,
        uniqueVisitors: visitorsCount,
        cartAdditions: cartCount,
        completedOrders: ordersCount,
        viewToCartRate: ((cartCount / viewsCount) * 100).toFixed(2),
        cartToOrderRate: cartCount > 0 ? ((ordersCount / cartCount) * 100).toFixed(2) : 0,
        overallConversionRate: viewsCount > 0 ? ((ordersCount / viewsCount) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Visualizações de produtos por hora (para identificar horários de pico)
router.get('/admin/hourly-views', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as views
      FROM product_views
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Denúncias pendentes
router.get('/admin/pending-reports', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        r.*,
        u.name as reporter_name,
        u.email as reporter_email
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const count = await sql`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`;

    res.json({
      success: true,
      data,
      pendingCount: parseInt(count[0].count)
    });
  } catch (error) {
    next(error);
  }
});

// Produtos aguardando aprovação
router.get('/admin/pending-products', async (req, res, next) => {
  try {
    const data = await sql`
      SELECT
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Aprovar produto
router.post('/admin/products/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    await sql`UPDATE products SET status = 'active' WHERE id = ${id}`;

    res.json({ success: true, message: 'Produto aprovado' });
  } catch (error) {
    next(error);
  }
});

// Rejeitar produto
router.post('/admin/products/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await sql`UPDATE products SET status = 'rejected' WHERE id = ${id}`;

    // TODO: Enviar notificação ao vendedor

    res.json({ success: true, message: 'Produto rejeitado' });
  } catch (error) {
    next(error);
  }
});

// Listar todos usuários (admin)
router.get('/admin/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, subscription, status } = req.query;
    const offset = (page - 1) * limit;

    let query = sql`
      SELECT
        u.*,
        (SELECT COUNT(*) FROM products WHERE seller_id = u.id AND status = 'active') as products_count,
        (SELECT COUNT(*) FROM orders WHERE seller_id = u.id AND status = 'delivered') as sales_count
      FROM users u
      WHERE 1=1
    `;

    // TODO: Add filters

    const users = await sql`
      SELECT
        u.*,
        (SELECT COUNT(*) FROM products WHERE seller_id = u.id AND status = 'active') as products_count,
        (SELECT COUNT(*) FROM orders WHERE seller_id = u.id AND status = 'delivered') as sales_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    const total = await sql`SELECT COUNT(*) as count FROM users`;

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Bloquear/Desbloquear usuário
router.post('/admin/users/:id/toggle-status', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await sql`SELECT is_active FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuário não encontrado' });
    }

    const newStatus = !user[0].is_active;
    await sql`UPDATE users SET is_active = ${newStatus} WHERE id = ${id}`;

    res.json({
      success: true,
      message: newStatus ? 'Usuário ativado' : 'Usuário bloqueado',
      is_active: newStatus
    });
  } catch (error) {
    next(error);
  }
});

// Configurações do sistema
router.get('/admin/settings', async (req, res, next) => {
  try {
    const settings = await sql`SELECT * FROM settings`;

    // Transformar em objeto key-value
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    next(error);
  }
});

// Atualizar configuração
router.put('/admin/settings/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    await sql`
      UPDATE settings
      SET value = ${JSON.stringify(value)}, updated_at = NOW()
      WHERE key = ${key}
    `;

    res.json({ success: true, message: 'Configuração atualizada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
