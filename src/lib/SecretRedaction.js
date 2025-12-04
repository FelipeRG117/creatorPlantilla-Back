/**
 * Secret Redaction Utility
 *
 * Automatically redacts sensitive information from logs to prevent
 * accidental exposure of secrets, API keys, tokens, passwords, etc.
 *
 * Features:
 * - Pattern-based detection (API keys, tokens, passwords)
 * - Field-based redaction (known sensitive field names)
 * - Partial masking (show last 4 chars for debugging)
 * - Deep object traversal
 * - Performance optimized
 */

/**
 * Patrones de secretos comunes
 */
const SECRET_PATTERNS = [
  // API Keys
  {
    name: 'API Key',
    pattern: /\b([a-zA-Z0-9_-]{20,})\b/g,
    context: ['api', 'key', 'apikey', 'api_key']
  },

  // Bearer Tokens
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+([a-zA-Z0-9._-]+)/gi
  },

  // JWT Tokens
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g
  },

  // Cloudinary URLs con signatures
  {
    name: 'Cloudinary Signature',
    pattern: /(cloudinary\.com\/[^?]+\?[^&]*api_key=[^&]+)/gi
  },

  // Email addresses (partial)
  {
    name: 'Email',
    pattern: /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    maskFn: (match, user, domain) => {
      if (user.length <= 2) return `**@${domain}`;
      return `${user.substring(0, 2)}***@${domain}`;
    }
  },

  // Credit Card Numbers
  {
    name: 'Credit Card',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
  },

  // MongoDB Connection Strings
  {
    name: 'MongoDB Connection',
    pattern: /mongodb(\+srv)?:\/\/[^@]+@[^/]+/gi,
    maskFn: (match) => {
      const parts = match.split('@');
      if (parts.length === 2) {
        return `${parts[0].split(':')[0]}://***:***@${parts[1]}`;
      }
      return '[REDACTED_MONGODB_URI]';
    }
  },

  // Generic passwords in URLs
  {
    name: 'URL Password',
    pattern: /:\/\/[^:]+:([^@]+)@/g,
    maskFn: (match) => match.replace(/:([^@]+)@/, ':***@')
  }
];

/**
 * Campos sensibles por nombre
 */
const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'api_key',
  'apikey',
  'apiKey',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'private_key',
  'privateKey',
  'client_secret',
  'clientSecret',
  'auth',
  'authorization',
  'bearer',
  'token',
  'jwt',
  'session',
  'cookie',
  'ssn',
  'credit_card',
  'creditCard',
  'cvv',
  'pin',
  'api_secret',
  'apiSecret',
  'cloudinary_api_secret',
  'stripe_secret',
  'aws_secret',
  'db_password',
  'database_password',
  'mongo_password',
  'redis_password'
];

/**
 * Clase SecretRedactor
 */
