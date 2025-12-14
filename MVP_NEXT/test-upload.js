// Test apenas do upload
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

async function testUpload() {
  console.log('🧪 Testando upload de imagem...\n');

  try {
    const testImagePath = createTestImage();
    const uploadForm = new FormData();
    uploadForm.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('Enviando imagem para', API_URL + '/api/upload');
    const uploadRes = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: uploadForm,
      headers: uploadForm.getHeaders(),
    });

    console.log('Status:', uploadRes.status);
    const uploadData = await uploadRes.json();
    console.log('Response:', JSON.stringify(uploadData, null, 2));

    // Limpar arquivo de teste
    fs.unlinkSync(testImagePath);

    if (uploadRes.ok && uploadData.success) {
      console.log('\n✅ UPLOAD FUNCIONOU!');
      console.log('URL da imagem:', uploadData.url);
      process.exit(0);
    } else {
      console.log('\n❌ UPLOAD FALHOU');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpload();
