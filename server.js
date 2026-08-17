import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');

// Log dist folder contents on startup
console.log('Dist path:', distPath);
console.log('Dist exists:', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log('Dist contents:', fs.readdirSync(distPath));
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('Assets contents:', fs.readdirSync(assetsPath));
  }
}

// Rota de health check (before static)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath)
  });
});

// Also respond to /api/health (Railway may use root railway.json healthcheckPath)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir arquivos estáticos do build - IMPORTANT: before SPA fallback
// Assets têm hash no nome → cache longo. index.html NUNCA pode ser cacheado,
// senão o navegador continua apontando para bundles antigos após cada deploy.
app.use(express.static(distPath, {
  maxAge: '30d',
  etag: false,
  index: false // Don't auto-serve index.html for /
}));

// SPA fallback - only for non-file requests
app.get('*', (req, res) => {
  // If request looks like a file (has extension), return 404
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('File not found');
  }
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Largô Admin running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});
