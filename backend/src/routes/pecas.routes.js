const express = require('express');
const router = express.Router();
const pecasController = require('../controllers/pecas.controller');
const { authenticate, isConsignadorOrAdmin, isAdmin } = require('../middlewares/auth.middleware');
const { uploadMultiple, handleMulterError } = require('../middlewares/upload.middleware');

// Rotas públicas (marketplace)
router.get('/', pecasController.list); // Listar peças aprovadas
router.get('/:id', pecasController.getById); // Detalhes de uma peça
router.get('/categoria/:categoria', pecasController.listByCategoria);
router.get('/marca/:marca', pecasController.listByMarca);

// Rotas autenticadas
router.use(authenticate);

// Criar nova peça (consignador ou admin)
router.post(
  '/',
  isConsignadorOrAdmin,
  uploadMultiple,
  handleMulterError,
  pecasController.create
);

// Atualizar peça (apenas dono ou admin)
router.put('/:id', isConsignadorOrAdmin, pecasController.update);

// Deletar peça (apenas dono ou admin)
router.delete('/:id', isConsignadorOrAdmin, pecasController.delete);

// Listar minhas peças (consignador)
router.get('/minhas/pecas', isConsignadorOrAdmin, pecasController.listMyPecas);

// Rotas Admin
router.patch('/:id/aprovar', isAdmin, pecasController.aprovar);
router.patch('/:id/rejeitar', isAdmin, pecasController.rejeitar);
router.get('/admin/pendentes', isAdmin, pecasController.listPendentes);

module.exports = router;
