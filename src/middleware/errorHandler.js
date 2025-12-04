/**
 * Middleware de manejo de errores para Express
 * Inspirado en el sistema normalizeError de utils/normalizeError.ts
 *
 * Este middleware:
 * 1. Captura todos los errores de la aplicación
 * 2. Los normaliza a formato AppErrorInterface
 * 3. Envía respuestas HTTP consistentes
 * 4. Logea información relevante
 */

import { AppError, InternalError, NotFoundError, DatabaseError } from '../errors/AppError.js'
import { ZodError } from 'zod'

/**
 * Normaliza cualquier tipo de error a formato AppErrorInterface
 * Adaptado de utils/normalizeError.ts
 *
 * @param {unknown} rawError - Error de cualquier tipo
 * @returns {Object} Error normalizado con formato AppErrorInterface
 */
export const normalizeError = (rawError) => {
  // Solo log en modo no-test
  if (process.env.NODE_ENV !== 'test') {
    console.error('🔴 Error capturado:', rawError)
  }

  // 1. Si ya es un AppError, lo retorna directamente (con serialización)
  if (rawError instanceof AppError) {
    return {
      ...rawError.toJSON(),
      // Regenerar ID si es necesario para tracking único
      id: `${rawError.code.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
  }

  // 2. Manejo de errores Zod (Validación)
  if (rawError instanceof ZodError) {
    return {
      id: `zod-${Date.now()}`,
      code: 'VALIDATION_ERROR',
      technicalMessage: 'Validation failed',
      userMessage: 'Por favor corrige los errores en el formulario',
      priority: 'medium',
      timestamp: Date.now(),
      metadata: {
        issues: rawError.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    }
  }

  // 3. Errores de MongoDB/Mongoose
  if (rawError.name === 'MongoError' ||
      rawError.name === 'MongooseError' ||
      rawError.name === 'CastError' ||
      rawError.name === 'ValidationError') {
    return {
      id: `db-${Date.now()}`,
      code: 'DATABASE_ERROR',
      technicalMessage: rawError.message,
      userMessage: 'Error al procesar la solicitud. Intenta de nuevo más tarde.',
      priority: 'critical',
      timestamp: Date.now(),
      metadata: {
        errorName: rawError.name,
        errorCode: rawError.code
      }
    }
  }

  // 4. Errores de red (TypeError nativo con fetch)
  if (rawError instanceof TypeError && rawError.message.includes('fetch')) {
    return {
      id: `net-${Date.now()}`,
      code: 'NETWORK_ERROR',
      technicalMessage: rawError.message,
      userMessage: 'Error de conexión. Verifica tu internet.',
      priority: 'high',
      timestamp: Date.now(),
      metadata: {
        isRetryable: true
      }
    }
  }

  // 5. Errores nativos genéricos
  if (rawError instanceof Error) {
    return {
      id: `err-${Date.now()}`,
      code: 'INTERNAL_ERROR',
      technicalMessage: rawError.message,
      userMessage: 'Ocurrió un error inesperado',
      priority: 'critical',
      timestamp: Date.now(),
      metadata: {
        errorName: rawError.name,
        ...(process.env.NODE_ENV === 'development' && { stack: rawError.stack })
      }
    }
  }

  // 6. Fallback para errores completamente desconocidos
  return {
    id: `unk-${Date.now()}`,
    code: 'UNKNOWN_ERROR',
    technicalMessage: 'Unknown error occurred',
    userMessage: 'Error desconocido',
    priority: 'critical',
    timestamp: Date.now(),
    metadata: {
      rawError: String(rawError)
    }
  }
}

/**
 * Obtiene el código de estado HTTP basado en el código de error
 *
 * @param {string} errorCode - Código de error (ej: 'VALIDATION_ERROR')
 * @returns {number} Código HTTP
 */
const getStatusCode = (errorCode) => {
  const statusMap = {
    VALIDATION_ERROR: 400,
    AUTHENTICATION_ERROR: 401,
    AUTHORIZATION_ERROR: 403,
    NOT_FOUND: 404,
    CONFLICT_ERROR: 409,
    RATE_LIMIT_ERROR: 429,
    DATABASE_ERROR: 500,
    INTERNAL_ERROR: 500,
    NETWORK_ERROR: 503,
    UNKNOWN_ERROR: 500
  }

  return statusMap[errorCode] || 500
}

/**
 * Middleware principal de manejo de errores
 * DEBE IR AL FINAL de todos los middlewares y rutas en app.js
 *
 * @param {Error} err - Error capturado
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next function
 */
export const errorHandler = (err, req, res, next) => {
  // Normalizar el error
  const normalizedError = normalizeError(err)

  // Obtener status code
  const statusCode = err.statusCode || getStatusCode(normalizedError.code)

  // Log detallado en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔴 ERROR DETAILS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 Endpoint:', req.method, req.originalUrl)
    console.log('🆔 Error ID:', normalizedError.id)
    console.log('📝 Code:', normalizedError.code)
    console.log('💬 User Message:', normalizedError.userMessage)
    console.log('🔧 Technical Message:', normalizedError.technicalMessage)
    console.log('⚠️  Priority:', normalizedError.priority)
    console.log('⏰ Timestamp:', new Date(normalizedError.timestamp).toISOString())
    if (normalizedError.metadata) {
      console.log('📦 Metadata:', JSON.stringify(normalizedError.metadata, null, 2))
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }

  // Log simplificado en producción
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify({
      errorId: normalizedError.id,
      code: normalizedError.code,
      message: normalizedError.technicalMessage,
      endpoint: `${req.method} ${req.originalUrl}`,
      timestamp: normalizedError.timestamp,
      priority: normalizedError.priority
    }))
  }

  // Respuesta HTTP
  res.status(statusCode).json({
    success: false,
    error: {
      ...normalizedError,
      // Solo incluir stack trace en desarrollo
      ...(process.env.NODE_ENV === 'development' && err.stack && {
        metadata: {
          ...normalizedError.metadata,
          stack: err.stack
        }
      })
    }
  })
}

/**
 * Middleware para manejar rutas no encontradas (404)
 * DEBE IR ANTES del errorHandler en app.js
 *
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Ruta ${req.method} ${req.originalUrl}`)

  res.status(404).json({
    success: false,
    error: error.toJSON()
  })
}

/**
 * Wrapper async para manejar errores en funciones async
 * Evita tener que usar try-catch en cada controlador
 *
 * @param {Function} fn - Función async del controlador
 * @returns {Function} Función wrapped que captura errores
 *
 * @example
 * router.get('/albums', asyncHandler(async (req, res) => {
 *   const albums = await AlbumService.getAll()
 *   res.json({ success: true, data: albums })
 * }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
