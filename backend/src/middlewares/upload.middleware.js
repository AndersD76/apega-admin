const multer = require('multer');
const path = require('path');

// Configuração de armazenamento em memória
const storage = multer.memoryStorage();

// Filtro de arquivos - apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, WebP)'));
  }
};

// Configuração do Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por arquivo
    files: 5 // Máximo 5 arquivos por vez
  }
});

// Middleware para upload de uma única imagem
const uploadSingle = upload.single('image');

// Middleware para upload de múltiplas imagens
const uploadMultiple = upload.array('images', 5);

// Error handler para Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: true,
        message: 'Muitos arquivos. Máximo: 5 imagens'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: true,
        message: 'Campo de arquivo inesperado'
      });
    }
  }

  if (err) {
    return res.status(400).json({
      error: true,
      message: err.message
    });
  }

  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleMulterError
};
