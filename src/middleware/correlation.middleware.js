/**
 * Correlation ID Middleware
 * Tracking de requests a través de todo el sistema
 */

import crypto from 'crypto';
import { logger } from '../config/logger.js';

/**
 * Correlation ID Middleware
 * Genera o extrae un correlation ID único para cada request
 * Permite hacer tracing de requests a través de microservicios
 */
export const correlationMiddleware = (req, res, next) => {
  // Intentar obtener correlation ID de headers
  const correlationId =
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    generateCorrelationId();

  // Agregar correlation ID al request
  req.correlationId = correlationId;

  // Agregar correlation ID al response header
  res.setHeader('X-Correlation-ID', correlationId);

  // Log del inicio del request
  logger.http('Request received', {
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 100)
  });

  // Capturar el tiempo de inicio
  req.startTime = performance.now();

  // Hook para loguear cuando la respuesta se envía
  res.on('finish', () => {
    const duration = performance.now() - req.startTime;

    logger.http('Request completed', {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
};

/**
 * Generar un correlation ID único
 * Formato: 16 caracteres hexadecimales
 */
function generateCorrelationId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Request ID Middleware (alias de correlationMiddleware)
 * Algunos sistemas prefieren "request ID" en lugar de "correlation ID"
 */
export const requestIdMiddleware = correlationMiddleware;

/**
 * Helper para obtener correlation ID del request
 */
export const getCorrelationId = (req) => {
  return req.correlationId || 'unknown';
};

/**
 * Helper para crear un child correlation ID
 * Útil para operaciones async o llamadas a servicios externos
 */
export const createChildCorrelationId = (parentId) => {
  return `${parentId}-${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Middleware para validar formato de correlation ID
 * Útil en arquitecturas de microservicios
 */
export const validateCorrelationId = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'];

  if (correlationId) {
    // Validar formato (debe ser hexadecimal)
    if (!/^[0-9a-f]+$/.test(correlationId)) {
      logger.warn('Invalid correlation ID format received', {
        correlationId,
        ip: req.ip
      });

      // Generar uno nuevo válido
      req.correlationId = generateCorrelationId();
    } else {
      req.correlationId = correlationId;
    }
  } else {
    req.correlationId = generateCorrelationId();
  }

  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

/**
 * Contexto de logging para usar en toda la aplicación
 */
export const createLogContext = (req, additionalContext = {}) => {
  return {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ...additionalContext
  };
};

export default {
  correlationMiddleware,
  requestIdMiddleware,
  getCorrelationId,
  createChildCorrelationId,
  validateCorrelationId,
  createLogContext
};
