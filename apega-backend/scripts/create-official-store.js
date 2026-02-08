/**
 * Script para criar a Loja Oficial do Largô com produtos de teste
 * Execute com: node scripts/create-official-store.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// Dados da loja oficial
const STORE_DATA = {
  email: 'loja@largo.com.br',
  password: 'Largo@2024',
  name: 'Loja Oficial Largô',
  phone: '11999999999',
  bio: 'Loja oficial do Largô - Moda sustentável com curadoria especial',
  is_verified: true,
  // Logo - Imagem elegante de moda sustentável
  avatar_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop',
  // Banner - Rack de roupas vintage bonito
  banner_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
};

// Produtos com imagens ESPECÍFICAS para cada item (mais precisas)
const PRODUCTS = {
  feminino: [
    { title: 'Vestido Midi Floral', brand: 'Farm', size: 'M', condition: 'Excelente', price: 189.90, original_price: 459.00,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500' }, // vestido floral real
    { title: 'Blusa de Seda Off-White', brand: 'Animale', size: 'P', condition: 'Como novo', price: 129.90, original_price: 320.00,
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500' }, // blusa clara
    { title: 'Saia Longa Plissada', brand: 'Zara', size: 'M', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500' }, // saia plissada
    { title: 'Blazer Alfaiataria Preto', brand: 'Shoulder', size: 'M', condition: 'Excelente', price: 199.90, original_price: 489.00,
      image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=500' }, // blazer preto
    { title: 'Calça Pantalona Linho', brand: 'Renner', size: 'G', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500' }, // calça larga
    { title: 'Camisa Social Branca Feminina', brand: 'Dudalina', size: 'M', condition: 'Como novo', price: 89.90, original_price: 249.00,
      image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500' }, // camisa branca feminina
    { title: 'Vestido Longo Festa Verde', brand: 'Le Lis Blanc', size: 'P', condition: 'Excelente', price: 299.90, original_price: 890.00,
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500' }, // vestido longo festa
    { title: 'Cropped Tricot Rosa', brand: 'Amaro', size: 'M', condition: 'Muito bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500' }, // cropped rosa
    { title: 'Jaqueta Jeans Feminina', brand: 'Levis', size: 'M', condition: 'Bom', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500' }, // jaqueta jeans feminina
    { title: 'Macacão Longo Preto', brand: 'Maria Filó', size: 'P', condition: 'Excelente', price: 179.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500' }, // macacão preto
  ],
  masculino: [
    { title: 'Camisa Social Azul Slim', brand: 'Aramis', size: 'M', condition: 'Como novo', price: 99.90, original_price: 289.00,
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500' }, // camisa social azul
    { title: 'Blazer Marinho Masculino', brand: 'VR', size: 'G', condition: 'Excelente', price: 249.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500' }, // blazer masculino
    { title: 'Calça Chino Bege', brand: 'Reserva', size: 'M', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500' }, // calça chino bege
    { title: 'Polo Preta Lacoste', brand: 'Lacoste', size: 'M', condition: 'Bom', price: 89.90, original_price: 349.00,
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500' }, // polo preta
    { title: 'Jaqueta Couro Preta', brand: 'Zara Man', size: 'G', condition: 'Excelente', price: 199.90, original_price: 459.00,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' }, // jaqueta couro
    { title: 'Camiseta Branca Básica', brand: 'Osklen', size: 'M', condition: 'Como novo', price: 69.90, original_price: 189.00,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500' }, // camiseta branca
    { title: 'Shorts Linho Bege', brand: 'Richards', size: 'M', condition: 'Muito bom', price: 59.90, original_price: 159.00,
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500' }, // shorts linho
    { title: 'Suéter Cinza Tricot', brand: 'Tommy Hilfiger', size: 'G', condition: 'Excelente', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500' }, // suéter cinza
    { title: 'Calça Jeans Azul Slim', brand: 'Calvin Klein', size: 'M', condition: 'Bom', price: 119.90, original_price: 299.00,
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500' }, // calça jeans azul
    { title: 'Camisa Linho Off-White', brand: 'Foxton', size: 'M', condition: 'Como novo', price: 89.90, original_price: 229.00,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500' }, // camisa linho
  ],
  infantil: [
    { title: 'Vestido Rosa Festa Infantil', brand: 'Lilica Ripilica', size: '6 anos', condition: 'Excelente', price: 89.90, original_price: 259.00,
      image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500' }, // vestido infantil rosa
    { title: 'Conjunto Moletom Azul', brand: 'Hering Kids', size: '8 anos', condition: 'Muito bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500' }, // conjunto infantil
    { title: 'Camiseta Amarela Infantil', brand: 'Tip Top', size: '4 anos', condition: 'Como novo', price: 29.90, original_price: 69.00,
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500' }, // camiseta infantil
    { title: 'Calça Jeans Kids', brand: 'Malwee Kids', size: '6 anos', condition: 'Bom', price: 39.90, original_price: 99.00,
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500' }, // roupa infantil
    { title: 'Vestido Listrado Infantil', brand: 'Brandili', size: '5 anos', condition: 'Excelente', price: 44.90, original_price: 119.00,
      image: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=500' }, // vestido listrado
    { title: 'Jaqueta Bomber Infantil', brand: 'PUC', size: '8 anos', condition: 'Muito bom', price: 69.90, original_price: 189.00,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500' }, // jaqueta infantil
    { title: 'Short Saia Rosa', brand: 'Alakazoo', size: '4 anos', condition: 'Como novo', price: 34.90, original_price: 89.00,
      image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=500' }, // roupa menina
    { title: 'Pijama Estampado', brand: 'Puket', size: '6 anos', condition: 'Excelente', price: 49.90, original_price: 139.00,
      image: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=500' }, // pijama infantil
    { title: 'Camiseta Azul Infantil', brand: 'Renner Kids', size: '10 anos', condition: 'Bom', price: 24.90, original_price: 59.00,
      image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500' }, // camiseta menino
    { title: 'Macacão Jeans Baby', brand: "Carter's", size: '2 anos', condition: 'Como novo', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=500' }, // macacão baby
  ],
  acessorios: [
    { title: 'Colar Pérolas Brancas', brand: 'Vivara', size: 'Único', condition: 'Excelente', price: 89.90, original_price: 259.00,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500' }, // colar pérolas
    { title: 'Relógio Dourado Feminino', brand: 'Michael Kors', size: 'Único', condition: 'Muito bom', price: 299.90, original_price: 899.00,
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500' }, // relógio dourado
    { title: 'Óculos Aviador Preto', brand: 'Ray-Ban', size: 'Único', condition: 'Como novo', price: 199.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500' }, // óculos aviador
    { title: 'Cinto Couro Marrom', brand: 'Ferracini', size: '90cm', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500' }, // cinto marrom
    { title: 'Lenço Seda Estampado', brand: 'Hermès', size: 'Único', condition: 'Excelente', price: 399.90, original_price: 1200.00,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500' }, // lenço seda
    { title: 'Brincos Argola Dourada', brand: 'Pandora', size: 'Único', condition: 'Como novo', price: 149.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500' }, // brincos argola
    { title: 'Pulseira Couro Preta', brand: 'Diesel', size: 'Único', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500' }, // pulseira couro
    { title: 'Chapéu Panamá Palha', brand: 'Renner', size: 'M', condition: 'Excelente', price: 69.90, original_price: 179.00,
      image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500' }, // chapéu panamá
    { title: 'Gravata Seda Azul Marinho', brand: 'Hugo Boss', size: 'Único', condition: 'Como novo', price: 89.90, original_price: 290.00,
      image: 'https://images.unsplash.com/photo-1598032895455-1c0f4fde8bb4?w=500' }, // gravata azul
    { title: 'Tiara Veludo Preta', brand: 'Farm', size: 'Único', condition: 'Excelente', price: 39.90, original_price: 99.00,
      image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=500' }, // tiara
  ],
  calcados: [
    { title: 'Tênis Branco Adidas', brand: 'Adidas', size: '38', condition: 'Muito bom', price: 199.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500' }, // tênis branco
    { title: 'Sandália Salto Alto Nude', brand: 'Arezzo', size: '37', condition: 'Excelente', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500' }, // sandália nude
    { title: 'Bota Chelsea Preta', brand: 'Democrata', size: '42', condition: 'Como novo', price: 179.90, original_price: 449.00,
      image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500' }, // bota chelsea
    { title: 'Mocassim Marrom Couro', brand: 'Ferracini', size: '40', condition: 'Bom', price: 129.90, original_price: 329.00,
      image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500' }, // mocassim
    { title: 'Scarpin Nude Alto', brand: 'Schutz', size: '36', condition: 'Excelente', price: 189.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=500' }, // scarpin nude
    { title: 'Tênis Running Nike Vermelho', brand: 'Nike', size: '39', condition: 'Muito bom', price: 229.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' }, // tênis nike vermelho
    { title: 'Rasteira Dourada', brand: 'Melissa', size: '37', condition: 'Como novo', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500' }, // rasteira
    { title: 'Sapato Oxford Marrom', brand: 'Richards', size: '41', condition: 'Excelente', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500' }, // oxford
    { title: 'Chinelo Slide Preto', brand: 'Vans', size: '38', condition: 'Bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=500' }, // slide
    { title: 'Alpargata Bege', brand: 'Havaianas', size: '40', condition: 'Como novo', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500' }, // alpargata
  ],
  bolsas: [
    { title: 'Bolsa Tote Caramelo', brand: 'Arezzo', size: 'Grande', condition: 'Excelente', price: 299.90, original_price: 799.00,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500' }, // bolsa tote
    { title: 'Clutch Dourada Festa', brand: 'Schutz', size: 'Pequena', condition: 'Como novo', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500' }, // clutch
    { title: 'Mochila Preta Couro', brand: 'Kipling', size: 'Média', condition: 'Muito bom', price: 179.90, original_price: 449.00,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' }, // mochila
    { title: 'Bolsa Tiracolo Nude', brand: 'Guess', size: 'Média', condition: 'Excelente', price: 199.90, original_price: 549.00,
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500' }, // tiracolo
    { title: 'Carteira Rosa', brand: 'Michael Kors', size: 'Única', condition: 'Como novo', price: 129.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500' }, // carteira
    { title: 'Necessaire Estampada Verde', brand: 'Farm', size: 'Média', condition: 'Excelente', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1601388185820-807df6a5c4d1?w=500' }, // necessaire
    { title: 'Bolsa Saco Bege', brand: 'Renner', size: 'Grande', condition: 'Muito bom', price: 89.90, original_price: 229.00,
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500' }, // bolsa saco
    { title: 'Pasta Executiva Preta', brand: 'Victor Hugo', size: 'Grande', condition: 'Excelente', price: 249.90, original_price: 699.00,
      image: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?w=500' }, // pasta
    { title: 'Mini Bag Transversal Preta', brand: 'Petite Jolie', size: 'Pequena', condition: 'Como novo', price: 69.90, original_price: 179.00,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500' }, // mini bag
    { title: 'Bolsa Praia Palha', brand: 'Roxy', size: 'Grande', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=500' }, // bolsa praia
  ],
  vintage: [
    { title: 'Jaqueta Jeans Oversized 90s', brand: 'Levis', size: 'M', condition: 'Vintage', price: 249.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500' }, // jaqueta jeans vintage
    { title: 'Vestido Boho Florido 70s', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 189.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=500' }, // vestido boho
    { title: 'Camisa Havaiana Estampada', brand: 'Tommy Bahama', size: 'G', condition: 'Vintage', price: 129.90, original_price: 320.00,
      image: 'https://images.unsplash.com/photo-1517191434949-5e90cd67d2b6?w=500' }, // camisa havaiana
    { title: 'Calça Flare Jeans 70s', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 99.90, original_price: 250.00,
      image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500' }, // calça flare
    { title: 'Bolero Crochê Branco', brand: 'Handmade', size: 'P', condition: 'Vintage', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500' }, // crochê
    { title: 'Casaco Tweed Rosa', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 349.90, original_price: 899.00,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500' }, // casaco tweed
    { title: 'Óculos Gatinho Branco', brand: 'Vintage', size: 'Único', condition: 'Vintage', price: 89.90, original_price: 220.00,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500' }, // óculos gatinho
    { title: 'Maleta Couro Caramelo', brand: 'Vintage', size: 'Média', condition: 'Vintage', price: 199.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=500' }, // maleta vintage
    { title: 'Vestido Pin-Up Vermelho Poá', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500' }, // vestido pin-up
    { title: 'Jaqueta College Amarela', brand: 'Vintage', size: 'G', condition: 'Vintage', price: 179.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500' }, // jaqueta college
  ],
};

// Mapeamento de categoria para category_id (buscar do banco)
async function getCategoryMap() {
  try {
    const categories = await sql`SELECT id, slug, name FROM categories WHERE is_active = true`;
    const map = {};
    for (const cat of categories) {
      map[cat.slug] = cat.id;
      map[cat.name.toLowerCase()] = cat.id;
    }
    return map;
  } catch (e) {
    console.log('⚠️ Não foi possível buscar categorias, continuando sem category_id');
    return {};
  }
}

async function createOfficialStore() {
  console.log('🏪 Criando Loja Oficial do Largô...\n');

  try {
    // 1. Buscar mapa de categorias
    const categoryMap = await getCategoryMap();
    console.log('📋 Categorias encontradas:', Object.keys(categoryMap).length);

    // 2. Verificar se o usuário já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${STORE_DATA.email}
    `;

    let userId;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`✅ Usuário já existe: ${userId}`);

      // Atualizar avatar e banner
      await sql`
        UPDATE users
        SET avatar_url = ${STORE_DATA.avatar_url},
            banner_url = ${STORE_DATA.banner_url},
            is_verified = true
        WHERE id = ${userId}
      `;
      console.log('🖼️  Avatar e banner atualizados');
    } else {
      // Criar o usuário da loja
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(STORE_DATA.password, 10);

      const newUser = await sql`
        INSERT INTO users (
          email, password_hash, name, phone, bio, is_verified,
          store_name, store_description, avatar_url, banner_url, created_at
        )
        VALUES (
          ${STORE_DATA.email},
          ${hashedPassword},
          ${STORE_DATA.name},
          ${STORE_DATA.phone},
          ${STORE_DATA.bio},
          ${STORE_DATA.is_verified},
          ${'Loja Oficial Largô'},
          ${'Curadoria especial de moda sustentável. Peças únicas selecionadas com carinho para você!'},
          ${STORE_DATA.avatar_url},
          ${STORE_DATA.banner_url},
          NOW()
        )
        RETURNING id
      `;

      userId = newUser[0].id;
      console.log(`✅ Usuário criado: ${userId}`);
    }

    // 3. Deletar produtos antigos desta loja (se houver)
    await sql`DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE seller_id = ${userId})`;
    await sql`DELETE FROM products WHERE seller_id = ${userId}`;
    console.log('🗑️  Produtos antigos removidos');

    // 4. Criar produtos por categoria
    let totalProducts = 0;

    for (const [category, products] of Object.entries(PRODUCTS)) {
      console.log(`\n📦 Adicionando produtos: ${category.toUpperCase()}`);

      // Tentar encontrar category_id
      const categoryId = categoryMap[category] || categoryMap['roupas'] || null;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        // Inserir produto
        const newProduct = await sql`
          INSERT INTO products (
            seller_id,
            category_id,
            title,
            description,
            price,
            original_price,
            brand,
            size,
            condition,
            status,
            city,
            state,
            created_at
          )
          VALUES (
            ${userId},
            ${categoryId},
            ${product.title},
            ${`${product.title} da marca ${product.brand}. Peça em ${product.condition.toLowerCase()} estado, tamanho ${product.size}. Ótima oportunidade para quem busca moda sustentável com qualidade! Categoria: ${category}`},
            ${product.price},
            ${product.original_price},
            ${product.brand},
            ${product.size},
            ${product.condition},
            'active',
            'São Paulo',
            'SP',
            NOW()
          )
          RETURNING id
        `;

        // Inserir imagem do produto
        await sql`
          INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
          VALUES (${newProduct[0].id}, ${product.image}, true, 0)
        `;

        totalProducts++;
        console.log(`   ✓ ${product.title}`);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 LOJA OFICIAL CRIADA COM SUCESSO!');
    console.log('═'.repeat(50));
    console.log(`\n📧 Email: ${STORE_DATA.email}`);
    console.log(`🔑 Senha: ${STORE_DATA.password}`);
    console.log(`🖼️  Avatar: ${STORE_DATA.avatar_url}`);
    console.log(`🎨 Banner: ${STORE_DATA.banner_url}`);
    console.log(`📦 Total de produtos: ${totalProducts}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Erro ao criar loja:', error);
    throw error;
  }
}

// Executar
createOfficialStore()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
