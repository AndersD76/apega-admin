const express = require('express');
const router = express.Router();
const { authenticate, isConsignadorOrAdmin } = require('../middlewares/auth.middleware');

// TODO: Implementar controllers de consignadores

// Rotas autenticadas
router.use(authenticate);
router.use(isConsignadorOrAdmin);

// Dashboard do consignador
router.get('/dashboard', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Saldo e extrato
router.get('/saldo', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Solicitar saque
router.post('/saques', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Listar saques
router.get('/saques', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Histórico de vendas
router.get('/vendas', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

module.exports = router;
