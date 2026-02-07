/**
 * Script para limpar todos os usuários e produtos do banco de dados
 * Execute com: node scripts/clean-database.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function safeDelete(tableName, query) {
  try {
    await query;
    console.log(`✅ ${tableName}`);
  } catch (e) {
    if (e.message.includes('does not exist')) {
      console.log(`⏭️  ${tableName} não existe`);
    } else {
      console.log(`⚠️  ${tableName}: ${e.message}`);
    }
  }
}

async function cleanDatabase() {
  console.log('🗑️  Iniciando limpeza do banco de dados...\n');

  try {
    // Deletar em ordem respeitando foreign keys

    // 1. Mensagens e conversas
    await safeDelete('messages', sql`DELETE FROM messages`);
    await safeDelete('conversations', sql`DELETE FROM conversations`);

    // 2. Pedidos
    await safeDelete('order_items', sql`DELETE FROM order_items`);
    await safeDelete('orders', sql`DELETE FROM orders`);

    // 3. Carrinho
    await safeDelete('cart_items', sql`DELETE FROM cart_items`);
    await safeDelete('carts', sql`DELETE FROM carts`);

    // 4. Favoritos
    await safeDelete('favorites', sql`DELETE FROM favorites`);

    // 5. Imagens dos produtos
    await safeDelete('product_images', sql`DELETE FROM product_images`);

    // 6. Tags dos produtos
    await safeDelete('product_tags', sql`DELETE FROM product_tags`);

    // 7. Produtos
    await safeDelete('products', sql`DELETE FROM products`);

    // 8. Endereços
    await safeDelete('addresses', sql`DELETE FROM addresses`);

    // 9. Notificações
    await safeDelete('notifications', sql`DELETE FROM notifications`);

    // 10. Sessions
    await safeDelete('sessions', sql`DELETE FROM sessions`);

    // 11. Usuários (exceto admin)
    console.log('Limpando usuários não-admin...');
    await sql`DELETE FROM users WHERE email != 'admin@apega.com' AND (is_admin IS NULL OR is_admin = false)`;
    console.log('✅ users (não-admin)');

    // Verificar contagem final
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    let productsCount = [{ count: 0 }];
    try {
      productsCount = await sql`SELECT COUNT(*) as count FROM products`;
    } catch (e) {}

    console.log('\n📊 Resultado:');
    console.log(`   Usuários restantes: ${usersCount[0].count}`);
    console.log(`   Produtos restantes: ${productsCount[0].count}`);

    console.log('\n✨ Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  }
}

cleanDatabase();
