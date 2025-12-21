require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addAnalyticsTables() {
  console.log('🔄 Conectando ao Neon PostgreSQL...');

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Tabela de eventos de analytics genéricos
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

    // Índices para analytics_events
    console.log('📝 Criando índices para analytics_events...');
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at)`;

    // Adicionar coluna last_login_at na tabela users se não existir
    console.log('📝 Adicionando coluna last_login_at em users...');
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
    } catch (e) {
      console.log('   Coluna já existe ou erro:', e.message);
    }

    // Verificar se tabela product_views existe, se não criar
    console.log('📝 Verificando/criando tabela product_views...');
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

    // Índices para product_views
    console.log('📝 Criando índices para product_views...');
    await sql`CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(created_at)`;

    // Verificar se tabela carts existe, se não criar
    console.log('📝 Verificando/criando tabela carts...');
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'active',
        total_value DECIMAL(10,2) DEFAULT 0,
        items_count INTEGER DEFAULT 0,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        abandoned_at TIMESTAMP,
        recovered_at TIMESTAMP,
        converted_order_id UUID REFERENCES orders(id),
        reminder_sent_at TIMESTAMP,
        reminder_count INTEGER DEFAULT 0,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Índices para carts
    console.log('📝 Criando índices para carts...');
    await sql`CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_carts_last_activity ON carts(last_activity_at)`;

    // Verificar se tabela settings existe
    console.log('📝 Verificando/criando tabela settings...');
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

    // Inserir configurações padrão
    console.log('📝 Inserindo configurações padrão...');
    const defaultSettings = [
      { key: 'commission_rate', value: 12, description: 'Taxa de comissão para vendedores free (%)' },
      { key: 'premium_commission_rate', value: 8, description: 'Taxa de comissão para vendedores premium (%)' },
      { key: 'pix_fee_percent', value: 0.99, description: 'Taxa do gateway para PIX (%)' },
      { key: 'card_fee_percent', value: 3.99, description: 'Taxa do gateway para cartão (%)' },
      { key: 'card_fee_fixed', value: 0.39, description: 'Taxa fixa do gateway para cartão (R$)' },
      { key: 'boleto_fee_fixed', value: 3.49, description: 'Taxa fixa para boleto (R$)' },
      { key: 'withdrawal_fee', value: 2.00, description: 'Taxa de saque (R$)' },
      { key: 'min_withdrawal', value: 20.00, description: 'Valor mínimo para saque (R$)' },
      { key: 'release_days', value: 3, description: 'Dias para liberação após entrega' },
      { key: 'cart_abandon_hours', value: 1, description: 'Horas para considerar carrinho abandonado' },
      { key: 'cashback_percent', value: 5, description: 'Percentual de cashback para compradores (%)' },
    ];

    for (const setting of defaultSettings) {
      try {
        await sql`
          INSERT INTO settings (key, value, description)
          VALUES (${setting.key}, ${JSON.stringify(setting.value)}, ${setting.description})
          ON CONFLICT (key) DO NOTHING
        `;
      } catch (e) {
        // Ignorar se já existe
      }
    }

    // Verificar se tabela reports existe
    console.log('📝 Verificando/criando tabela reports...');
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID NOT NULL REFERENCES users(id),
        reported_type VARCHAR(50) NOT NULL,
        reported_id UUID NOT NULL,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        resolved_by UUID,
        resolved_at TIMESTAMP,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Índices para reports
    await sql`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id)`;

    console.log('\n✅ Tabelas de analytics criadas com sucesso!');

    // Listar todas as tabelas
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 Tabelas no banco:');
    tables.forEach(t => console.log(`   ✓ ${t.table_name}`));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addAnalyticsTables();
