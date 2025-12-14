const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Serviço de processamento de imagens
 * Processa fotos de peças do brechó:
 * - Redimensiona
 * - Ajusta iluminação e cores
 * - Remove fundo (opcional, requer IA)
 * - Gera múltiplos tamanhos
 * - Comprime para web
 */
class ImageProcessingService {
  constructor() {
    this.sizes = {
      original: { width: 1200, height: 1600, quality: 90 },
      large: { width: 800, height: 1066, quality: 85 },
      medium: { width: 400, height: 533, quality: 80 },
      thumb: { width: 150, height: 200, quality: 75 }
    };
  }

  /**
   * Processa uma imagem completa
   * @param {Buffer|string} inputImage - Buffer ou caminho da imagem
   * @param {Object} options - Opções de processamento
   * @returns {Object} Objeto com buffers de cada tamanho
   */
  async processImage(inputImage, options = {}) {
    try {
      const {
        removeBackground = false,
        enhanceColors = true,
        autoRotate = true
      } = options;

      // Carregar imagem
      let image = sharp(inputImage);

      // Auto-rotacionar baseado em EXIF
      if (autoRotate) {
        image = image.rotate();
      }

      // Obter metadados
      const metadata = await image.metadata();
      console.log('Imagem carregada:', metadata.width, 'x', metadata.height);

      // Remover fundo (placeholder - requer TensorFlow.js)
      if (removeBackground) {
        // TODO: Implementar remoção de fundo com IA
        console.log('Remoção de fundo ainda não implementada');
      }

      // Melhorar cores e iluminação
      if (enhanceColors) {
        image = image
          .normalise() // Normaliza iluminação
          .sharpen() // Aumenta nitidez
          .modulate({
            brightness: 1.05, // Aumenta brilho em 5%
            saturation: 1.1   // Aumenta saturação em 10%
          });
      }

      // Gerar múltiplos tamanhos
      const processed = {};

      for (const [sizeName, sizeConfig] of Object.entries(this.sizes)) {
        const resized = image.clone()
          .resize(sizeConfig.width, sizeConfig.height, {
            fit: 'cover',
            position: 'center'
          });

        // Gerar WebP (melhor compressão)
        processed[`${sizeName}_webp`] = await resized
          .webp({ quality: sizeConfig.quality })
          .toBuffer();

        // Gerar JPEG (fallback)
        processed[`${sizeName}_jpeg`] = await resized
          .jpeg({ quality: sizeConfig.quality, mozjpeg: true })
          .toBuffer();
      }

      return {
        success: true,
        images: processed,
        metadata: {
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          format: metadata.format
        }
      };

    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      throw new Error(`Erro no processamento: ${error.message}`);
    }
  }

  /**
   * Processa múltiplas imagens
   * @param {Array} images - Array de buffers ou caminhos
   * @param {Object} options - Opções de processamento
   * @returns {Array} Array de objetos processados
   */
  async processMultipleImages(images, options = {}) {
    const results = [];

    for (let i = 0; i < images.length; i++) {
      console.log(`Processando imagem ${i + 1}/${images.length}...`);
      const result = await this.processImage(images[i], options);
      results.push(result);
    }

    return results;
  }

  /**
   * Remove fundo da imagem usando IA
   * (Placeholder - requer @tensorflow/tfjs-node e @tensorflow-models/body-pix)
   * @param {Buffer} imageBuffer
   */
  async removeBackground(imageBuffer) {
    try {
      // TODO: Implementar com TensorFlow.js
      /*
      const tf = require('@tensorflow/tfjs-node');
      const bodyPix = require('@tensorflow-models/body-pix');

      // Carregar modelo
      const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });

      // Processar imagem
      const image = await this.loadImageTensor(imageBuffer);
      const segmentation = await net.segmentPerson(image);

      // Aplicar máscara
      const foregroundColor = {r: 0, g: 0, b: 0, a: 0};
      const backgroundColor = {r: 255, g: 255, b: 255, a: 255};

      const backgroundMask = bodyPix.toMask(
        segmentation,
        foregroundColor,
        backgroundColor
      );

      return backgroundMask;
      */

      console.log('Remoção de fundo com IA não implementada ainda');
      return imageBuffer;

    } catch (error) {
      console.error('Erro ao remover fundo:', error);
      throw error;
    }
  }

  /**
   * Adiciona marca d'água (opcional)
   * @param {Buffer} imageBuffer
   * @param {string} watermarkText
   */
  async addWatermark(imageBuffer, watermarkText = 'Brechó Chique') {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Criar SVG com texto
      const svgWatermark = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <text
            x="50%"
            y="95%"
            font-family="Arial"
            font-size="20"
            fill="rgba(255, 255, 255, 0.5)"
            text-anchor="middle"
          >${watermarkText}</text>
        </svg>
      `;

      const watermarked = await image
        .composite([{
          input: Buffer.from(svgWatermark),
          gravity: 'southeast'
        }])
        .toBuffer();

      return watermarked;

    } catch (error) {
      console.error('Erro ao adicionar marca d\'água:', error);
      throw error;
    }
  }

  /**
   * Valida se o arquivo é uma imagem válida
   * @param {Buffer} imageBuffer
   * @returns {boolean}
   */
  async validateImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Verificar formato
      const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!validFormats.includes(metadata.format)) {
        throw new Error('Formato de imagem inválido');
      }

      // Verificar dimensões mínimas
      if (metadata.width < 300 || metadata.height < 400) {
        throw new Error('Imagem muito pequena. Mínimo: 300x400px');
      }

      // Verificar dimensões máximas
      if (metadata.width > 5000 || metadata.height > 5000) {
        throw new Error('Imagem muito grande. Máximo: 5000x5000px');
      }

      return true;

    } catch (error) {
      console.error('Erro na validação da imagem:', error);
      return false;
    }
  }

  /**
   * Otimiza imagem para web
   * @param {Buffer} imageBuffer
   * @param {number} maxWidth
   * @returns {Buffer}
   */
  async optimizeForWeb(imageBuffer, maxWidth = 1200) {
    try {
      const optimized = await sharp(imageBuffer)
        .resize(maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 85,
          mozjpeg: true
        })
        .toBuffer();

      return optimized;

    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
      throw error;
    }
  }

  /**
   * Detecta se a imagem está borrada (baixa qualidade)
   * @param {Buffer} imageBuffer
   * @returns {Object} { isBlurry: boolean, score: number }
   */
  async detectBlur(imageBuffer) {
    try {
      const { info } = await sharp(imageBuffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calcular variância de Laplacian (métrica de blur)
      // Valores baixos = borrado, valores altos = nítido
      // Isso é uma simplificação - IA seria mais precisa

      const stats = await sharp(imageBuffer).stats();
      const sharpnessScore = stats.channels[0].stdev;

      return {
        isBlurry: sharpnessScore < 20,
        score: sharpnessScore,
        recommendation: sharpnessScore < 20
          ? 'Imagem borrada. Tente tirar novamente com boa iluminação.'
          : 'Qualidade OK'
      };

    } catch (error) {
      console.error('Erro ao detectar blur:', error);
      return { isBlurry: false, score: 0 };
    }
  }
}

module.exports = new ImageProcessingService();
