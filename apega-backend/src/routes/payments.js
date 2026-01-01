const express = require('express');
const { sql } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Listar métodos de pagamento
router.get('/', authenticate, async (req, res, next) => {
  try {
    const payments = await sql`
      SELECT * FROM payment_methods
      WHERE user_id = ${req.user.id}
      ORDER BY is_default DESC, created_at DESC
    `;

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

// Adicionar método de pagamento
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      type,
      card_brand,
      card_last_four,
      card_holder_name,
      card_expiry,
      pix_key,
      pix_key_type,
      is_default
    } = req.body;

    if (!type) {
      return res.status(400).json({ error: true, message: 'Tipo é obrigatório' });
    }

    // Se for padrão, remover padrão dos outros
    if (is_default) {
      await sql`UPDATE payment_methods SET is_default = false WHERE user_id = ${req.user.id}`;
    }

    // Se for o primeiro, definir como padrão
    const existingCount = await sql`SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ${req.user.id}`;
    const shouldBeDefault = is_default || parseInt(existingCount[0].count) === 0;

    const newPayment = await sql`
      INSERT INTO payment_methods (
        user_id, type, card_brand, card_last_four, card_holder_name,
        card_expiry, pix_key, pix_key_type, is_default
      )
      VALUES (
        ${req.user.id}, ${type}, ${card_brand || null}, ${card_last_four || null},
        ${card_holder_name || null}, ${card_expiry || null}, ${pix_key || null},
        ${pix_key_type || null}, ${shouldBeDefault}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, payment: newPayment[0] });
  } catch (error) {
    next(error);
  }
});

// Deletar método de pagamento
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await sql`
      DELETE FROM payment_methods
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING is_default
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: true, message: 'Método não encontrado' });
    }

    // Se era padrão, definir outro
    if (deleted[0].is_default) {
      await sql`
        UPDATE payment_methods SET is_default = true
        WHERE user_id = ${req.user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    res.json({ success: true, message: 'Método removido' });
  } catch (error) {
    next(error);
  }
});

// Definir como padrão
router.patch('/:id/default', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await sql`UPDATE payment_methods SET is_default = false WHERE user_id = ${req.user.id}`;

    const updated = await sql`
      UPDATE payment_methods SET is_default = true
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: true, message: 'Método não encontrado' });
    }

    res.json({ success: true, payment: updated[0] });
  } catch (error) {
    next(error);
  }
});

// Buscar saldo e transações do usuário logado
router.get('/my-wallet', authenticate, async (req, res, next) => {
  try {
    // Buscar saldo do usuário
    const userResult = await sql`SELECT balance FROM users WHERE id = ${req.user.id}`;
    const balance = parseFloat(userResult[0]?.balance || 0);

    // Buscar transações do usuário
    const transactions = await sql`
      SELECT
        t.*,
        o.order_number
      FROM transactions t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.user_id = ${req.user.id}
      ORDER BY t.created_at DESC
      LIMIT 50
    `;

    // Buscar saldo pendente (vendas ainda não liberadas)
    const pendingResult = await sql`
      SELECT COALESCE(SUM(seller_receives), 0) as pending
      FROM orders
      WHERE seller_id = ${req.user.id}
        AND status = 'delivered'
        AND delivered_at > NOW() - INTERVAL '7 days'
    `;
    const pendingBalance = parseFloat(pendingResult[0]?.pending || 0);

    res.json({
      success: true,
      balance,
      pending_balance: pendingBalance,
      transactions
    });
  } catch (error) {
    next(error);
  }
});

// Solicitar saque
router.post('/withdraw', authenticate, async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Buscar saldo do usuário
    const userResult = await sql`SELECT balance, pix_key, pix_key_type, bank_code, bank_agency, bank_account FROM users WHERE id = ${req.user.id}`;
    const user = userResult[0];
    const balance = parseFloat(user?.balance || 0);

    // Validações
    if (!amount || amount < 20) {
      return res.status(400).json({ error: true, message: 'Valor mínimo para saque é R$ 20,00' });
    }

    if (amount > balance) {
      return res.status(400).json({ error: true, message: 'Saldo insuficiente' });
    }

    // Verificar se tem dados bancários
    if (!user.pix_key && !user.bank_account) {
      return res.status(400).json({ error: true, message: 'Configure seus dados bancários antes de solicitar saque' });
    }

    // Criar transação de saque pendente
    const transaction = await sql`
      INSERT INTO transactions (user_id, type, amount, status, description)
      VALUES (${req.user.id}, 'withdrawal', ${amount}, 'pending', 'Solicitação de saque')
      RETURNING *
    `;

    // Debitar do saldo do usuário
    await sql`
      UPDATE users SET balance = balance - ${amount}
      WHERE id = ${req.user.id}
    `;

    res.json({
      success: true,
      message: 'Solicitação de saque enviada! Você receberá em até 3 dias úteis.',
      transaction: transaction[0]
    });
  } catch (error) {
    next(error);
  }
});

// Listar transacoes (admin)
router.get('/transactions', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    let transactions;
    let total;
    if (type && status) {
      transactions = await sql`
        SELECT
          t.*,
          u.name as user_name,
          u.email as user_email,
          o.order_number as order_number
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE t.type = ${type} AND t.status = ${status}
        ORDER BY t.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*) as count
        FROM transactions t
        WHERE t.type = ${type} AND t.status = ${status}
      `;
    } else if (type) {
      transactions = await sql`
        SELECT
          t.*,
          u.name as user_name,
          u.email as user_email,
          o.order_number as order_number
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE t.type = ${type}
        ORDER BY t.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*) as count
        FROM transactions t
        WHERE t.type = ${type}
      `;
    } else if (status) {
      transactions = await sql`
        SELECT
          t.*,
          u.name as user_name,
          u.email as user_email,
          o.order_number as order_number
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE t.status = ${status}
        ORDER BY t.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*) as count
        FROM transactions t
        WHERE t.status = ${status}
      `;
    } else {
      transactions = await sql`
        SELECT
          t.*,
          u.name as user_name,
          u.email as user_email,
          o.order_number as order_number
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN orders o ON t.order_id = o.id
        ORDER BY t.created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*) as count
        FROM transactions t
      `;
    }

    res.json({
      success: true,
      transactions,
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

// Processar saque (admin)
router.post('/withdrawals/:transactionId/:action', requireAdmin, async (req, res, next) => {
  try {
    const { transactionId, action } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: true, message: 'Acao invalida' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const updated = await sql`
      UPDATE transactions
      SET status = ${status}
      WHERE id = ${transactionId} AND type = 'withdrawal'
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: true, message: 'Transacao nao encontrada' });
    }

    res.json({ success: true, transaction: updated[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
