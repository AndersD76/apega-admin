const express = require('express');
const multer = require('multer');
const { sql } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

// Configuracao do multer para upload em memoria
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo nao permitido'), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Upload de imagem de perfil ou banner
router.post('/upload-image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'Nenhuma imagem enviada' });
    }

    const { type } = req.body; // 'avatar' ou 'banner'
    if (!type || !['avatar', 'banner'].includes(type)) {
      return res.status(400).json({ error: true, message: 'Tipo de imagem invalido. Use "avatar" ou "banner"' });
    }

    // Upload para Cloudinary
    const folder = type === 'avatar' ? 'avatars' : 'banners';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    // Atualizar no banco
    if (type === 'avatar') {
      await sql`UPDATE users SET avatar_url = ${result.secure_url} WHERE id = ${req.user.id}`;
    } else {
      await sql`UPDATE users SET banner_url = ${result.secure_url} WHERE id = ${req.user.id}`;
    }

    // Buscar usuario atualizado
    const updatedUser = await sql`
      SELECT id, name, email, avatar_url, banner_url FROM users WHERE id = ${req.user.id}
    `;

    res.json({
      success: true,
      message: 'Imagem atualizada com sucesso',
      url: result.secure_url,
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    next(error);
  }
});

// Obter dados do usuario logado
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const users = await sql`
      SELECT
        id, name, email, avatar_url, banner_url, bio, phone,
        city, state, store_name, store_description,
        subscription_type, subscription_expires_at,
        balance, cashback_balance, rating, total_reviews, total_sales,
        total_followers, total_following, is_verified, is_official,
        commission_rate, promo_type, is_admin,
        pix_key_type, pix_key, bank_code, bank_name, bank_agency, bank_account, bank_account_type, cpf,
        created_at
      FROM users
      WHERE id = ${req.user.id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuario nao encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil do usuario logado
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const {
      name, bio, phone, city, state, store_name, store_description, instagram,
      pix_key_type, pix_key, bank_code, bank_name, bank_agency, bank_account, bank_account_type, cpf
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: true, message: 'Nome e obrigatorio' });
    }

    const updatedUser = await sql`
      UPDATE users
      SET
        name = ${name.trim()},
        bio = ${bio || null},
        phone = ${phone || null},
        city = ${city || null},
        state = ${state || null},
        store_name = ${store_name || null},
        store_description = ${store_description || null},
        instagram = ${instagram || null},
        pix_key_type = ${pix_key_type || null},
        pix_key = ${pix_key || null},
        bank_code = ${bank_code || null},
        bank_name = ${bank_name || null},
        bank_agency = ${bank_agency || null},
        bank_account = ${bank_account || null},
        bank_account_type = ${bank_account_type || null},
        cpf = ${cpf || null},
        updated_at = NOW()
      WHERE id = ${req.user.id}
      RETURNING id, name, email, avatar_url, banner_url, bio, phone, city, state, store_name, store_description, instagram,
        pix_key_type, pix_key, bank_code, bank_name, bank_agency, bank_account, bank_account_type, cpf,
        subscription_type, rating, total_reviews, total_sales, total_followers, total_following, is_verified, created_at
    `;

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuario nao encontrado' });
    }

    res.json({ success: true, message: 'Perfil atualizado com sucesso', user: updatedUser[0] });
  } catch (error) {
    next(error);
  }
});

// Obter perfil público de um usuário
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const users = await sql`
      SELECT
        id, name, avatar_url, bio, city, state,
        store_name, store_description, subscription_type,
        rating, total_reviews, total_sales, total_followers, total_following,
        is_verified, created_at
      FROM users
      WHERE id = ${id} AND is_active = true
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuário não encontrado' });
    }

    const user = users[0];

    // Verificar se está seguindo (se logado)
    if (req.user) {
      const following = await sql`
        SELECT id FROM followers WHERE follower_id = ${req.user.id} AND following_id = ${id}
      `;
      user.is_following = following.length > 0;
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Listar produtos de um usuário
router.get('/:id/products', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'active' } = req.query;

    const products = await sql`
      SELECT
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
      FROM products p
      WHERE p.seller_id = ${id} AND p.status = ${status}
      ORDER BY p.created_at DESC
    `;

    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

// Seguir usuário
router.post('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: true, message: 'Você não pode seguir a si mesmo' });
    }

    // Verificar se já segue
    const existing = await sql`
      SELECT id FROM followers WHERE follower_id = ${req.user.id} AND following_id = ${id}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: true, message: 'Você já segue este usuário' });
    }

    await sql`
      INSERT INTO followers (follower_id, following_id)
      VALUES (${req.user.id}, ${id})
    `;

    // Atualizar contadores
    await sql`UPDATE users SET total_followers = total_followers + 1 WHERE id = ${id}`;
    await sql`UPDATE users SET total_following = total_following + 1 WHERE id = ${req.user.id}`;

    // Notificar
    await sql`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (${id}, 'follow', 'Novo seguidor', ${`${req.user.name} começou a seguir você`}, ${JSON.stringify({ user_id: req.user.id })})
    `;

    res.json({ success: true, message: 'Seguindo com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Deixar de seguir
router.delete('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await sql`
      DELETE FROM followers WHERE follower_id = ${req.user.id} AND following_id = ${id}
      RETURNING id
    `;

    if (deleted.length > 0) {
      await sql`UPDATE users SET total_followers = GREATEST(total_followers - 1, 0) WHERE id = ${id}`;
      await sql`UPDATE users SET total_following = GREATEST(total_following - 1, 0) WHERE id = ${req.user.id}`;
    }

    res.json({ success: true, message: 'Deixou de seguir' });
  } catch (error) {
    next(error);
  }
});

// Listar seguidores
router.get('/:id/followers', async (req, res, next) => {
  try {
    const { id } = req.params;

    const followers = await sql`
      SELECT
        u.id, u.name, u.avatar_url, u.store_name
      FROM followers f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ${id}
      ORDER BY f.created_at DESC
    `;

    res.json({ success: true, followers });
  } catch (error) {
    next(error);
  }
});

// Listar quem o usuário segue
router.get('/:id/following', async (req, res, next) => {
  try {
    const { id } = req.params;

    const following = await sql`
      SELECT
        u.id, u.name, u.avatar_url, u.store_name
      FROM followers f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ${id}
      ORDER BY f.created_at DESC
    `;

    res.json({ success: true, following });
  } catch (error) {
    next(error);
  }
});

// Saldo e transações
router.get('/my/balance', authenticate, async (req, res, next) => {
  try {
    const userData = await sql`
      SELECT balance, cashback_balance FROM users WHERE id = ${req.user.id}
    `;

    // Transações recentes
    const transactions = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Saldo pendente (vendas não completadas)
    const pending = await sql`
      SELECT COALESCE(SUM(seller_receives), 0) as total
      FROM orders
      WHERE seller_id = ${req.user.id}
        AND status IN ('pending_shipment', 'shipped', 'in_transit', 'delivered')
    `;

    res.json({
      success: true,
      balance: parseFloat(userData[0].balance),
      cashback: parseFloat(userData[0].cashback_balance),
      pending: parseFloat(pending[0].total),
      transactions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
