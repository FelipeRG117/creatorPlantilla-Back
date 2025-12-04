/**
 * Winston Logger Configuration
 * Sistema de logging enterprise con rotación diaria
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import secretRedactor from '../lib/SecretRedaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Niveles de logging
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Colores para cada nivel
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

/**
 * Formato para logs en JSON con redacción de secretos
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;

    const logObject = {
      timestamp,
      level,
      message: secretRedactor.redactString(message), // Redactar mensaje
      service: 'mariachi-web-backend',
      environment: process.env.NODE_ENV || 'development'
    };

    // Agregar correlationId si existe
    if (correlationId) {
      logObject.correlationId = correlationId;
    }

    // Agregar metadata si existe (redactando secretos)
    if (Object.keys(meta).length > 0) {
      logObject.meta = secretRedactor.redact(meta);
    }

    return JSON.stringify(logObject);
  })
);

/**
 * Formato para consola (desarrollo) con redacción de secretos
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;

    let log = `${timestamp} [${level}]: ${secretRedactor.redactString(message)}`;

    if (correlationId) {
      log += ` | CID: ${correlationId}`;
    }

    if (Object.keys(meta).length > 0) {
      const redactedMeta = secretRedactor.redact(meta);
      log += ` | ${JSON.stringify(redactedMeta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Transports configuration
 */
const transports = [
  // Console transport (development)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  }),

  // Error logs - rotación diaria, 30 días de retención
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    maxSize: '20m',
    format: jsonFormat,
    zippedArchive: true
  }),

  // Combined logs - rotación diaria, 14 días de retención
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    maxSize: '20m',
    format: jsonFormat,
    zippedArchive: true
  }),

  // HTTP logs - rotación diaria, 7 días de retención
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxFiles: '7d',
    maxSize: '20m',
    format: jsonFormat,
    zippedArchive: true
  })
];

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
  // No loguear en test
  silent: process.env.NODE_ENV === 'test'
});

/**
 * Stream para Morgan
 * Permite que Morgan escriba en Winston
 */
export const morganStream = {
  write: (message) => {
    // Morgan incluye \n al final, lo quitamos
    logger.http(message.trim());
  }
};

/**
 * Helper functions para logging contextual
 */
export const loggers = {
  /**
   * Log de petición HTTP iniciada
   */
  logRequest: (req, additionalInfo = {}) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 100),
      ...additionalInfo
    });
  },

  /**
   * Log de respuesta HTTP
   */
  logResponse: (req, res, duration, additionalInfo = {}) => {
    logger.http('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
      ...additionalInfo
    });
  },

  /**
   * Log de operación de base de datos
   */
  logDatabase: (operation, model, data = {}, correlationId) => {
    logger.debug('Database Operation', {
      operation,
      model,
      correlationId,
      ...data
    });
  },

  /**
   * Log de operación con servicio externo
   */
  logExternalService: (service, operation, data = {}, correlationId) => {
    logger.info('External Service', {
      service,
      operation,
      correlationId,
      ...data
    });
  },

  /**
   * Log de error con contexto completo
   */
  logError: (error, context = {}) => {
    const errorLog = {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...context
    };

    logger.error('Error occurred', errorLog);
  },

  /**
   * Log de operación exitosa
   */
  logSuccess: (operation, data = {}, correlationId) => {
    logger.info('Operation Success', {
      operation,
      correlationId,
      ...data
    });
  },

  /**
   * Log de advertencia
   */
  logWarning: (message, data = {}, correlationId) => {
    logger.warn(message, {
      correlationId,
      ...data
    });
  }
};

// Log de inicio
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV,
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
});

export default logger;
