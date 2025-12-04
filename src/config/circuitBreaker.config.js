/**
 * Circuit Breaker Configuration
 * Configuración centralizada para todos los circuit breakers
 */

/**
 * Configuración para Cloudinary Service
 */
export const cloudinaryConfig = {
  upload: {
    name: 'Cloudinary:Upload',
    failureThreshold: 3,      // Abrir después de 3 fallos consecutivos
    resetTimeout: 120000,     // Intentar recuperar después de 2 minutos
    successThreshold: 2,      // Cerrar después de 2 éxitos en HALF_OPEN
    timeout: 60000,           // Timeout base de 60 segundos
    dynamicTimeout: true,     // Habilitar timeout dinámico según tamaño
    timeoutPerMB: 10000      // +10s por cada MB
  },
  delete: {
    name: 'Cloudinary:Delete',
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 15000
  },
  fetch: {
    name: 'Cloudinary:Fetch',
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 10000
  }
};

/**
 * Configuración para servicios HTTP externos genéricos
 */
export const httpServiceConfig = {
  name: 'HTTP:External',
  failureThreshold: 5,
  resetTimeout: 60000,
  successThreshold: 2,
  timeout: 30000
};

/**
 * Configuración para bases de datos
 */
export const databaseConfig = {
  name: 'Database:MongoDB',
  failureThreshold: 10,
  resetTimeout: 30000,
  successThreshold: 3,
  timeout: 5000
};

/**
 * Configuración para servicios de email
 */
export const emailServiceConfig = {
  name: 'Email:Service',
  failureThreshold: 3,
  resetTimeout: 180000,     // 3 minutos
  successThreshold: 2,
  timeout: 20000
};

/**
 * Configuración para servicios de pago
 */
export const paymentServiceConfig = {
  name: 'Payment:Gateway',
  failureThreshold: 2,      // Muy bajo threshold para pagos
  resetTimeout: 300000,     // 5 minutos
  successThreshold: 3,      // Alto threshold para recuperación
  timeout: 45000
};

/**
 * Helper para calcular timeout dinámico basado en tamaño de archivo
 *
 * @param {number} fileSizeInBytes - Tamaño del archivo en bytes
 * @param {Object} config - Configuración del circuit breaker
 * @returns {number} Timeout calculado en ms
 */
export function calculateDynamicTimeout(fileSizeInBytes, config) {
  if (!config.dynamicTimeout) {
    return config.timeout;
  }

  const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
  const additionalTimeout = Math.ceil(fileSizeInMB) * config.timeoutPerMB;
  const totalTimeout = config.timeout + additionalTimeout;

  // Cap máximo de 5 minutos
  const maxTimeout = 300000;

  return Math.min(totalTimeout, maxTimeout);
}

/**
 * Thresholds recomendados según tipo de servicio
 */
export const recommendedThresholds = {
  // Servicios críticos (pagos, auth)
  critical: {
    failureThreshold: 2,
    resetTimeout: 300000,    // 5 minutos
    successThreshold: 3
  },

  // Servicios importantes (uploads, email)
  important: {
    failureThreshold: 3,
    resetTimeout: 120000,    // 2 minutos
    successThreshold: 2
  },

  // Servicios normales (HTTP externos)
  normal: {
    failureThreshold: 5,
    resetTimeout: 60000,     // 1 minuto
    successThreshold: 2
  },

  // Servicios tolerantes (caching, analytics)
  tolerant: {
    failureThreshold: 10,
    resetTimeout: 30000,     // 30 segundos
    successThreshold: 1
  }
};

/**
 * Estrategias de fallback según tipo de operación
 */
export const fallbackStrategies = {
  upload: {
    // En caso de fallo de upload, se puede:
    // 1. Guardar en disco temporal
    // 2. Encolar para retry posterior
    // 3. Usar servicio alternativo
    strategy: 'queue-for-retry',
    retryDelay: 300000,      // 5 minutos
    maxRetries: 3
  },

  fetch: {
    // En caso de fallo de fetch, se puede:
    // 1. Usar cache
    // 2. Retornar placeholder
    // 3. Retornar error amigable
    strategy: 'use-cache-or-placeholder',
    cacheTimeout: 3600000    // 1 hora
  },

  delete: {
    // En caso de fallo de delete, se puede:
    // 1. Marcar para eliminación posterior
    // 2. Log para limpieza manual
    strategy: 'mark-for-cleanup',
    cleanupInterval: 86400000 // 24 horas
  }
};