class SecretRedactor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.showLast = options.showLast || 4;
    this.patterns = options.patterns || SECRET_PATTERNS;
    this.sensitiveFields = options.sensitiveFields || SENSITIVE_FIELD_NAMES;
    this.redactedMarker = options.redactedMarker || '[REDACTED]';
  }

  /**
   * Redactar secretos en cualquier tipo de dato
   */
  redact(data) {
    if (!this.enabled) {
      return data;
    }

    if (data === null || data === undefined) {
      return data;
    }

    // String
    if (typeof data === 'string') {
      return this.redactString(data);
    }

    // Object
    if (typeof data === 'object') {
      return this.redactObject(data);
    }

    // Otros tipos (number, boolean, etc.)
    return data;
  }

  /**
   * Redactar string
   */
  redactString(str) {
    if (!str || typeof str !== 'string') {
      return str;
    }

    let redacted = str;

    // Aplicar patrones
    for (const pattern of this.patterns) {
      if (pattern.maskFn) {
        // Custom mask function
        redacted = redacted.replace(pattern.pattern, pattern.maskFn);
      } else {
        // Default masking
        redacted = redacted.replace(pattern.pattern, (match) => {
          return this.maskSecret(match);
        });
      }
    }

    return redacted;
  }

  /**
   * Redactar objeto (deep traversal)
   */
  redactObject(obj) {
    if (obj === null) {
      return obj;
    }

    // Array
    if (Array.isArray(obj)) {
      return obj.map(item => this.redact(item));
    }

    // Date, Buffer, etc. - no redactar
    if (obj instanceof Date || obj instanceof Buffer || obj instanceof RegExp) {
      return obj;
    }

    // Object normal
    const redacted = {};

    for (const [key, value] of Object.entries(obj)) {
      // Si el campo es sensible, redactar completamente
      if (this.isSensitiveField(key)) {
        redacted[key] = this.maskSecret(value);
      }
      // Si no, redactar recursivamente
      else {
        redacted[key] = this.redact(value);
      }
    }

    return redacted;
  }

  /**
   * Verificar si un field name es sensible
   */
  isSensitiveField(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') {
      return false;
    }

    const lowerField = fieldName.toLowerCase();

    return this.sensitiveFields.some(sensitive =>
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Enmascarar un secreto
   */
  maskSecret(value) {
    if (value === null || value === undefined) {
      return value;
    }

    // Si es objeto, redactar por completo
    if (typeof value === 'object') {
      return this.redactedMarker;
    }

    // Convertir a string
    const str = String(value);

    // Si es muy corto, redactar completamente
    if (str.length <= 4) {
      return this.redactedMarker;
    }

    // Mostrar últimos N caracteres
    if (this.showLast > 0 && str.length > this.showLast) {
      const visible = str.slice(-this.showLast);
      const masked = '*'.repeat(Math.min(8, str.length - this.showLast));
      return `${masked}${visible}`;
    }

    return this.redactedMarker;
  }

  /**
   * Redactar headers HTTP (casos especiales)
   */
  redactHeaders(headers) {
    if (!headers || typeof headers !== 'object') {
      return headers;
    }

    const redacted = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();

      // Authorization header
      if (lowerKey === 'authorization' || lowerKey === 'x-api-key') {
        redacted[key] = this.maskSecret(value);
      }
      // Cookie header
      else if (lowerKey === 'cookie' || lowerKey === 'set-cookie') {
        redacted[key] = this.redactCookies(value);
      }
      // Otros headers
      else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redactar cookies
   */
  redactCookies(cookieStr) {
    if (!cookieStr || typeof cookieStr !== 'string') {
      return cookieStr;
    }

    // Cookie format: "name=value; name2=value2"
    return cookieStr.replace(/=([^;]+)/g, (match, value) => {
      // Mantener valores muy cortos (flags como "true", "false")
      if (value.length <= 5 && /^[a-z0-9]+$/i.test(value)) {
        return match;
      }
      return `=${this.maskSecret(value)}`;
    });
  }

  /**
   * Redactar URL (preservar estructura)
   */
  redactUrl(url) {
    if (!url || typeof url !== 'string') {
      return url;
    }

    try {
      const urlObj = new URL(url);

      // Redactar password en URL
      if (urlObj.password) {
        urlObj.password = '***';
      }

      // Redactar query params sensibles
      const params = urlObj.searchParams;
      for (const key of params.keys()) {
        if (this.isSensitiveField(key)) {
          params.set(key, this.maskSecret(params.get(key)));
        }
      }

      return urlObj.toString();
    } catch (error) {
      // Si no es URL válida, redactar con patrones
      return this.redactString(url);
    }
  }

  /**
   * Helper para redactar errores
   */
  redactError(error) {
    if (!error) {
      return error;
    }

    if (typeof error === 'string') {
      return this.redactString(error);
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.redactString(error.message),
        stack: error.stack ? this.redactString(error.stack) : undefined,
        ...this.redact(error)
      };
    }

    return this.redact(error);
  }

  /**
   * Verificar si un string contiene secretos (sin redactar)
   */
  containsSecrets(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    return this.patterns.some(pattern => pattern.pattern.test(str));
  }

  /**
   * Añadir patrón custom
   */
  addPattern(pattern) {
    this.patterns.push(pattern);
  }

  /**
   * Añadir campo sensible
   */
  addSensitiveField(fieldName) {
    if (!this.sensitiveFields.includes(fieldName)) {
      this.sensitiveFields.push(fieldName);
    }
  }

  /**
   * Deshabilitar redacción (útil para desarrollo)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Habilitar redacción
   */
  enable() {
    this.enabled = true;
  }
}

/**
 * Instancia singleton
 */
const secretRedactor = new SecretRedactor({
  enabled: process.env.NODE_ENV !== 'test', // Deshabilitado en tests
  showLast: 4
});

/**
 * Helper para redactar rápidamente
 */
export function redact(data) {
  return secretRedactor.redact(data);
}

/**
 * Helper para redactar headers
 */
export function redactHeaders(headers) {
  return secretRedactor.redactHeaders(headers);
}

/**
 * Helper para redactar URLs
 */
export function redactUrl(url) {
  return secretRedactor.redactUrl(url);
}

/**
 * Helper para redactar errores
 */
export function redactError(error) {
  return secretRedactor.redactError(error);
}

export default secretRedactor;
export { SecretRedactor, SECRET_PATTERNS, SENSITIVE_FIELD_NAMES };
