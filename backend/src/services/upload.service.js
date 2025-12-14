const cloudinary = require('cloudinary').v2;
const imageProcessing = require('./image-processing.service');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Serviço de upload de imagens
 * Processa e faz upload para Cloudinary
 */
class UploadService {
  /**
   * Faz upload de uma imagem processada
   * @param {Buffer} imageBuffer
   * @param {Object} options
   * @returns {Object} URLs das imagens
   */
  async uploadImage(imageBuffer, options = {}) {
    try {
      const {
        folder = 'brecho/pecas',
        publicId = null,
        removeBackground = false
      } = options;

      // Validar imagem
      const isValid = await imageProcessing.validateImage(imageBuffer);
      if (!isValid) {
        throw new Error('Imagem inválida');
      }

      // Detectar blur
      const blurCheck = await imageProcessing.detectBlur(imageBuffer);
      if (blurCheck.isBlurry) {
        console.warn('Aviso: Imagem pode estar borrada');
      }

      // Processar imagem
      const processed = await imageProcessing.processImage(imageBuffer, {
        removeBackground,
        enhanceColors: true,
        autoRotate: true
      });

      // Upload para Cloudinary
      const uploadPromises = [];

      // Upload de cada tamanho
      for (const [sizeName, buffer] of Object.entries(processed.images)) {
        const format = sizeName.endsWith('_webp') ? 'webp' : 'jpeg';
        const sizeLabel = sizeName.replace('_webp', '').replace('_jpeg', '');

        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `${folder}/${sizeLabel}`,
              public_id: publicId,
              format: format,
              resource_type: 'image',
              overwrite: true
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({ size: sizeName, url: result.secure_url, publicId: result.public_id });
            }
          );

          uploadStream.end(buffer);
        });

        uploadPromises.push(uploadPromise);
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Organizar URLs por tamanho
      const urls = {
        original: {
          webp: uploadResults.find(r => r.size === 'original_webp')?.url,
          jpeg: uploadResults.find(r => r.size === 'original_jpeg')?.url
        },
        large: {
          webp: uploadResults.find(r => r.size === 'large_webp')?.url,
          jpeg: uploadResults.find(r => r.size === 'large_jpeg')?.url
        },
        medium: {
          webp: uploadResults.find(r => r.size === 'medium_webp')?.url,
          jpeg: uploadResults.find(r => r.size === 'medium_jpeg')?.url
        },
        thumb: {
          webp: uploadResults.find(r => r.size === 'thumb_webp')?.url,
          jpeg: uploadResults.find(r => r.size === 'thumb_jpeg')?.url
        }
      };

      return {
        success: true,
        urls,
        metadata: processed.metadata,
        blurCheck
      };

    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }

  /**
   * Faz upload de múltiplas imagens
   * @param {Array} imageBuffers
   * @param {Object} options
   * @returns {Array} Array de URLs
   */
  async uploadMultipleImages(imageBuffers, options = {}) {
    const results = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`Uploading imagem ${i + 1}/${imageBuffers.length}...`);

      const result = await this.uploadImage(imageBuffers[i], {
        ...options,
        publicId: options.publicId ? `${options.publicId}_${i}` : null
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Deleta uma imagem do Cloudinary
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  /**
   * Deleta múltiplas imagens
   * @param {Array} publicIds
   */
  async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      console.error('Erro ao deletar imagens:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de uso do Cloudinary
   */
  async getUsageStats() {
    try {
      const result = await cloudinary.api.usage();
      return {
        used: result.transformations.used,
        limit: result.transformations.limit,
        percentage: (result.transformations.used / result.transformations.limit * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

module.exports = new UploadService();
