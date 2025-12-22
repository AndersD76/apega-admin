require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  console.log('🔄 Conectando ao banco de dados...');
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Adicionar coluna is_admin na tabela users
    console.log('📝 Verificando coluna is_admin...');
    const checkIsAdmin = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `;

    if (checkIsAdmin.length === 0) {
      console.log('📝 Adicionando coluna is_admin à tabela users...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`;
    } else {
      console.log('✅ Coluna is_admin já existe');
    }

    // 2. Adicionar coluna last_login_at na tabela users
    console.log('📝 Verificando coluna last_login_at...');
    const checkLastLogin = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_login_at'
    `;

    if (checkLastLogin.length === 0) {
      console.log('📝 Adicionando coluna last_login_at à tabela users...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
    } else {
      console.log('✅ Coluna last_login_at já existe');
    }

    // 3. Adicionar coluna deleted_at na tabela users
    console.log('📝 Verificando coluna deleted_at...');
    const checkDeletedAt = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'deleted_at'
    `;

    if (checkDeletedAt.length === 0) {
      console.log('📝 Adicionando coluna deleted_at à tabela users...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`;
    } else {
      console.log('✅ Coluna deleted_at já existe');
    }

    // 4. Criar tabela carts se não existir
    console.log('📝 Verificando tabela carts...');
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
        converted_order_id UUID,
        reminder_sent_at TIMESTAMP,
        reminder_count INTEGER DEFAULT 0,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela carts verificada');

    // 5. Criar tabela product_views se não existir
    console.log('📝 Verificando tabela product_views...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL,
        user_id UUID,
        session_id VARCHAR(100),
        device_type VARCHAR(50),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela product_views verificada');

    // 6. Criar tabela analytics_events se não existir
    console.log('📝 Verificando tabela analytics_events...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        session_id VARCHAR(100),
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela analytics_events verificada');

    // 7. Criar tabela settings se não existir
    console.log('📝 Verificando tabela settings...');
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        updated_by UUID,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela settings verificada');

    // 8. Criar tabela reports se não existir
    console.log('📝 Verificando tabela reports...');
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID NOT NULL,
        reported_user_id UUID,
        product_id UUID,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        resolution_notes TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela reports verificada');

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  }
}

migrate();
