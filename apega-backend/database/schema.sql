-- Schema do Banco de Dados - Apega Desapega Brechó
-- Neon PostgreSQL

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: users (Usuários)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14), -- CPF para envios
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    city VARCHAR(100),
    state VARCHAR(2),

    -- Dados da loja
    store_name VARCHAR(255),
    store_description TEXT,

    -- Assinatura
    subscription_type VARCHAR(20) DEFAULT 'free', -- 'free' ou 'premium'
    subscription_expires_at TIMESTAMP,

    -- Métricas
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    total_following INTEGER DEFAULT 0,

    -- Financeiro
    balance DECIMAL(10,2) DEFAULT 0,
    cashback_balance DECIMAL(10,2) DEFAULT 0,

    -- Controle
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: categories (Categorias)
-- =============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: products (Produtos)
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    size VARCHAR(20),
    color VARCHAR(50),
    condition VARCHAR(20) NOT NULL, -- 'novo', 'seminovo', 'usado'

    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'sold', 'deleted'
    is_premium BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Métricas
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,

    -- Localização
    city VARCHAR(100),
    state VARCHAR(2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: product_images (Imagens dos Produtos)
-- =============================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: favorites (Favoritos)
-- =============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- =============================================
-- TABELA: cart_items (Itens do Carrinho)
-- =============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- =============================================
-- TABELA: orders (Pedidos)
-- =============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),

    -- Valores
    product_price DECIMAL(10,2) NOT NULL,
    shipping_price DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(4,2) NOT NULL, -- Taxa de comissão aplicada
    commission_amount DECIMAL(10,2) NOT NULL,
    seller_receives DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Status
    status VARCHAR(30) DEFAULT 'pending_payment',
    -- 'pending_payment', 'paid', 'pending_shipment', 'shipped', 'in_transit', 'delivered', 'completed', 'cancelled', 'refunded'

    -- Pagamento
    payment_method VARCHAR(30),
    payment_id VARCHAR(255),
    paid_at TIMESTAMP,

    -- Envio
    shipping_code VARCHAR(50),
    shipping_carrier VARCHAR(50),
    shipping_melhorenvio_id VARCHAR(255), -- ID do envio no Melhor Envio
    shipping_service_id INTEGER, -- ID do serviço de frete selecionado
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    -- Endereço de entrega
    shipping_address_id UUID,

    -- Cancelamento
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: addresses (Endereços)
-- =============================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    label VARCHAR(50), -- 'Casa', 'Trabalho', etc
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
);

-- =============================================
-- TABELA: payment_methods (Métodos de Pagamento)
-- =============================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(20) NOT NULL, -- 'credit', 'debit', 'pix'

    -- Cartão
    card_brand VARCHAR(20),
    card_last_four VARCHAR(4),
    card_holder_name VARCHAR(255),
    card_expiry VARCHAR(7),

    -- PIX
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(20), -- 'cpf', 'email', 'phone', 'random'

    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: transactions (Transações Financeiras)
-- =============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),

    type VARCHAR(20) NOT NULL, -- 'sale', 'purchase', 'cashback', 'withdraw', 'refund', 'subscription'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,

    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: reviews (Avaliações)
-- =============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewed_user_id UUID NOT NULL REFERENCES users(id),

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: messages (Mensagens)
-- =============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id),
    user2_id UUID NOT NULL REFERENCES users(id),
    product_id UUID REFERENCES products(id),

    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: notifications (Notificações)
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(30) NOT NULL, -- 'sale', 'purchase', 'message', 'review', 'promotion', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB, -- Dados extras (product_id, order_id, etc)

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: followers (Seguidores)
-- =============================================
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- =============================================
-- TABELA: subscriptions (Assinaturas Premium)
-- =============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),

    plan VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    price DECIMAL(10,2) NOT NULL,

    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'

    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,

    payment_method_id UUID REFERENCES payment_methods(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: carts (Carrinhos para tracking de abandono)
-- =============================================
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'abandoned', 'recovered', 'converted'
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
);

-- =============================================
-- TABELA: product_views (Visualizações de produtos)
-- =============================================
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    device_type VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: analytics_events (Eventos de analytics)
-- =============================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: settings (Configurações do sistema)
-- =============================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELA: reports (Denúncias)
-- =============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- =============================================
-- INSERIR CATEGORIAS PADRÃO
-- =============================================
INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Todas', 'all', 'apps', 0),
('Vestidos', 'vestidos', 'woman', 1),
('Blusas', 'blusas', 'shirt', 2),
('Calças', 'calcas', 'pants', 3),
('Saias', 'saias', 'skirt', 4),
('Shorts', 'shorts', 'shorts', 5),
('Conjuntos', 'conjuntos', 'set', 6),
('Acessórios', 'acessorios', 'watch', 7),
('Calçados', 'calcados', 'shoe', 8),
('Bolsas', 'bolsas', 'bag', 9),
('Premium', 'premium', 'star', 10);

-- =============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
