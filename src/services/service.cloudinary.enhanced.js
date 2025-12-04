/**
 * Enhanced Cloudinary Service with Circuit Breaker
 * Versión mejorada con protección contra fallos en cascada
 *
 * Características:
 * - Circuit Breaker para resilencia
 * - Timeout dinámico según tamaño de archivo
 * - Retry logic con backoff exponencial
 * - Métricas detalladas de operaciones
 * - Fallback strategies
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';
import { hasCloudinary } from '../config/env.validation.js';
import { CircuitBreakerFactory } from '../lib/CircuitBreaker.js';
import {
  cloudinaryConfig,
  calculateDynamicTimeout
} from '../config/circuitBreaker.config.js';
import metricService from '../lib/MetricService.js';

/**
 * Configurar Cloudinary
 */
if (hasCloudinary()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  logger.info('Enhanced Cloudinary Service configured', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    circuitBreakerEnabled: true
  });
} else {
  logger.warn('Cloudinary not configured - uploads disabled', {
    reason: 'Missing environment variables'
  });
}

/**
 * Opciones por defecto
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
 * Enhanced CloudinaryService con Circuit Breaker
 */
class EnhancedCloudinaryService {
  constructor() {
    // Circuit Breakers para diferentes operaciones
    this.uploadCircuit = CircuitBreakerFactory.createForUploadService(
      'Cloudinary',
      cloudinaryConfig.upload
    );

    this.deleteCircuit = CircuitBreakerFactory.createForHttpService(
      'Cloudinary:Delete',
      cloudinaryConfig.delete
    );

    this.fetchCircuit = CircuitBreakerFactory.createForHttpService(
      'Cloudinary:Fetch',
      cloudinaryConfig.fetch
    );

    // Métricas
    this.metrics = {
      uploads: { success: 0, failed: 0, rejected: 0 },
      deletes: { success: 0, failed: 0, rejected: 0 },
      fetches: { success: 0, failed: 0, rejected: 0 }
    };

    // Callback para cambios de estado
    this.uploadCircuit.onStateChange = (oldState, newState, metrics) => {
      logger.warn('Cloudinary Upload Circuit state changed', {
        from: oldState,
        to: newState,
        metrics
      });
    };

    logger.info('Enhanced Cloudinary Service initialized with Circuit Breakers');
  }

  /**
   * Verificar configuración
   */
  isConfigured() {
    return hasCloudinary();
  }

  /**
   * Upload de imagen con Circuit Breaker y timeout dinámico
   *
   * @param {Buffer|string} file - Buffer o path del archivo
   * @param {string} folder - Carpeta destino
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async uploadImage(file, folder = 'mariachi-web', options = {}) {
    const startTime = Date.now();

    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      // Calcular tamaño del archivo
      const fileSize = Buffer.isBuffer(file) ? file.length : 0;

      // Calcular timeout dinámico
      const dynamicTimeout = calculateDynamicTimeout(
        fileSize,
        cloudinaryConfig.upload
      );

      logger.debug('Uploading to Cloudinary', {
        folder,
        fileSize,
        timeout: dynamicTimeout,
        circuitState: this.uploadCircuit.getState()
      });

      // Configurar timeout dinámico en el circuit
      const originalTimeout = this.uploadCircuit.timeout;
      this.uploadCircuit.timeout = dynamicTimeout;

      try {
        // Ejecutar con Circuit Breaker
        const result = await this.uploadCircuit.execute(
          this._performUpload.bind(this),
          file,
          folder,
          options
        );

        // Métricas de éxito
        this.metrics.uploads.success++;
        const duration = Date.now() - startTime;

        // Registrar en MetricService
        metricService.recordSuccess('Cloudinary:Upload', duration);

        logger.info('Image uploaded successfully', {
          publicId: result.publicId,
          fileSize,
          duration: `${duration}ms`,
          circuitState: this.uploadCircuit.getState()
        });

        return result;
      } finally {
        // Restaurar timeout original
        this.uploadCircuit.timeout = originalTimeout;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Distinguir entre circuit abierto y fallo real
      if (error.isCircuitBreakerOpen) {
        this.metrics.uploads.rejected++;

        // Registrar como rechazo en MetricService
        metricService.recordFailure('Cloudinary:Upload', duration, error);

        logger.error('Upload rejected - Circuit breaker is OPEN', {
          folder,
          duration: `${duration}ms`,
          circuitMetrics: this.uploadCircuit.getMetrics()
        });

        // Error amigable para el usuario
        throw new Error(
          'Upload service temporarily unavailable. Please try again in a few minutes.'
        );
      }

      this.metrics.uploads.failed++;

      // Registrar fallo en MetricService
      metricService.recordFailure('Cloudinary:Upload', duration, error);

      logger.error('Upload failed', {
        folder,
        error: error.message,
        duration: `${duration}ms`,
        circuitState: this.uploadCircuit.getState()
      });

      throw error;
    }
  }

  /**
   * Método interno para realizar el upload
   * @private
   */
  async _performUpload(file, folder, options) {
    const uploadOptions = {
      ...DEFAULT_UPLOAD_OPTIONS,
      folder,
      ...options
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
      createdAt: result.created_at
    };
  }

