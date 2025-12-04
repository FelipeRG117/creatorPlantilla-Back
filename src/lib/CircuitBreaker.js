/**
 * Circuit Breaker Pattern Implementation
 *
 * Protege servicios externos de fallos en cascada implementando
 * tres estados: CLOSED (normal), OPEN (bloqueado), HALF_OPEN (probando)
 *
 * Basado en patrones enterprise de resilencia y fault tolerance
 */

import { logger } from '../config/logger.js';

/**
 * Estados del Circuit Breaker
 */
export const CircuitState = {
  CLOSED: 'CLOSED',       // Operación normal, permite todas las requests
  OPEN: 'OPEN',          // Bloqueado, rechaza requests inmediatamente
  HALF_OPEN: 'HALF_OPEN' // Probando recuperación, permite requests limitadas
};

/**
 * Clase CircuitBreaker
 * Implementa el patrón Circuit Breaker para proteger servicios externos
 */
export class CircuitBreaker {
  /**
   * @param {Object} options - Opciones de configuración
   * @param {string} options.name - Nombre del circuit breaker
   * @param {number} options.failureThreshold - Número de fallos antes de abrir (default: 5)
   * @param {number} options.resetTimeout - Tiempo en ms antes de intentar recuperar (default: 60000)
   * @param {number} options.successThreshold - Éxitos necesarios en HALF_OPEN para cerrar (default: 2)
   * @param {number} options.timeout - Timeout de operación en ms (default: 30000)
   * @param {Function} options.onStateChange - Callback cuando cambia el estado
   */
  constructor(options = {}) {
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minuto
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 30000; // 30 segundos
    this.onStateChange = options.onStateChange || null;

    // Estado interno
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.resetTimer = null;

    // Métricas
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    };

