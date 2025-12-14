const { body } = require('express-validator');

const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('E-mail inválido')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 3 })
    .withMessage('Nome deve ter no mínimo 3 caracteres'),

  body('phone')
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone inválido. Use o formato: (99) 99999-9999'),

  body('cpf')
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage('CPF inválido. Use o formato: 999.999.999-99'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'CONSIGNADOR', 'CLIENTE'])
    .withMessage('Role inválida')
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('E-mail inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

module.exports = {
  validateRegistration,
  validateLogin
};
