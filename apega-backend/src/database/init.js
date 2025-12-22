require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function initDatabase() {
  console.log('🔄 Conectando ao Neon PostgreSQL...');

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Criar extensão UUID
    console.log('📝 Criando extensão UUID...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Criar tabelas uma por uma
    console.log('📝 Criando tabela users...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url TEXT,
        bio TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        store_name VARCHAR(255),
        store_description TEXT,
        subscription_type VARCHAR(20) DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
        rating DECIMAL(2,1) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_sales INTEGER DEFAULT 0,
        total_followers INTEGER DEFAULT 0,
        total_following INTEGER DEFAULT 0,
        balance DECIMAL(10,2) DEFAULT 0,
        cashback_balance DECIMAL(10,2) DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela categories...');
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(50),
        parent_id UUID REFERENCES categories(id),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela products...');
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        brand VARCHAR(100),
        size VARCHAR(20),
        color VARCHAR(50),
        condition VARCHAR(20) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'active',
        is_premium BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        views INTEGER DEFAULT 0,
        favorites INTEGER DEFAULT 0,
        city VARCHAR(100),
        state VARCHAR(2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela product_images...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela favorites...');
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `;

    console.log('📝 Criando tabela cart_items...');
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `;

    console.log('📝 Criando tabela addresses...');
    await sql`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(50),
        recipient_name VARCHAR(255) NOT NULL,
        street VARCHAR(255) NOT NULL,
        number VARCHAR(20) NOT NULL,
        complement VARCHAR(100),
        neighborhood VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zipcode VARCHAR(10) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela orders...');
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        buyer_id UUID NOT NULL REFERENCES users(id),
        seller_id UUID NOT NULL REFERENCES users(id),
        product_id UUID NOT NULL REFERENCES products(id),
        product_price DECIMAL(10,2) NOT NULL,
        shipping_price DECIMAL(10,2) DEFAULT 0,
        commission_rate DECIMAL(4,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        seller_receives DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending_payment',
        payment_method VARCHAR(30),
        payment_id VARCHAR(255),
        paid_at TIMESTAMP,
        shipping_code VARCHAR(50),
        shipping_carrier VARCHAR(50),
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        shipping_address_id UUID,
        cancelled_at TIMESTAMP,
        cancel_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela payment_methods...');
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        card_brand VARCHAR(20),
        card_last_four VARCHAR(4),
        card_holder_name VARCHAR(255),
        card_expiry VARCHAR(7),
        pix_key VARCHAR(255),
        pix_key_type VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela transactions...');
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        order_id UUID REFERENCES orders(id),
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela reviews...');
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id),
        reviewer_id UUID NOT NULL REFERENCES users(id),
        reviewed_user_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela conversations...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user1_id UUID NOT NULL REFERENCES users(id),
        user2_id UUID NOT NULL REFERENCES users(id),
        product_id UUID REFERENCES products(id),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela messages...');
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela notifications...');
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela followers...');
    await sql`
      CREATE TABLE IF NOT EXISTS followers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `;

    console.log('📝 Criando tabela subscriptions...');
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        plan VARCHAR(20) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        starts_at TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        cancelled_at TIMESTAMP,
        payment_method_id UUID REFERENCES payment_methods(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela reports...');
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID NOT NULL REFERENCES users(id),
        reported_user_id UUID REFERENCES users(id),
        product_id UUID REFERENCES products(id),
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        resolution_notes TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela carts...');
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'active',
        total_value DECIMAL(10,2) DEFAULT 0,
        items_count INTEGER DEFAULT 0,
        last_activity_at TIMESTAMP,
        abandoned_at TIMESTAMP,
        recovered_at TIMESTAMP,
        converted_order_id UUID REFERENCES orders(id),
        reminder_sent_at TIMESTAMP,
        reminder_count INTEGER DEFAULT 0,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela product_views...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        session_id VARCHAR(100),
        device_type VARCHAR(50),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela analytics_events...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        session_id VARCHAR(100),
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('📝 Criando tabela settings...');
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        updated_by UUID REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Inserir categorias padrão
    console.log('📝 Inserindo categorias...');
    const categories = [
      { name: 'Todas', slug: 'all', icon: 'apps', sort: 0 },
      { name: 'Vestidos', slug: 'vestidos', icon: 'woman', sort: 1 },
      { name: 'Blusas', slug: 'blusas', icon: 'shirt', sort: 2 },
      { name: 'Calças', slug: 'calcas', icon: 'pants', sort: 3 },
      { name: 'Saias', slug: 'saias', icon: 'skirt', sort: 4 },
      { name: 'Shorts', slug: 'shorts', icon: 'shorts', sort: 5 },
      { name: 'Conjuntos', slug: 'conjuntos', icon: 'set', sort: 6 },
      { name: 'Acessórios', slug: 'acessorios', icon: 'watch', sort: 7 },
      { name: 'Calçados', slug: 'calcados', icon: 'shoe', sort: 8 },
      { name: 'Bolsas', slug: 'bolsas', icon: 'bag', sort: 9 },
      { name: 'Premium', slug: 'premium', icon: 'star', sort: 10 },
    ];

    for (const cat of categories) {
      try {
        await sql`
          INSERT INTO categories (name, slug, icon, sort_order)
          VALUES (${cat.name}, ${cat.slug}, ${cat.icon}, ${cat.sort})
          ON CONFLICT (slug) DO NOTHING
        `;
      } catch (e) {
        // Ignorar se já existe
      }
    }

    // Verificar tabelas
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n✅ Banco de dados inicializado com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    tables.forEach(t => console.log(`   ✓ ${t.table_name}`));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

initDatabase();
