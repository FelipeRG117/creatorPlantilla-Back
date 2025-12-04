/**
 * Security Middleware
 * Helmet + Rate Limiting + MongoDB Sanitization + CORS
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { logger } from '../config/logger.js';

/**
 * Helmet Configuration
 * Security headers para protección enterprise
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Hide X-Powered-By
  hidePoweredBy: true
});

/**
 * Rate Limiting Factory
 * Crea rate limiters con configuración específica
 */
export const createRateLimiter = (options = {}) => {
  // Deshabilitar rate limiting en tests
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const {
    windowMs = 15 * 60 * 1000, // 15 minutos por defecto
    max = 100, // 100 requests por ventana
    message = 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    skipSuccessfulRequests,
    skipFailedRequests,
    // Let express-rate-limit handle IP extraction (supports IPv4 and IPv6)
    standardHeaders, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        correlationId: req.correlationId,
        userId: req.user?.id
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};

/**
 * Rate Limiters Predefinidos
 */
export const rateLimiters = {
  /**
   * General API rate limiter
   * 100 requests por 15 minutos
   */
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.'
  }),

  /**
   * Auth endpoints rate limiter (más estricto)
   * 5 intentos por 15 minutos
   * Solo cuenta intentos fallidos
   */
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login. Por favor intenta más tarde.',
    skipSuccessfulRequests: true, // Solo contar fallos
    keyGenerator: (req) => {
      // Rate limit por IP + email si está disponible
      const email = req.body?.email || '';
      return `${req.ip}-${email}`;
    }
  }),

  /**
   * Mutation endpoints rate limiter
   * POST/PUT/DELETE - 20 requests por minuto
   */
  mutation: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20,
    message: 'Demasiadas operaciones de escritura. Por favor espera un momento.'
  }),

  /**
   * File upload rate limiter
   * 5 uploads por minuto
   */
  upload: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 5,
    message: 'Demasiadas subidas de archivos. Por favor espera un momento.'
  }),

  /**
   * Password reset rate limiter
   * 3 intentos por hora
   */
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: 'Demasiados intentos de recuperación de contraseña. Por favor intenta en 1 hora.',
    keyGenerator: (req) => {
      const email = req.body?.email || '';
      return `reset-${req.ip}-${email}`;
    }
  })
};

/**
 * MongoDB Injection Protection
 * Sanitiza queries de MongoDB
 */
export const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential MongoDB injection attempt', {
      ip: req.ip,
      path: req.path,
      key,
      correlationId: req.correlationId
    });
  }
});

/**
 * CORS Configuration Avanzada
 */
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Permitir requests sin origin (como Postman, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', {
        origin,
        rejectedBy: 'CORS policy'
      });
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-ID',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Correlation-ID'
  ],
  maxAge: 86400 // 24 horas
};

/**
 * Security Headers Middleware
 * Agrega headers de seguridad adicionales
 */
export const securityHeaders = (req, res, next) => {
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Request Size Limiter
 * Limita el tamaño de requests para prevenir DoS
 */
export const requestSizeLimits = {
  // Límite para JSON bodies
  json: '10mb',

  // Límite para URL-encoded bodies
  urlencoded: '10mb',

  // Límite para raw bodies
  raw: '10mb',

  // Límite para text bodies
  text: '10mb'
};

/**
 * Sanitize Input Middleware
 * Sanitiza inputs de usuario
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitizar query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  // Sanitizar body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

/**
 * Timeout Middleware
 * Previene requests que tarden demasiado
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      logger.error('Request timeout', {
        path: req.path,
        method: req.method,
        correlationId: req.correlationId,
        timeout: timeoutMs
      });

      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'La solicitud tardó demasiado tiempo'
        }
      });
    });

    next();
  };
};

/**
 * IP Whitelist/Blacklist Middleware (opcional)
 * Para endpoints administrativos sensibles
 */
export const ipFilter = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.warn('IP blocked', {
        ip: clientIP,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Acceso denegado'
        }
      });
    }

    next();
  };
};

export default {
  helmetConfig,
  rateLimiters,
  mongoSanitizeConfig,
  corsConfig,
  securityHeaders,
  sanitizeInput,
  requestTimeout,
  ipFilter,
  createRateLimiter
};
