const express = require('express');
const multer = require('multer');
const { sql } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

// Configuração do multer para upload em memória (para Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Listar produtos (com filtros)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      condition,
      size,
      brand,
      city,
      sort = 'recent',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    let query = sql`
      SELECT
        p.*,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        u.rating as seller_rating,
        u.city as seller_city,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
        ${req.user ? sql`EXISTS(SELECT 1 FROM favorites WHERE user_id = ${req.user.id} AND product_id = p.id)` : sql`false`} as is_favorited
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;

    // Filtros dinâmicos
    const conditions = [];

    if (category && category !== 'all') {
      conditions.push(sql`c.slug = ${category}`);
    }

    if (search) {
      conditions.push(sql`(p.title ILIKE ${'%' + search + '%'} OR p.brand ILIKE ${'%' + search + '%'})`);
    }

    if (minPrice) {
      conditions.push(sql`p.price >= ${parseFloat(minPrice)}`);
    }

    if (maxPrice) {
      conditions.push(sql`p.price <= ${parseFloat(maxPrice)}`);
    }

    if (condition) {
      conditions.push(sql`p.condition = ${condition}`);
    }

    if (size) {
      conditions.push(sql`p.size = ${size}`);
    }

    if (brand) {
      conditions.push(sql`p.brand ILIKE ${'%' + brand + '%'}`);
    }

    if (city) {
      conditions.push(sql`p.city ILIKE ${'%' + city + '%'}`);
    }

    // Ordenação
    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = sql`p.price ASC`;
        break;
      case 'price_desc':
        orderBy = sql`p.price DESC`;
        break;
      case 'popular':
        orderBy = sql`p.views DESC`;
        break;
      default:
        orderBy = sql`p.created_at DESC`;
    }

    const products = await sql`
      SELECT
        p.*,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        u.rating as seller_rating,
        u.city as seller_city,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
        ${req.user ? sql`EXISTS(SELECT 1 FROM favorites WHERE user_id = ${req.user.id} AND product_id = p.id)` : sql`false`} as is_favorited
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `;

    // Contar total
    const countResult = await sql`
      SELECT COUNT(*) as total FROM products WHERE status = 'active'
    `;

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult[0].total),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Meus produtos (deve vir antes de /:id)
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;

    let products;

    if (status) {
      products = await sql`
        SELECT p.*,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
        FROM products p
        WHERE p.seller_id = ${req.user.id} AND p.status = ${status}
        ORDER BY p.created_at DESC
      `;
    } else {
      products = await sql`
        SELECT p.*,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
        FROM products p
        WHERE p.seller_id = ${req.user.id} AND p.status != 'deleted'
        ORDER BY p.created_at DESC
      `;
    }

    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

// Upload único de imagem (deve vir antes de /:id)
router.post('/upload', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'Nenhuma imagem enviada' });
    }

    // Upload para Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'products');

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    next(error);
  }
});

// Obter produto por ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Incrementar visualizações
    await sql`UPDATE products SET views = views + 1 WHERE id = ${id}`;

    const products = await sql`
      SELECT
        p.*,
        u.id as seller_id,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        u.rating as seller_rating,
        u.total_reviews as seller_reviews,
        u.total_sales as seller_sales,
        u.city as seller_city,
        u.store_name,
        c.name as category_name,
        ${req.user ? sql`EXISTS(SELECT 1 FROM favorites WHERE user_id = ${req.user.id} AND product_id = p.id)` : sql`false`} as is_favorited
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `;

    if (products.length === 0) {
      return res.status(404).json({ error: true, message: 'Produto não encontrado' });
    }

    // Buscar todas as imagens
    const images = await sql`
      SELECT * FROM product_images WHERE product_id = ${id} ORDER BY sort_order
    `;

    const product = {
      ...products[0],
      images
    };

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

// Criar produto
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      title,
      description,
      brand,
      size,
      color,
      condition,
      price,
      original_price,
      category_id,
      is_premium
    } = req.body;

    // Validações
    if (!title || !condition || !price) {
      return res.status(400).json({
        error: true,
        message: 'Título, condição e preço são obrigatórios'
      });
    }

    // Verificar limite de produtos para usuário free
    if (req.user.subscription_type === 'free') {
      const count = await sql`
        SELECT COUNT(*) as total FROM products
        WHERE seller_id = ${req.user.id} AND status = 'active'
      `;

      if (parseInt(count[0].total) >= 5) {
        return res.status(403).json({
          error: true,
          message: 'Limite de 5 produtos atingido. Assine o Premium para anúncios ilimitados.'
        });
      }
    }

    // Buscar cidade do usuário
    const userData = await sql`SELECT city, state FROM users WHERE id = ${req.user.id}`;

    const newProduct = await sql`
      INSERT INTO products (
        seller_id, category_id, title, description, brand, size, color,
        condition, price, original_price, is_premium, city, state
      )
      VALUES (
        ${req.user.id},
        ${category_id || null},
        ${title},
        ${description || null},
        ${brand || null},
        ${size || null},
        ${color || null},
        ${condition},
        ${parseFloat(price)},
        ${original_price ? parseFloat(original_price) : null},
        ${is_premium || false},
        ${userData[0]?.city || null},
        ${userData[0]?.state || null}
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      product: newProduct[0]
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar produto
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      brand,
      size,
      color,
      condition,
      price,
      original_price,
      category_id,
      status
    } = req.body;

    // Verificar se o produto pertence ao usuário
    const existing = await sql`
      SELECT seller_id FROM products WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: true, message: 'Produto não encontrado' });
    }

    if (existing[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Sem permissão para editar este produto' });
    }

    const updated = await sql`
      UPDATE products
      SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        brand = COALESCE(${brand}, brand),
        size = COALESCE(${size}, size),
        color = COALESCE(${color}, color),
        condition = COALESCE(${condition}, condition),
        price = COALESCE(${price ? parseFloat(price) : null}, price),
        original_price = COALESCE(${original_price ? parseFloat(original_price) : null}, original_price),
        category_id = COALESCE(${category_id}, category_id),
        status = COALESCE(${status}, status)
      WHERE id = ${id}
      RETURNING *
    `;

    res.json({ success: true, product: updated[0] });
  } catch (error) {
    next(error);
  }
});

// Deletar produto
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await sql`
      SELECT seller_id FROM products WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: true, message: 'Produto não encontrado' });
    }

    if (existing[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Sem permissão' });
    }

    await sql`UPDATE products SET status = 'deleted' WHERE id = ${id}`;

    res.json({ success: true, message: 'Produto removido' });
  } catch (error) {
    next(error);
  }
});

// Upload de imagens do produto
router.post('/:id/images', authenticate, upload.array('images', 10), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se o produto pertence ao usuário
    const existing = await sql`
      SELECT seller_id FROM products WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: true, message: 'Produto não encontrado' });
    }

    if (existing[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Sem permissão' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: true, message: 'Nenhuma imagem enviada' });
    }

    // Verificar quantas imagens já existem
    const existingImages = await sql`
      SELECT COUNT(*) as count FROM product_images WHERE product_id = ${id}
    `;
    const existingCount = parseInt(existingImages[0].count);

    // Upload para Cloudinary e inserir no banco
    const uploadedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload para Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file.buffer, 'products');
      const imageUrl = cloudinaryResult.secure_url;
      const isPrimary = existingCount === 0 && i === 0;

      const result = await sql`
        INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
        VALUES (${id}, ${imageUrl}, ${existingCount + i}, ${isPrimary})
        RETURNING *
      `;
      uploadedImages.push(result[0]);
    }

    res.json({
      success: true,
      message: `${uploadedImages.length} imagem(s) enviada(s) com sucesso`,
      images: uploadedImages
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
