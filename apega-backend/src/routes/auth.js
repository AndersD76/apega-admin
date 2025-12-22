const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Registrar novo usuário
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validações básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        error: true,
        message: 'Email, senha e nome são obrigatórios'
      });
    }

    // Verificar se email já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Este email já está cadastrado'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = await sql`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${phone || null})
      RETURNING id, email, name, phone, subscription_type, created_at
    `;

    // Gerar token
    const token = jwt.sign(
      { userId: newUser[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      user: newUser[0],
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const users = await sql`
      SELECT id, email, password_hash, name, phone, avatar_url, subscription_type, is_active
      FROM users
      WHERE email = ${email.toLowerCase()}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Email ou senha incorretos'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: true,
        message: 'Conta desativada'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: true,
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remover senha do retorno
    delete user.password_hash;

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Obter usuário atual
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const users = await sql`
      SELECT
        id, email, name, phone, avatar_url, bio, city, state,
        store_name, store_description, subscription_type, subscription_expires_at,
        rating, total_reviews, total_sales, total_followers, total_following,
        balance, cashback_balance, is_verified, created_at
      FROM users
      WHERE id = ${req.user.id}
    `;

    res.json({ success: true, user: users[0] });
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, phone, bio, city, state, store_name, store_description } = req.body;

    const updated = await sql`
      UPDATE users
      SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone),
        bio = COALESCE(${bio}, bio),
        city = COALESCE(${city}, city),
        state = COALESCE(${state}, state),
        store_name = COALESCE(${store_name}, store_name),
        store_description = COALESCE(${store_description}, store_description)
      WHERE id = ${req.user.id}
      RETURNING id, email, name, phone, avatar_url, bio, city, state, store_name, store_description
    `;

    res.json({ success: true, user: updated[0] });
  } catch (error) {
    next(error);
  }
});

// Alterar senha
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: true,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Buscar senha atual
    const users = await sql`
      SELECT password_hash FROM users WHERE id = ${req.user.id}
    `;

    const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!validPassword) {
      return res.status(400).json({
        error: true,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    const newHash = await bcrypt.hash(newPassword, 10);

    await sql`
      UPDATE users SET password_hash = ${newHash} WHERE id = ${req.user.id}
    `;

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN AUTH ====================

// Login Admin (usa credenciais fixas ou usuários com is_admin=true)
router.post('/admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Credenciais admin padrão (pode ser configurado via env)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@apegadesapega.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2024!';

    // Verificar credenciais admin fixas
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { userId: 'admin', isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 'admin',
          name: 'Administrador',
          email: ADMIN_EMAIL,
          is_admin: true
        }
      });
    }

    // Buscar usuário com is_admin
    const users = await sql`
      SELECT id, email, password_hash, name, is_admin, is_active
      FROM users
      WHERE email = ${email.toLowerCase()} AND is_admin = true
    `;

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas ou usuário não é admin'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token admin
    const token = jwt.sign(
      { userId: user.id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verificar autenticação admin
router.get('/admin-check', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.isAdmin) {
        return res.status(403).json({ success: false, message: 'Acesso não autorizado' });
      }

      // Se for admin fixo
      if (decoded.userId === 'admin') {
        return res.json({
          success: true,
          user: {
            id: 'admin',
            name: 'Administrador',
            email: process.env.ADMIN_EMAIL || 'admin@apegadesapega.com',
            is_admin: true
          }
        });
      }

      // Se for usuário admin do banco
      const users = await sql`
        SELECT id, email, name, is_admin FROM users WHERE id = ${decoded.userId} AND is_admin = true
      `;

      if (users.length === 0) {
        return res.status(403).json({ success: false, message: 'Usuário não é admin' });
      }

      res.json({
        success: true,
        user: {
          id: users[0].id,
          name: users[0].name,
          email: users[0].email,
          is_admin: true
        }
      });
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
