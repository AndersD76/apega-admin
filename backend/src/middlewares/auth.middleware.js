const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verificar se usuário está autenticado
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token não fornecido'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        consignador: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }

    // Adicionar usuário à requisição
    req.user = user;
    next();

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      error: true,
      message: 'Token inválido ou expirado'
    });
  }
};

// Verificar role específica
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: 'Acesso negado. Permissões insuficientes.'
      });
    }

    next();
  };
};

// Verificar se é admin
const isAdmin = authorize('ADMIN');

// Verificar se é consignador ou admin
const isConsignadorOrAdmin = authorize('CONSIGNADOR', 'ADMIN');

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isConsignadorOrAdmin
};