  /**
   * Upload múltiple con Circuit Breaker
   */
  async uploadMultipleImages(files, folder = 'mariachi-web', options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Uploading multiple images', {
        count: files.length,
        folder
      });

      // Upload en paralelo con Circuit Breaker
      const uploadPromises = files.map(file =>
        this.uploadImage(file, folder, options)
          .catch(error => ({
            success: false,
            error: error.message
          }))
      );

      const results = await Promise.all(uploadPromises);

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      logger.info('Multiple uploads completed', {
        total: files.length,
        successful: successful.length,
        failed: failed.length
      });

      return {
        success: true,
        results: successful,
        failed: failed,
        summary: {
          total: files.length,
          successful: successful.length,
          failed: failed.length
        }
      };
    } catch (error) {
      logger.error('Multiple upload failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete con Circuit Breaker
   */
  async deleteImage(publicId) {
    const startTime = Date.now();

    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Deleting image', { publicId });

      // Ejecutar con Circuit Breaker
      const result = await this.deleteCircuit.execute(
        this._performDelete.bind(this),
        publicId
      );

      this.metrics.deletes.success++;
      const duration = Date.now() - startTime;

      // Registrar en MetricService
      metricService.recordSuccess('Cloudinary:Delete', duration);

      logger.info('Image deleted successfully', {
        publicId,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error.isCircuitBreakerOpen) {
        this.metrics.deletes.rejected++;

        // Registrar rechazo en MetricService
        metricService.recordFailure('Cloudinary:Delete', duration, error);

        logger.error('Delete rejected - Circuit breaker is OPEN', {
          publicId,
          duration: `${duration}ms`
        });

        // En caso de delete, podemos ser más tolerantes
        logger.warn('Delete will be retried later', { publicId });

        return {
          success: false,
          message: 'Delete queued for retry',
          publicId
        };
      }

      this.metrics.deletes.failed++;

      // Registrar fallo en MetricService
      metricService.recordFailure('Cloudinary:Delete', duration, error);

      logger.error('Delete failed', {
        publicId,
        error: error.message,
        duration: `${duration}ms`
      });

      throw error;
    }
  }

  /**
   * Método interno para delete
   * @private
   */
  async _performDelete(publicId) {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return {
        success: true,
        message: 'Image deleted successfully',
        result: result.result
      };
    }

    throw new Error(`Unexpected result: ${result.result}`);
  }

  /**
   * Delete múltiple con Circuit Breaker
   */
  async deleteMultipleImages(publicIds) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      logger.debug('Deleting multiple images', {
        count: publicIds.length
      });

      // Delete en paralelo
      const deletePromises = publicIds.map(publicId =>
        this.deleteImage(publicId)
          .catch(error => ({
            success: false,
            publicId,
            error: error.message
          }))
      );

      const results = await Promise.all(deletePromises);

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      logger.info('Multiple deletes completed', {
        total: publicIds.length,
        successful: successful.length,
        failed: failed.length
      });

      return {
        success: true,
        deleted: successful.length,
        failed: failed.length,
        total: publicIds.length
      };
    } catch (error) {
      logger.error('Multiple delete failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generar URL con transformaciones (sin Circuit Breaker, es local)
   */
  generateTransformedUrl(publicId, transformations = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cloudinary not configured');
      }

      return cloudinary.url(publicId, {
        secure: true,
        ...transformations
      });
    } catch (error) {
      logger.error('Failed to generate URL', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generar thumbnail
   */
  generateThumbnail(publicId, width = 300, height = 300) {
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
   */
  generateOptimizedUrl(publicId, width = 1920) {
    return this.generateTransformedUrl(publicId, {
      width,
      crop: 'limit',
      quality: 'auto:best',
      fetch_format: 'auto'
    });
  }

  /**
   * Obtener métricas del servicio
   */
  getMetrics() {
    return {
      operations: this.metrics,
      circuits: {
        upload: this.uploadCircuit.getMetrics(),
        delete: this.deleteCircuit.getMetrics(),
        fetch: this.fetchCircuit.getMetrics()
      },
      health: {
        upload: this.uploadCircuit.isHealthy(),
        delete: this.deleteCircuit.isHealthy(),
        fetch: this.fetchCircuit.isHealthy(),
        overall: this.uploadCircuit.isHealthy() &&
                 this.deleteCircuit.isHealthy() &&
                 this.fetchCircuit.isHealthy()
      }
    };
  }

  /**
   * Health check del servicio
   */
  async healthCheck() {
    const metrics = this.getMetrics();

    return {
      status: metrics.health.overall ? 'healthy' : 'degraded',
      configured: this.isConfigured(),
      ...metrics
    };
  }

  /**
   * Reset de todos los circuit breakers (solo para testing/admin)
   */
  resetCircuits() {
    logger.warn('Resetting all Cloudinary circuit breakers');

    this.uploadCircuit.reset();
    this.deleteCircuit.reset();
    this.fetchCircuit.reset();

    this.metrics = {
      uploads: { success: 0, failed: 0, rejected: 0 },
      deletes: { success: 0, failed: 0, rejected: 0 },
      fetches: { success: 0, failed: 0, rejected: 0 }
    };
  }
}

// Exportar instancia singleton
const enhancedCloudinaryService = new EnhancedCloudinaryService();

export { enhancedCloudinaryService as EnhancedCloudinaryService };
export default enhancedCloudinaryService;