/**
 * Configuración de alertas por estado
 */
export const alertConfig = {
  // Alertar cuando el circuit se abre
  onOpen: {
    enabled: true,
    severity: 'high',
    notifyChannels: ['email', 'slack'],
    message: 'Circuit breaker opened - service degraded'
  },

  // Alertar cuando el circuit permanece abierto mucho tiempo
  onExtendedOpen: {
    enabled: true,
    threshold: 600000,       // 10 minutos
    severity: 'critical',
    notifyChannels: ['email', 'slack', 'pagerduty'],
    message: 'Circuit breaker open for extended period - immediate attention required'
  },

  // Notificar cuando el circuit se recupera
  onRecovery: {
    enabled: true,
    severity: 'info',
    notifyChannels: ['slack'],
    message: 'Circuit breaker recovered - service restored'
  }
};

/**
 * Configuración de métricas y monitoring
 */
export const metricsConfig = {
  // Intervalo de reporte de métricas
  reportInterval: 60000,     // 1 minuto

  // Métricas a trackear
  metrics: [
    'totalRequests',
    'successfulRequests',
    'failedRequests',
    'rejectedRequests',
    'averageLatency',
    'errorRate',
    'uptime'
  ],

  // Agregación de métricas
  aggregation: {
    enabled: true,
    windows: [
      { duration: 60000, label: '1min' },      // 1 minuto
      { duration: 300000, label: '5min' },     // 5 minutos
      { duration: 3600000, label: '1hour' }    // 1 hora
    ]
  }
};

/**
 * Helper para obtener configuración según entorno
 *
 * @param {string} environment - Entorno (development, staging, production)
 * @returns {Object} Configuración ajustada
 */
export function getConfigForEnvironment(environment = 'development') {
  const configs = {
    development: {
      // En desarrollo, ser más tolerante
      failureThresholdMultiplier: 2,
      resetTimeoutMultiplier: 0.5,
      enableVerboseLogging: true
    },
    staging: {
      // En staging, similar a producción pero con más logging
      failureThresholdMultiplier: 1,
      resetTimeoutMultiplier: 1,
      enableVerboseLogging: true
    },
    production: {
      // En producción, configuración estricta
      failureThresholdMultiplier: 1,
      resetTimeoutMultiplier: 1,
      enableVerboseLogging: false
    }
  };

  return configs[environment] || configs.development;
}

/**
 * Helper para ajustar configuración según carga del sistema
 *
 * @param {Object} baseConfig - Configuración base
 * @param {number} systemLoad - Carga del sistema (0-1)
 * @returns {Object} Configuración ajustada
 */
export function adjustConfigForLoad(baseConfig, systemLoad) {
  // Si el sistema está bajo alta carga, ser más agresivo
  if (systemLoad > 0.8) {
    return {
      ...baseConfig,
      failureThreshold: Math.max(2, Math.floor(baseConfig.failureThreshold * 0.6)),
      timeout: Math.floor(baseConfig.timeout * 0.8)
    };
  }

  // Si el sistema está bajo baja carga, ser más tolerante
  if (systemLoad < 0.3) {
    return {
      ...baseConfig,
      failureThreshold: Math.floor(baseConfig.failureThreshold * 1.5),
      timeout: Math.floor(baseConfig.timeout * 1.2)
    };
  }

  return baseConfig;
}

export default {
  cloudinaryConfig,
  httpServiceConfig,
  databaseConfig,
  emailServiceConfig,
  paymentServiceConfig,
  recommendedThresholds,
  fallbackStrategies,
  alertConfig,
  metricsConfig,
  calculateDynamicTimeout,
  getConfigForEnvironment,
  adjustConfigForLoad
};
