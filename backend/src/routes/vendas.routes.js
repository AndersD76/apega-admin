const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// TODO: Implementar controllers de vendas

// Rotas autenticadas
router.use(authenticate);

// Criar nova venda (checkout)
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Listar minhas compras
router.get('/minhas-compras', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Detalhes de uma venda
router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Webhook do Mercado Pago
router.post('/webhook/mercadopago', (req, res) => {
  res.status(200).json({ message: 'Webhook recebido' });
});

// Admin: listar todas as vendas
router.get('/admin/all', isAdmin, (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

module.exports = router;
