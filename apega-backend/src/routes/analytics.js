const express = require('express');
const { sql } = require('../config/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

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
router.use('/admin', requireAdmin);

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

    let data;
    if (period === '7days') {
      data = await sql`
        SELECT
          DATE_TRUNC('day', created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND status != 'cancelled'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `;
    } else if (period === '30days') {
      data = await sql`
        SELECT
          DATE_TRUNC('day', created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status != 'cancelled'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `;
    } else {
      data = await sql`
        SELECT
          DATE_TRUNC('month', created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(commission_amount), 0) as commission,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND status != 'cancelled'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY date
      `;
    }

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

    let carts;
    if (status !== 'all') {
      carts = await sql`
        SELECT
          c.*,
          u.name as user_name,
          u.email as user_email
        FROM carts c
        JOIN users u ON c.user_id = u.id
        WHERE c.status = ${status}
        ORDER BY c.last_activity_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
    } else {
      carts = await sql`
        SELECT
          c.*,
          u.name as user_name,
          u.email as user_email
        FROM carts c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.last_activity_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
    }

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
      sql`SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) as count FROM product_views WHERE created_at >= NOW() - INTERVAL '30 days'`,
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

// Notificacoes (admin)
router.get('/admin/notifications', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let notifications;
    if (type) {
      notifications = await sql`
        SELECT
          n.*,
          u.name as user_name,
          u.email as user_email
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.type = ${type}
        ORDER BY n.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
    } else {
      notifications = await sql`
        SELECT
          n.*,
          u.name as user_name,
          u.email as user_email
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
    }

    const stats = await (type ? sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread
      FROM notifications n
      WHERE n.type = ${type}
    ` : sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread
      FROM notifications n
    `);

    const total = await (type
      ? sql`SELECT COUNT(*) as count FROM notifications n WHERE n.type = ${type}`
      : sql`SELECT COUNT(*) as count FROM notifications n`);

    res.json({
      success: true,
      notifications,
      stats: {
        total: parseInt(stats[0].total),
        unread: parseInt(stats[0].unread)
      },
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
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

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

// Excluir usuário (soft delete - desativa e anonimiza)
router.delete('/admin/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await sql`SELECT id, email FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuário não encontrado' });
    }

    // Soft delete: desativa e anonimiza dados
    await sql`
      UPDATE users SET
        is_active = false,
        email = CONCAT('deleted_', ${id}, '@deleted.com'),
        name = 'Usuário Removido',
        phone = null,
        avatar_url = null,
        bio = null,
        deleted_at = NOW()
      WHERE id = ${id}
    `;

    // Remover produtos do usuário
    await sql`UPDATE products SET status = 'deleted' WHERE seller_id = ${id}`;

    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Listar todos os produtos (admin)
router.get('/admin/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await sql`
      SELECT
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status != 'deleted'
      ORDER BY p.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    const total = await sql`
      SELECT COUNT(*) as count FROM products p
      WHERE p.status != 'deleted'
    `;

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        COUNT(*) as total
      FROM products
      WHERE status != 'deleted'
    `;

    res.json({
      success: true,
      products,
      stats: stats[0],
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

// Obter detalhes de um produto (admin)
router.get('/admin/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const products = await sql`
      SELECT
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        u.avatar_url as seller_avatar,
        c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `;

    if (products.length === 0) {
      return res.status(404).json({ error: true, message: 'Produto não encontrado' });
    }

    const images = await sql`
      SELECT image_url, is_primary FROM product_images
      WHERE product_id = ${id}
      ORDER BY sort_order
    `;

    res.json({
      success: true,
      product: {
        ...products[0],
        images: images.map(i => i.image_url)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Excluir produto (admin)
router.delete('/admin/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await sql`UPDATE products SET status = 'deleted' WHERE id = ${id}`;

    res.json({ success: true, message: 'Produto excluído' });
  } catch (error) {
    next(error);
  }
});

// Listar todos os pedidos (admin)
router.get('/admin/orders', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const hasStatusFilter = status && status !== 'all';
    const orders = hasStatusFilter ? await sql`
      SELECT
        o.*,
        p.title as product_title,
        p.brand as product_brand,
        p.size as product_size,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_image,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        seller.name as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.status = ${status}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    ` : await sql`
      SELECT
        o.*,
        p.title as product_title,
        p.brand as product_brand,
        p.size as product_size,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_image,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        seller.name as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    const total = hasStatusFilter
      ? await sql`SELECT COUNT(*) as count FROM orders o WHERE o.status = ${status}`
      : await sql`SELECT COUNT(*) as count FROM orders o`;

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending_payment') as pending,
        COUNT(*) FILTER (WHERE status IN ('pending_shipment', 'paid')) as paid,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
        COALESCE(SUM(commission_amount) FILTER (WHERE status != 'cancelled'), 0) as total_commission
      FROM orders
    `;

    res.json({
      success: true,
      orders,
      stats: stats[0],
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

// Obter detalhes de um pedido (admin)
router.get('/admin/orders/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const orders = await sql`
      SELECT
        o.*,
        p.title as product_title,
        p.brand as product_brand,
        p.size as product_size,
        p.description as product_description,
        p.condition as product_condition,
        seller.name as seller_name,
        seller.email as seller_email,
        seller.phone as seller_phone,
        seller.avatar_url as seller_avatar,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        buyer.phone as buyer_phone,
        buyer.avatar_url as buyer_avatar,
        a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a.zipcode, a.recipient_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users seller ON o.seller_id = seller.id
      JOIN users buyer ON o.buyer_id = buyer.id
      LEFT JOIN addresses a ON o.shipping_address_id = a.id
      WHERE o.id = ${id}
    `;

    if (orders.length === 0) {
      return res.status(404).json({ error: true, message: 'Pedido não encontrado' });
    }

    const images = await sql`
      SELECT image_url FROM product_images WHERE product_id = ${orders[0].product_id} ORDER BY sort_order
    `;

    res.json({
      success: true,
      order: {
        ...orders[0],
        product_images: images.map(i => i.image_url)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar status do pedido (admin)
router.put('/admin/orders/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: true, message: 'Status inválido' });
    }

    await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;

    res.json({ success: true, message: 'Status atualizado' });
  } catch (error) {
    next(error);
  }
});

// Listar denúncias
router.get('/admin/reports', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;

    const hasStatusFilter = status !== 'all';
    const reports = hasStatusFilter ? await sql`
      SELECT
        r.*,
        reporter.name as reporter_name,
        reporter.email as reporter_email,
        reported.name as reported_name,
        reported.email as reported_email,
        p.title as product_title
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    ` : await sql`
      SELECT
        r.*,
        reporter.name as reporter_name,
        reporter.email as reporter_email,
        reported.name as reported_name,
        reported.email as reported_email,
        p.title as product_title
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    const total = hasStatusFilter
      ? await sql`SELECT COUNT(*) as count FROM reports r WHERE r.status = ${status}`
      : await sql`SELECT COUNT(*) as count FROM reports r`;

    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed
      FROM reports
    `;

    res.json({
      success: true,
      reports,
      stats: stats[0],
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

// Resolver denúncia
router.put('/admin/reports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    await sql`
      UPDATE reports
      SET status = ${status}, resolution_notes = ${resolution_notes}, resolved_at = NOW()
      WHERE id = ${id}
    `;

    res.json({ success: true, message: 'Denúncia atualizada' });
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
