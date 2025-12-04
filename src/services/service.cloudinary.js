/**
 * Cloudinary Service
 * Servicio enterprise para manejo de imágenes en Cloudinary CDN
 *
 * Funcionalidades:
 * - Upload de imágenes (single/multiple)
 * - Delete de imágenes
 * - Transformaciones (resize, crop, format)
 * - Optimización automática
 * - Generación de URLs seguras
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';
import { hasCloudinary } from '../config/env.validation.js';

/**
 * Configurar Cloudinary
 * Se ejecuta al importar el servicio
 */
if (hasCloudinary()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  logger.info('Cloudinary configured successfully', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
} else {
  logger.warn('Cloudinary not configured - image uploads will be disabled', {
    reason: 'Missing environment variables'
  });
}

/**
 * Opciones por defecto para uploads
 */
const DEFAULT_UPLOAD_OPTIONS = {
  folder: 'mariachi-web',
  resource_type: 'auto',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  transformation: [
    { quality: 'auto:good' },
    { fetch_format: 'auto' }
  ]
};

/**
 * CloudinaryService Class
 * Servicio para manejo de imágenes en Cloudinary
 */
class CloudinaryService {
  /**
   * Verificar si Cloudinary está configurado
   */
  static isConfigured() {
    return hasCloudinary();
  }

  /**
   * Upload de una imagen
   * @param {Buffer|string} file - Buffer del archivo o path local
   * @param {Object} options - Opciones de upload
   * @returns {Promise<Object>} - Datos de la imagen subida
   */
  static async uploadImage(file, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      const uploadOptions = {
        ...DEFAULT_UPLOAD_OPTIONS,
        ...options
      };

      logger.debug('Uploading image to Cloudinary', {
        folder: uploadOptions.folder,
        hasTransformations: !!uploadOptions.transformation
      });

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      logger.info('Image uploaded successfully', {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes
      });

      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resourceType: result.resource_type,
          createdAt: result.created_at
        }
      };
    } catch (error) {
      logger.error('Failed to upload image to Cloudinary', {
        error: error.message,
        stack: error.stack
      });

      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Upload de múltiples imágenes
   * @param {Array<Buffer|string>} files - Array de archivos
   * @param {Object} options - Opciones de upload
   * @returns {Promise<Array>} - Array con datos de las imágenes subidas
   */
  static async uploadMultipleImages(files, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Uploading multiple images to Cloudinary', {
        count: files.length
      });

      const uploadPromises = files.map(file => this.uploadImage(file, options));
      const results = await Promise.all(uploadPromises);

      logger.info('Multiple images uploaded successfully', {
        count: results.length
      });

      return {
        success: true,
        data: results.map(r => r.data)
      };
    } catch (error) {
      logger.error('Failed to upload multiple images', {
        error: error.message
      });

      throw new Error(`Cloudinary multiple upload failed: ${error.message}`);
    }
  }

  /**
   * Eliminar una imagen
   * @param {string} publicId - Public ID de la imagen en Cloudinary
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  static async deleteImage(publicId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Deleting image from Cloudinary', { publicId });

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok' || result.result === 'not found') {
        logger.info('Image deleted successfully', {
          publicId,
          result: result.result
        });

        return {
          success: true,
          message: 'Image deleted successfully',
          result: result.result
        };
      } else {
        throw new Error(`Unexpected result: ${result.result}`);
      }
    } catch (error) {
      logger.error('Failed to delete image from Cloudinary', {
        publicId,
        error: error.message
      });

      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  /**
   * Eliminar múltiples imágenes
   * @param {Array<string>} publicIds - Array de public IDs
   * @returns {Promise<Object>} - Resultado de las eliminaciones
   */
  static async deleteMultipleImages(publicIds) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Deleting multiple images from Cloudinary', {
        count: publicIds.length
      });

      const result = await cloudinary.api.delete_resources(publicIds);

      const deleted = Object.keys(result.deleted).filter(
        key => result.deleted[key] === 'deleted'
      );

      logger.info('Multiple images deleted successfully', {
        requested: publicIds.length,
        deleted: deleted.length
      });

      return {
        success: true,
        message: 'Images deleted successfully',
        deleted: deleted.length,
        total: publicIds.length,
        details: result.deleted
      };
    } catch (error) {
      logger.error('Failed to delete multiple images', {
        error: error.message
      });

      throw new Error(`Cloudinary multiple delete failed: ${error.message}`);
    }
  }

  /**
   * Generar URL con transformaciones
   * @param {string} publicId - Public ID de la imagen
   * @param {Object} transformations - Transformaciones a aplicar
   * @returns {string} - URL transformada
   */
  static generateTransformedUrl(publicId, transformations = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      const url = cloudinary.url(publicId, {
        secure: true,
        ...transformations
      });

      logger.debug('Generated transformed URL', {
        publicId,
        transformations
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate transformed URL', {
        publicId,
        error: error.message
      });

      throw new Error(`URL generation failed: ${error.message}`);
    }
  }

  /**
   * Generar thumbnail
   * @param {string} publicId - Public ID de la imagen
   * @param {number} width - Ancho del thumbnail
   * @param {number} height - Alto del thumbnail
   * @returns {string} - URL del thumbnail
   */
  static generateThumbnail(publicId, width = 300, height = 300) {
    return this.generateTransformedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }

  /**
   * Generar URL optimizada
   * @param {string} publicId - Public ID de la imagen
   * @param {number} width - Ancho máximo
   * @returns {string} - URL optimizada
   */
  static generateOptimizedUrl(publicId, width = 1920) {
    return this.generateTransformedUrl(publicId, {
      width,
      crop: 'limit',
      quality: 'auto:best',
      fetch_format: 'auto'
    });
  }

  /**
   * Obtener detalles de una imagen
   * @param {string} publicId - Public ID de la imagen
   * @returns {Promise<Object>} - Detalles de la imagen
   */
  static async getImageDetails(publicId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Fetching image details from Cloudinary', { publicId });

      const result = await cloudinary.api.resource(publicId);

      logger.info('Image details retrieved successfully', {
        publicId,
        format: result.format,
        size: result.bytes
      });

      return {
        success: true,
        data: {
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          url: result.secure_url,
          createdAt: result.created_at,
          resourceType: result.resource_type
        }
      };
    } catch (error) {
      logger.error('Failed to get image details', {
        publicId,
        error: error.message
      });

      throw new Error(`Failed to get image details: ${error.message}`);
    }
  }

  /**
   * Verificar si una imagen existe
   * @param {string} publicId - Public ID de la imagen
   * @returns {Promise<boolean>} - True si existe
   */
  static async imageExists(publicId) {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      await cloudinary.api.resource(publicId);
      return true;
    } catch (error) {
      if (error.error && error.error.http_code === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Upload desde URL
   * @param {string} url - URL de la imagen
   * @param {Object} options - Opciones de upload
   * @returns {Promise<Object>} - Datos de la imagen subida
   */
  static async uploadFromUrl(url, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Uploading image from URL to Cloudinary', { url });

      return await this.uploadImage(url, options);
    } catch (error) {
      logger.error('Failed to upload image from URL', {
        url,
        error: error.message
      });

      throw new Error(`URL upload failed: ${error.message}`);
    }
  }

  /**
   * Extraer public_id de una URL de Cloudinary
   * @param {string} url - URL de Cloudinary
   * @returns {string|null} - Public ID extraído
   */
  static extractPublicIdFromUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Patrón para URLs de Cloudinary
      const patterns = [
        /\/v\d+\/(.+)\.\w+$/,  // /v1234567890/folder/image.jpg
        /\/upload\/(?:v\d+\/)?(.+)\.\w+$/  // /upload/v1234567890/folder/image.jpg
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      logger.warn('Could not extract public ID from URL', { url });
      return null;
    } catch (error) {
      logger.error('Error extracting public ID from URL', {
        url,
        error: error.message
      });
      return null;
    }
  }
}

export default CloudinaryService;
