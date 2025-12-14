const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

class AuthController {
  // Registrar novo usuário
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, phone, cpf, role } = req.body;

      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          error: true,
          message: 'E-mail já cadastrado'
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          cpf,
          role: role || 'CLIENTE'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      // Se for consignador, criar registro de consignador
      if (role === 'CONSIGNADOR') {
        await prisma.consignador.create({
          data: {
            userId: user.id,
            comissaoPercentual: parseFloat(process.env.DEFAULT_COMMISSION_RATE || 30),
            status: 'pendente' // Precisa ser aprovado pelo admin
          }
        });
      }

      // Gerar tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        user,
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao criar usuário'
      });
    }
  }

  // Login
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          consignador: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'E-mail ou senha inválidos'
        });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: true,
          message: 'E-mail ou senha inválidos'
        });
      }

      // Verificar se consignador está ativo
      if (user.role === 'CONSIGNADOR' && user.consignador?.status !== 'ativo') {
        return res.status(403).json({
          error: true,
          message: 'Conta de consignador pendente de aprovação'
        });
      }

      // Remover senha do objeto
      const { passwordHash, ...userWithoutPassword } = user;

      // Gerar tokens
      const token = this.generateToken(userWithoutPassword);
      const refreshToken = this.generateRefreshToken(userWithoutPassword);

      res.json({
        success: true,
        user: userWithoutPassword,
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao fazer login'
      });
    }
  }

  // Refresh Token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          error: true,
          message: 'Refresh token não fornecido'
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Usuário não encontrado'
        });
      }

      // Gerar novos tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(401).json({
        error: true,
        message: 'Refresh token inválido ou expirado'
      });
    }
  }

  // Esqueci minha senha
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Por segurança, não revelar se o e-mail existe
        return res.json({
          success: true,
          message: 'Se o e-mail existir, você receberá instruções para redefinir sua senha'
        });
      }

      // Gerar token de recuperação (válido por 1 hora)
      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // TODO: Enviar e-mail com link de recuperação
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      // await sendEmail(user.email, 'Recuperação de senha', resetLink);

      console.log('Reset token gerado:', resetToken);

      res.json({
        success: true,
        message: 'Se o e-mail existir, você receberá instruções para redefinir sua senha'
      });

    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao processar solicitação'
      });
    }
  }

  // Redefinir senha
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Hash da nova senha
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Atualizar senha
      await prisma.user.update({
        where: { id: decoded.id },
        data: { passwordHash }
      });

      res.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(400).json({
        error: true,
        message: 'Token inválido ou expirado'
      });
    }
  }

  // Helpers
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }
}

module.exports = new AuthController();
