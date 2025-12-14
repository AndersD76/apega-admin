// Test script para testar todos os endpoints da API
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3003';

// Criar uma imagem de teste mínima (1x1 PNG vermelho)
const createTestImage = () => {
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64'
  );
  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
};

async function runTests() {
  console.log('🧪 Iniciando testes da API...\n');

  try {
    // Test 1: GET /api/items (lista vazia)
    console.log('📋 Test 1: GET /api/items');
    const getItemsRes = await fetch(`${API_URL}/api/items`);
    const getItemsData = await getItemsRes.json();
    console.log('✅ Status:', getItemsRes.status);
    console.log('✅ Response:', JSON.stringify(getItemsData, null, 2));
    console.log('');

    // Test 2: POST /api/upload
    console.log('📤 Test 2: POST /api/upload');
    const testImagePath = createTestImage();
    const uploadForm = new FormData();
    uploadForm.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const uploadRes = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: uploadForm,
      headers: uploadForm.getHeaders(),
    });
    const uploadData = await uploadRes.json();
    console.log('✅ Status:', uploadRes.status);
    console.log('✅ Response:', JSON.stringify(uploadData, null, 2));
    const imageUrl = uploadData.url;
    console.log('');

    // Test 3: POST /api/items (criar item)
    console.log('📝 Test 3: POST /api/items');
    const createForm = new FormData();
    createForm.append('sellerName', 'João Silva');
    createForm.append('sellerWhats', '5554999999999');
    createForm.append('title', 'Vestido Floral Teste');
    createForm.append('description', 'Lindo vestido para teste da API');
    createForm.append('brand', 'Zara');
    createForm.append('size', 'M');
    createForm.append('priceCents', '8900');
    createForm.append('condition', 'semi-novo');
    createForm.append('imageUrl', imageUrl);
    createForm.append('city', 'Passo Fundo');

    const createRes = await fetch(`${API_URL}/api/items`, {
      method: 'POST',
      body: createForm,
      headers: createForm.getHeaders(),
    });
    const createData = await createRes.json();
    console.log('✅ Status:', createRes.status);
    console.log('✅ Response:', JSON.stringify(createData, null, 2));
    const itemId = createData.itemId;
    console.log('');

    // Test 4: GET /api/items (lista com 1 item)
    console.log('📋 Test 4: GET /api/items (com item criado)');
    const getItemsRes2 = await fetch(`${API_URL}/api/items`);
    const getItemsData2 = await getItemsRes2.json();
    console.log('✅ Status:', getItemsRes2.status);
    console.log('✅ Items encontrados:', getItemsData2.items.length);
    console.log('✅ Primeiro item:', JSON.stringify(getItemsData2.items[0], null, 2));
    console.log('');

    // Test 5: GET /api/items/[id]
    console.log('📄 Test 5: GET /api/items/' + itemId);
    const getItemRes = await fetch(`${API_URL}/api/items/${itemId}`);
    const getItemData = await getItemRes.json();
    console.log('✅ Status:', getItemRes.status);
    console.log('✅ Response:', JSON.stringify(getItemData, null, 2));
    const sellerId = getItemData.seller.id;
    console.log('');

    // Test 6: PATCH /api/items/[id]
    console.log('✏️  Test 6: PATCH /api/items/' + itemId);
    const updateRes = await fetch(`${API_URL}/api/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'RESERVED',
        priceCents: 7900,
      }),
    });
    const updateData = await updateRes.json();
    console.log('✅ Status:', updateRes.status);
    console.log('✅ Response:', JSON.stringify(updateData, null, 2));
    console.log('');

    // Test 7: GET /api/sellers/[id]
    console.log('👤 Test 7: GET /api/sellers/' + sellerId);
    const getSellerRes = await fetch(`${API_URL}/api/sellers/${sellerId}`);
    const getSellerData = await getSellerRes.json();
    console.log('✅ Status:', getSellerRes.status);
    console.log('✅ Response:', JSON.stringify(getSellerData, null, 2));
    console.log('');

    // Test 8: DELETE /api/items/[id]
    console.log('🗑️  Test 8: DELETE /api/items/' + itemId);
    const deleteRes = await fetch(`${API_URL}/api/items/${itemId}`, {
      method: 'DELETE',
    });
    const deleteData = await deleteRes.json();
    console.log('✅ Status:', deleteRes.status);
    console.log('✅ Response:', JSON.stringify(deleteData, null, 2));
    console.log('');

    // Test 9: GET /api/items (lista vazia novamente)
    console.log('📋 Test 9: GET /api/items (após delete)');
    const getItemsRes3 = await fetch(`${API_URL}/api/items`);
    const getItemsData3 = await getItemsRes3.json();
    console.log('✅ Status:', getItemsRes3.status);
    console.log('✅ Items encontrados:', getItemsData3.items.length);
    console.log('');

    // Limpar arquivo de teste
    fs.unlinkSync(testImagePath);

    console.log('✅ TODOS OS TESTES PASSARAM! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
