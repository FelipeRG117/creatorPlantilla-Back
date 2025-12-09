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
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-must-be-32-chars-minimum';
process.env.JWT_EXPIRES_IN = '1d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mariachi-web-test';

// Email mock (no enviar emails reales en tests)
process.env.EMAIL_SERVICE = 'test';
process.env.EMAIL_FROM = 'test@test.com';
process.env.ADMIN_EMAIL = 'admin@test.com';

// Stripe test keys
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

// Cloudinary mock (para tests sin uploads reales)
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Frontend URL para CORS
process.env.FRONTEND_URL = 'http://localhost:3000';

// Log level para tests
process.env.LOG_LEVEL = 'error'; // Solo errores en tests

console.info('✅ Jest setup complete - Test environment configured');
