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
};

// Produtos com imagens ESPECÍFICAS para cada item
const PRODUCTS = {
  feminino: [
    { title: 'Vestido Midi Floral', brand: 'Farm', size: 'M', condition: 'Excelente', price: 189.90, original_price: 459.00,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400' }, // vestido floral
    { title: 'Blusa de Seda Off-White', brand: 'Animale', size: 'P', condition: 'Como novo', price: 129.90, original_price: 320.00,
      image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400' }, // blusa branca
    { title: 'Saia Longa Plissada', brand: 'Zara', size: 'M', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400' }, // saia longa
    { title: 'Blazer Alfaiataria Preto', brand: 'Shoulder', size: 'M', condition: 'Excelente', price: 199.90, original_price: 489.00,
      image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400' }, // blazer feminino
    { title: 'Calça Pantalona Linho', brand: 'Renner', size: 'G', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' }, // calça pantalona
    { title: 'Camisa Social Branca', brand: 'Dudalina', size: 'M', condition: 'Como novo', price: 89.90, original_price: 249.00,
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400' }, // camisa branca
    { title: 'Vestido Longo Festa', brand: 'Le Lis Blanc', size: 'P', condition: 'Excelente', price: 299.90, original_price: 890.00,
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400' }, // vestido longo
    { title: 'Cropped Tricot Rosa', brand: 'Amaro', size: 'M', condition: 'Muito bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400' }, // cropped
    { title: 'Jaqueta Jeans Vintage', brand: 'Levis', size: 'M', condition: 'Bom', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400' }, // jaqueta jeans
    { title: 'Macacão Longo Preto', brand: 'Maria Filó', size: 'P', condition: 'Excelente', price: 179.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' }, // macacão
  ],
  masculino: [
    { title: 'Camisa Social Slim', brand: 'Aramis', size: 'M', condition: 'Como novo', price: 99.90, original_price: 289.00,
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' }, // camisa social
    { title: 'Blazer Casual Marinho', brand: 'VR', size: 'G', condition: 'Excelente', price: 249.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400' }, // blazer masculino
    { title: 'Calça Chino Bege', brand: 'Reserva', size: 'M', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400' }, // calça chino
    { title: 'Polo Básica Preta', brand: 'Lacoste', size: 'M', condition: 'Bom', price: 89.90, original_price: 349.00,
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400' }, // polo preta
    { title: 'Jaqueta Couro Sintético', brand: 'Zara Man', size: 'G', condition: 'Excelente', price: 199.90, original_price: 459.00,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' }, // jaqueta couro
    { title: 'Camiseta Estampada', brand: 'Osklen', size: 'M', condition: 'Como novo', price: 69.90, original_price: 189.00,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400' }, // camiseta estampada
    { title: 'Shorts Linho Natural', brand: 'Richards', size: 'M', condition: 'Muito bom', price: 59.90, original_price: 159.00,
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400' }, // shorts
    { title: 'Suéter Tricot Cinza', brand: 'Tommy Hilfiger', size: 'G', condition: 'Excelente', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' }, // suéter
    { title: 'Calça Jeans Slim', brand: 'Calvin Klein', size: 'M', condition: 'Bom', price: 119.90, original_price: 299.00,
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400' }, // calça jeans
    { title: 'Camisa Linho Branca', brand: 'Foxton', size: 'M', condition: 'Como novo', price: 89.90, original_price: 229.00,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' }, // camisa linho
  ],
  infantil: [
    { title: 'Vestido Festa Infantil', brand: 'Lilica Ripilica', size: '6 anos', condition: 'Excelente', price: 89.90, original_price: 259.00,
      image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400' }, // vestido infantil
    { title: 'Conjunto Moletom', brand: 'Hering Kids', size: '8 anos', condition: 'Muito bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400' }, // conjunto infantil
    { title: 'Camiseta Dinossauro', brand: 'Tip Top', size: '4 anos', condition: 'Como novo', price: 29.90, original_price: 69.00,
      image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400' }, // camiseta infantil
    { title: 'Calça Jeans Infantil', brand: 'Malwee Kids', size: '6 anos', condition: 'Bom', price: 39.90, original_price: 99.00,
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400' }, // calça infantil
    { title: 'Vestido Casual Listrado', brand: 'Brandili', size: '5 anos', condition: 'Excelente', price: 44.90, original_price: 119.00,
      image: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=400' }, // vestido listrado
    { title: 'Jaqueta Bomber Kids', brand: 'PUC', size: '8 anos', condition: 'Muito bom', price: 69.90, original_price: 189.00,
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400' }, // jaqueta infantil
    { title: 'Short Saia Infantil', brand: 'Alakazoo', size: '4 anos', condition: 'Como novo', price: 34.90, original_price: 89.00,
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400' }, // short saia
    { title: 'Pijama Unicórnio', brand: 'Puket', size: '6 anos', condition: 'Excelente', price: 49.90, original_price: 139.00,
      image: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=400' }, // pijama
    { title: 'Camiseta Super-Herói', brand: 'Renner Kids', size: '10 anos', condition: 'Bom', price: 24.90, original_price: 59.00,
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400' }, // camiseta
    { title: 'Macacão Jeans Baby', brand: "Carter's", size: '2 anos', condition: 'Como novo', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400' }, // macacão baby
  ],
  acessorios: [
    { title: 'Colar Pérolas Sintéticas', brand: 'Vivara', size: 'Único', condition: 'Excelente', price: 89.90, original_price: 259.00,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' }, // colar pérolas
    { title: 'Relógio Feminino Dourado', brand: 'Michael Kors', size: 'Único', condition: 'Muito bom', price: 299.90, original_price: 899.00,
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400' }, // relógio
    { title: 'Óculos de Sol Aviador', brand: 'Ray-Ban', size: 'Único', condition: 'Como novo', price: 199.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400' }, // óculos aviador
    { title: 'Cinto Couro Marrom', brand: 'Ferracini', size: '90cm', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' }, // cinto
    { title: 'Lenço de Seda Estampado', brand: 'Hermès', size: 'Único', condition: 'Excelente', price: 399.90, original_price: 1200.00,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' }, // lenço
    { title: 'Brincos Argola Ouro', brand: 'Pandora', size: 'Único', condition: 'Como novo', price: 149.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400' }, // brincos
    { title: 'Pulseira Couro', brand: 'Diesel', size: 'Único', condition: 'Muito bom', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400' }, // pulseira
    { title: 'Chapéu Panamá', brand: 'Renner', size: 'M', condition: 'Excelente', price: 69.90, original_price: 179.00,
      image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400' }, // chapéu
    { title: 'Gravata Seda Azul', brand: 'Hugo Boss', size: 'Único', condition: 'Como novo', price: 89.90, original_price: 290.00,
      image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400' }, // gravata
    { title: 'Tiara Veludo Bordô', brand: 'Farm', size: 'Único', condition: 'Excelente', price: 39.90, original_price: 99.00,
      image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=400' }, // tiara
  ],
  calcados: [
    { title: 'Tênis Branco Clássico', brand: 'Adidas', size: '38', condition: 'Muito bom', price: 199.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' }, // tênis branco
    { title: 'Sandália Salto Bloco', brand: 'Arezzo', size: '37', condition: 'Excelente', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' }, // sandália
    { title: 'Bota Chelsea Preta', brand: 'Democrata', size: '42', condition: 'Como novo', price: 179.90, original_price: 449.00,
      image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400' }, // bota chelsea
    { title: 'Mocassim Couro', brand: 'Ferracini', size: '40', condition: 'Bom', price: 129.90, original_price: 329.00,
      image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400' }, // mocassim
    { title: 'Sapato Scarpin Nude', brand: 'Schutz', size: '36', condition: 'Excelente', price: 189.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=400' }, // scarpin
    { title: 'Tênis Running', brand: 'Nike', size: '39', condition: 'Muito bom', price: 229.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }, // tênis running
    { title: 'Rasteirinha Metalizada', brand: 'Melissa', size: '37', condition: 'Como novo', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400' }, // rasteirinha
    { title: 'Oxford Marrom', brand: 'Richards', size: '41', condition: 'Excelente', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400' }, // oxford
    { title: 'Chinelo Slide', brand: 'Vans', size: '38', condition: 'Bom', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=400' }, // slide
    { title: 'Alpargata Lona', brand: 'Havaianas', size: '40', condition: 'Como novo', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400' }, // alpargata
  ],
  bolsas: [
    { title: 'Bolsa Tote Couro', brand: 'Arezzo', size: 'Grande', condition: 'Excelente', price: 299.90, original_price: 799.00,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' }, // tote
    { title: 'Clutch Festa Dourada', brand: 'Schutz', size: 'Pequena', condition: 'Como novo', price: 149.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400' }, // clutch
    { title: 'Mochila Couro Sintético', brand: 'Kipling', size: 'Média', condition: 'Muito bom', price: 179.90, original_price: 449.00,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' }, // mochila
    { title: 'Bolsa Tiracolo', brand: 'Guess', size: 'Média', condition: 'Excelente', price: 199.90, original_price: 549.00,
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400' }, // tiracolo
    { title: 'Carteira Longa', brand: 'Michael Kors', size: 'Única', condition: 'Como novo', price: 129.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' }, // carteira
    { title: 'Necessaire Estampada', brand: 'Farm', size: 'Média', condition: 'Excelente', price: 49.90, original_price: 129.00,
      image: 'https://images.unsplash.com/photo-1601388185820-807df6a5c4d1?w=400' }, // necessaire
    { title: 'Bolsa Saco Camurça', brand: 'Renner', size: 'Grande', condition: 'Muito bom', price: 89.90, original_price: 229.00,
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' }, // bolsa saco
    { title: 'Pasta Executiva', brand: 'Victor Hugo', size: 'Grande', condition: 'Excelente', price: 249.90, original_price: 699.00,
      image: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?w=400' }, // pasta
    { title: 'Mini Bag Transversal', brand: 'Petite Jolie', size: 'Pequena', condition: 'Como novo', price: 69.90, original_price: 179.00,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' }, // mini bag
    { title: 'Bolsa Praia Palha', brand: 'Roxy', size: 'Grande', condition: 'Bom', price: 59.90, original_price: 149.00,
      image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=400' }, // bolsa praia
  ],
  vintage: [
    { title: 'Jaqueta Jeans 90s', brand: 'Levis', size: 'M', condition: 'Vintage', price: 249.90, original_price: 599.00,
      image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400' }, // jaqueta jeans vintage
    { title: 'Vestido Boho 70s', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 189.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=400' }, // vestido boho
    { title: 'Camisa Havaiana Retrô', brand: 'Tommy Bahama', size: 'G', condition: 'Vintage', price: 129.90, original_price: 320.00,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' }, // camisa havaiana
    { title: 'Calça Flare Anos 70', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 99.90, original_price: 250.00,
      image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400' }, // calça flare
    { title: 'Bolero Crochê Artesanal', brand: 'Handmade', size: 'P', condition: 'Vintage', price: 79.90, original_price: 199.00,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' }, // crochê
    { title: 'Casaco Tweed Chanel Style', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 349.90, original_price: 899.00,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400' }, // casaco tweed
    { title: 'Óculos Gatinho 60s', brand: 'Vintage', size: 'Único', condition: 'Vintage', price: 89.90, original_price: 220.00,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400' }, // óculos gatinho
    { title: 'Maleta Couro Vintage', brand: 'Vintage', size: 'Média', condition: 'Vintage', price: 199.90, original_price: 499.00,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' }, // maleta
    { title: 'Vestido Pin-Up Poá', brand: 'Vintage', size: 'M', condition: 'Vintage', price: 159.90, original_price: 399.00,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400' }, // vestido poá
    { title: 'Jaqueta College 80s', brand: 'Vintage', size: 'G', condition: 'Vintage', price: 179.90, original_price: 450.00,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' }, // jaqueta college
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
    } else {
      // Criar o usuário da loja
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(STORE_DATA.password, 10);

      const newUser = await sql`
        INSERT INTO users (email, password_hash, name, phone, bio, is_verified, store_name, store_description, created_at)
        VALUES (
          ${STORE_DATA.email},
          ${hashedPassword},
          ${STORE_DATA.name},
          ${STORE_DATA.phone},
          ${STORE_DATA.bio},
          ${STORE_DATA.is_verified},
          ${'Loja Oficial Largô'},
          ${'Curadoria especial de moda sustentável. Peças únicas selecionadas com carinho para você!'},
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
