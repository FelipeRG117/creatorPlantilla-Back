/**
 * Jest Setup File
 * Configuración global para todos los tests
 */

// Establecer NODE_ENV a test
process.env.NODE_ENV = 'test';

// Mock de console para reducir ruido en tests
const noop = () => {};
global.console = {
  ...console,
  // Mantener error y warn
  error: console.error,
  warn: console.warn,
  // Silenciar info, log, debug
  log: noop,
  info: noop,
  debug: noop,
};

// Variables de entorno para testing
process.env.PORT = '5001'; // Puerto diferente para tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mariachi-web-test';

// Cloudinary mock (para tests sin uploads reales)
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Frontend URL para CORS
process.env.FRONTEND_URL = 'http://localhost:3000';

// Log level para tests
process.env.LOG_LEVEL = 'error'; // Solo errores en tests

console.info('✅ Jest setup complete - Test environment configured');