    logger.info('Circuit Breaker initialized', {
      name: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      successThreshold: this.successThreshold,
      timeout: this.timeout
    });
  }

  /**
   * Ejecuta una función protegida por el circuit breaker
   *
   * @param {Function} fn - Función async a ejecutar
   * @param {any[]} args - Argumentos para la función
   * @returns {Promise<any>} Resultado de la función
   * @throws {Error} Si el circuit está abierto o la función falla
   */
  async execute(fn, ...args) {
    this.metrics.totalRequests++;

    // Verificar si el circuit está abierto
    if (this.state === CircuitState.OPEN) {
      // Verificar si es tiempo de intentar recuperar
      if (Date.now() < this.nextAttempt) {
        this.metrics.rejectedRequests++;

        logger.warn('Circuit breaker is OPEN - Request rejected', {
          name: this.name,
          nextAttempt: new Date(this.nextAttempt).toISOString(),
          metrics: this.metrics
        });

        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.isCircuitBreakerOpen = true;
        throw error;
      }

      // Intentar recuperación - cambiar a HALF_OPEN
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      // Ejecutar la función con timeout
      const result = await this.executeWithTimeout(fn, args);

      // Éxito - manejar según estado
      this.onSuccess();

      return result;
    } catch (error) {
      // Fallo - manejar según estado
      this.onFailure(error);

      throw error;
    }
  }

  /**
   * Ejecuta una función con timeout
   *
   * @private
   * @param {Function} fn - Función a ejecutar
   * @param {any[]} args - Argumentos
   * @returns {Promise<any>}
   */
  async executeWithTimeout(fn, args) {
    return Promise.race([
      fn(...args),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${this.timeout}ms`));
        }, this.timeout);
      })
    ]);
  }

  /**
   * Maneja un éxito en la ejecución
   *
   * @private
   */
  onSuccess() {
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      logger.debug('Success in HALF_OPEN state', {
        name: this.name,
        successCount: this.successCount,
        successThreshold: this.successThreshold
      });

      // Si alcanzamos el threshold de éxitos, cerrar el circuit
      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Maneja un fallo en la ejecución
   *
   * @private
   * @param {Error} error - Error ocurrido
   */
  onFailure(error) {
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = Date.now();
    this.failureCount++;

    logger.warn('Circuit breaker recorded failure', {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      error: error.message
    });

    // Si estamos en HALF_OPEN, volver a OPEN inmediatamente
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    // Si alcanzamos el threshold de fallos en CLOSED, abrir el circuit
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transiciona a un nuevo estado
   *
   * @private
   * @param {string} newState - Nuevo estado
   */
  transitionTo(newState) {
    const oldState = this.state;

    if (oldState === newState) {
      return;
    }

    this.state = newState;

    logger.info('Circuit breaker state transition', {
      name: this.name,
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      metrics: this.metrics
    });

    // Acciones según el nuevo estado
    switch (newState) {
      case CircuitState.OPEN:
        // Programar intento de recuperación
        this.nextAttempt = Date.now() + this.resetTimeout;
        this.successCount = 0;

        logger.warn('Circuit breaker OPENED', {
          name: this.name,
          nextAttemptIn: `${this.resetTimeout}ms`,
          nextAttemptAt: new Date(this.nextAttempt).toISOString()
        });

        // Programar timer para intentar HALF_OPEN
        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
        }

        this.resetTimer = setTimeout(() => {
          logger.info('Reset timeout reached - will attempt recovery on next request', {
            name: this.name
          });
        }, this.resetTimeout);

        break;

      case CircuitState.HALF_OPEN:
        this.successCount = 0;

        logger.info('Circuit breaker entering HALF_OPEN - testing recovery', {
          name: this.name,
          successThreshold: this.successThreshold
        });

        break;

      case CircuitState.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;

        logger.info('Circuit breaker CLOSED - service recovered', {
          name: this.name,
          metrics: this.metrics
        });

        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
          this.resetTimer = null;
        }

        break;
    }

    // Callback de cambio de estado
    if (this.onStateChange) {
      try {
        this.onStateChange(oldState, newState, this.metrics);
      } catch (error) {
        logger.error('Error in onStateChange callback', {
          name: this.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Fuerza la apertura del circuit
   * Útil para testing o mantenimiento
   */
  forceOpen() {
    logger.warn('Circuit breaker forced OPEN', {
      name: this.name
    });

    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Fuerza el cierre del circuit
   * Útil para testing o recuperación manual
   */
  forceClose() {
    logger.warn('Circuit breaker forced CLOSED', {
      name: this.name
    });

    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Reset completo del circuit breaker
   */
  reset() {
    logger.info('Circuit breaker reset', {
      name: this.name
    });

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }

    // Reset metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    };
  }

  /**
   * Obtiene el estado actual
   *
   * @returns {string} Estado actual
   */
  getState() {
    return this.state;
  }

  /**
   * Obtiene las métricas actuales
   *
   * @returns {Object} Métricas
   */
  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      isOpen: this.state === CircuitState.OPEN,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt).toISOString() : null
    };
  }

  /**
   * Verifica si el circuit está sano
   *
   * @returns {boolean} True si está en CLOSED
   */
  isHealthy() {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Calcula la tasa de éxito
   *
   * @returns {number} Porcentaje de éxito (0-100)
   */
  getSuccessRate() {
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;

    if (total === 0) {
      return 100;
    }

    return (this.metrics.successfulRequests / total) * 100;
  }

  /**
   * Destructor - limpia recursos
   */
  destroy() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }

    logger.info('Circuit breaker destroyed', {
      name: this.name,
      finalMetrics: this.getMetrics()
    });
  }
}

/**
 * Factory para crear circuit breakers con configuración predefinida
 */
export class CircuitBreakerFactory {
  /**
   * Crea un circuit breaker para servicios HTTP externos
   *
   * @param {string} serviceName - Nombre del servicio
   * @param {Object} options - Opciones adicionales
   * @returns {CircuitBreaker}
   */
  static createForHttpService(serviceName, options = {}) {
    return new CircuitBreaker({
      name: `HTTP:${serviceName}`,
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      timeout: 30000,
      ...options
    });
  }

  /**
   * Crea un circuit breaker para servicios de upload
   *
   * @param {string} serviceName - Nombre del servicio
   * @param {Object} options - Opciones adicionales
   * @returns {CircuitBreaker}
   */
  static createForUploadService(serviceName, options = {}) {
    return new CircuitBreaker({
      name: `Upload:${serviceName}`,
      failureThreshold: 3,
      resetTimeout: 120000, // 2 minutos
      successThreshold: 2,
      timeout: 60000, // 1 minuto para uploads
      ...options
    });
  }

  /**
   * Crea un circuit breaker para bases de datos
   *
   * @param {string} serviceName - Nombre del servicio
   * @param {Object} options - Opciones adicionales
   * @returns {CircuitBreaker}
   */
  static createForDatabase(serviceName, options = {}) {
    return new CircuitBreaker({
      name: `DB:${serviceName}`,
      failureThreshold: 10,
      resetTimeout: 30000,
      successThreshold: 3,
      timeout: 5000,
      ...options
    });
  }
}

export default CircuitBreaker;
