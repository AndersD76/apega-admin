const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas requerem admin
router.use(authenticate);
router.use(isAdmin);

// TODO: Implementar controllers admin

// Dashboard admin
router.get('/dashboard', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Aprovar/rejeitar consignadores
router.patch('/consignadores/:id/aprovar', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

router.patch('/consignadores/:id/rejeitar', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Gerenciar saques
router.get('/saques', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

router.patch('/saques/:id/aprovar', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

// Relatórios
router.get('/relatorios/vendas', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

router.get('/relatorios/comissoes', (req, res) => {
  res.status(501).json({ message: 'Em desenvolvimento' });
});

module.exports = router;
