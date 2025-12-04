/**
 * Sistema de manejo de errores para Express
 * Adaptado del sistema TypeScript existente en utils/
 *
 * Arquitectura:
 * - AppError: Clase base abstracta (simulada en JS)
 * - Subclases específicas para cada tipo de error
 * - Interfaz consistente con AppErrorInterface
 */

/**
 * Clase base para todos los errores de la aplicación
 * Simula una clase abstracta usando la convención de lanzar error en constructor
 */
export class AppError extends Error {
  constructor(code, technicalMessage, statusCode = 500, priority = 'high') {
    super(technicalMessage)

    // Propiedades requeridas por AppErrorInterface
    this.code = code
    this.statusCode = statusCode
    this.priority = priority
    this.timestamp = Date.now()
    this.id = `${code.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`

    // Configuración de Error
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Obtiene el mensaje para mostrar al usuario
   * Debe ser sobreescrito por las subclases
   */
  getUserMessage() {
    return 'Ocurrió un error. Por favor intenta de nuevo.'
  }

  /**
   * Serializa el error para respuestas HTTP
   * Compatible con AppErrorInterface
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      technicalMessage: this.message,
      userMessage: this.getUserMessage(),
      priority: this.priority,
      timestamp: this.timestamp,
      ...(this.metadata && { metadata: this.metadata })
    }
  }
}

/**
 * Error de validación (datos inválidos del cliente)
 * HTTP 400 - Bad Request
 */
export class ValidationError extends AppError {
  constructor(message, metadata = {}) {
    super('VALIDATION_ERROR', message, 400, 'medium')
    this.metadata = metadata
  }

  getUserMessage() {
    return 'Por favor corrige los errores en el formulario'
  }
}

/**
 * Error de autenticación (credenciales inválidas, sin token)
 * HTTP 401 - Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message = 'No autorizado') {
    super('AUTHENTICATION_ERROR', message, 401, 'high')
  }

  getUserMessage() {
    return 'Debes iniciar sesión para continuar'
  }
}

/**
 * Error de autorización (usuario autenticado pero sin permisos)
 * HTTP 403 - Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Acceso denegado') {
    super('AUTHORIZATION_ERROR', message, 403, 'high')
  }

  getUserMessage() {
    return 'No tienes permisos para realizar esta acción'
  }
}

/**
 * Error de recurso no encontrado
 * HTTP 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super('NOT_FOUND', `${resource} no encontrado`, 404, 'low')
    this.resource = resource
    this.metadata = { resource }
  }

  getUserMessage() {
    return `${this.resource} no encontrado`
  }
}

/**
 * Error de conflicto (ej: email ya registrado)
 * HTTP 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor(message, resource = 'Recurso') {
    super('CONFLICT_ERROR', message, 409, 'medium')
    this.resource = resource
    this.metadata = { resource }
  }

  getUserMessage() {
    return this.message
  }
}

/**
 * Error de base de datos
 * HTTP 500 - Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super('DATABASE_ERROR', message, 500, 'critical')
    this.originalError = originalError

    if (originalError) {
      this.metadata = {
        errorName: originalError.name,
        errorCode: originalError.code
      }
    }
  }

  getUserMessage() {
    return 'Error al procesar la solicitud. Intenta de nuevo más tarde.'
  }
}

/**
 * Error de red/conexión externa
 * HTTP 503 - Service Unavailable
 */
export class NetworkError extends AppError {
  constructor(message, isRetryable = true) {
    super('NETWORK_ERROR', message, 503, 'high')
    this.isRetryable = isRetryable
    this.metadata = { isRetryable }
  }

  getUserMessage() {
    return 'Error de conexión. Por favor verifica tu internet e intenta de nuevo.'
  }
}

/**
 * Error de límite de tasa (rate limiting)
 * HTTP 429 - Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes', retryAfter = 60) {
    super('RATE_LIMIT_ERROR', message, 429, 'medium')
    this.retryAfter = retryAfter
    this.metadata = { retryAfter }
  }

  getUserMessage() {
    return 'Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.'
  }
}

/**
 * Error interno del servidor (fallback)
 * HTTP 500 - Internal Server Error
 */
export class InternalError extends AppError {
  constructor(message = 'Error interno del servidor', originalError = null) {
    super('INTERNAL_ERROR', message, 500, 'critical')
    this.originalError = originalError

    if (originalError && originalError.stack) {
      this.metadata = {
        stack: originalError.stack
      }
    }
  }

  getUserMessage() {
    return 'Ocurrió un error inesperado. Estamos trabajando para solucionarlo.'
  }
}
