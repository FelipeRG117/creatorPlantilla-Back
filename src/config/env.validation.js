/**
 * Environment Variables Validation
 * Validación con Zod para garantizar configuración correcta
 */

// Cargar variables de entorno PRIMERO (antes de cualquier validación)
import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

/**
 * Schema de validación para variables de entorno
 * Garantiza que todas las variables requeridas existan y sean válidas
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Environment mode'),

  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .transform(Number)
    .default('5000')
    .describe('Server port'),

  // Database Configuration
  MONGODB_URI: z
    .string()
    .url('MONGODB_URI must be a valid URL')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://'
    )
    .describe('MongoDB connection string'),

  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .describe('Secret key for JWT signing'),

  JWT_EXPIRE: z
    .string()
    .regex(/^\d+[smhdw]$/, 'JWT_EXPIRE must be in format: 1d, 7d, 24h, etc.')
    .default('7d')
    .describe('JWT expiration time'),

  JWT_REFRESH_EXPIRE: z
    .string()
    .regex(/^\d+[smhdw]$/, 'JWT_REFRESH_EXPIRE must be in format: 30d, 90d, etc.')
    .default('30d')
    .describe('JWT refresh token expiration time'),

  // Bcrypt Configuration
  BCRYPT_ROUNDS: z
    .string()
    .regex(/^\d+$/, 'BCRYPT_ROUNDS must be a number')
    .transform(Number)
    .refine((n) => n >= 10 && n <= 15, 'BCRYPT_ROUNDS should be between 10 and 15')
    .default('10')
    .describe('Bcrypt hashing rounds'),

  // Cloudinary Configuration (opcional en desarrollo)
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .optional()
    .describe('Cloudinary cloud name'),

  CLOUDINARY_API_KEY: z
    .string()
    .optional()
    .describe('Cloudinary API key'),

  CLOUDINARY_API_SECRET: z
    .string()
    .optional()
    .describe('Cloudinary API secret'),

  // Frontend Configuration
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .default('http://localhost:3000')
    .describe('Frontend application URL for CORS'),

  // Email Configuration (opcional en desarrollo)
  EMAIL_SERVICE: z
    .string()
    .optional()
    .describe('Email service provider (gmail, sendgrid, etc.)'),

  EMAIL_USER: z
    .string()
    .email('EMAIL_USER must be a valid email')
    .optional()
    .describe('Email account username'),

  EMAIL_PASSWORD: z
    .string()
    .optional()
    .describe('Email account password or app password'),

  EMAIL_FROM: z
    .string()
    .email('EMAIL_FROM must be a valid email')
    .optional()
    .describe('Default sender email address'),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(/^\d+$/, 'RATE_LIMIT_WINDOW_MS must be a number')
    .transform(Number)
    .default('900000')
    .describe('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .regex(/^\d+$/, 'RATE_LIMIT_MAX_REQUESTS must be a number')
    .transform(Number)
    .default('100')
    .describe('Maximum requests per window'),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info')
    .describe('Winston log level'),

  // Redis Configuration (opcional)
  REDIS_HOST: z
    .string()
    .default('localhost')
    .optional()
    .describe('Redis host'),

  REDIS_PORT: z
    .string()
    .regex(/^\d+$/, 'REDIS_PORT must be a number')
    .transform(Number)
    .default('6379')
    .optional()
    .describe('Redis port'),

  REDIS_PASSWORD: z
    .string()
    .optional()
    .describe('Redis password'),

  // App Configuration
  APP_NAME: z
    .string()
    .default('Mariachi Web')
    .describe('Application name'),

  APP_VERSION: z
    .string()
    .default('1.0.0')
    .describe('Application version')
});

/**
 * Validar variables de entorno al inicio de la aplicación
 * @throws {Error} Si la validación falla
 */
export function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    console.log('✅ Environment variables validated successfully');
    console.log(`📊 Environment: ${parsed.NODE_ENV}`);
    console.log(`🚀 Server will run on port: ${parsed.PORT}`);
    console.log(`🔐 JWT expiration: ${parsed.JWT_EXPIRE}`);
    if (parsed.CLOUDINARY_CLOUD_NAME) {
      console.log(`☁️  Cloudinary: ${parsed.CLOUDINARY_CLOUD_NAME}`);
    } else {
      console.log(`⚠️  Cloudinary: Not configured (image uploads disabled)`);
    }

    return parsed;
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    console.error('');

    // Log error details for debugging
    console.error('🔍 Debug info:', error.name);

    if (error.errors && Array.isArray(error.errors)) {
      console.error('❗ Validation errors:');
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  ⚠️  ${path}: ${err.message}`);
      });
      console.error('');
    } else if (error.message) {
      console.error('❗ Error message:', error.message);
      console.error('');
    }

    console.error('📋 Required environment variables:');
    console.error('');
    console.error('  Critical:');
    console.error('    - MONGODB_URI: MongoDB connection string');
    console.error('    - JWT_SECRET: Secret key for JWT (min 32 chars)');
    console.error('');
    console.error('  Optional (for full functionality):');
    console.error('    - CLOUDINARY_CLOUD_NAME: Cloudinary account name (for image uploads)');
    console.error('    - CLOUDINARY_API_KEY: Cloudinary API key');
    console.error('    - CLOUDINARY_API_SECRET: Cloudinary API secret');
    console.error('    - NODE_ENV: development | production | test (default: development)');
    console.error('    - PORT: Server port (default: 5000)');
    console.error('    - JWT_EXPIRE: JWT expiration (default: 7d)');
    console.error('    - BCRYPT_ROUNDS: Bcrypt rounds (default: 10)');
    console.error('    - FRONTEND_URL: Frontend URL (default: http://localhost:3000)');
    console.error('');
    console.error('💡 Tip: Copy .env.example to .env and fill in the required values');
    console.error('');

    // Terminar el proceso con error
    process.exit(1);
  }
}

/**
 * Typed env object
 * Después de validar, puedes usar este objeto con type safety
 */
export const env = validateEnv();

/**
 * Helper para verificar si estamos en producción
 */
export const isProduction = () => env.NODE_ENV === 'production';

/**
 * Helper para verificar si estamos en desarrollo
 */
export const isDevelopment = () => env.NODE_ENV === 'development';

/**
 * Helper para verificar si estamos en test
 */
export const isTest = () => env.NODE_ENV === 'test';

/**
 * Helper para obtener URL completa del servidor
 */
export const getServerUrl = () => {
  return `http://localhost:${env.PORT}`;
};

/**
 * Helper para verificar si Redis está configurado
 */
export const hasRedis = () => {
  return !!(env.REDIS_HOST && env.REDIS_PORT);
};

/**
 * Helper para verificar si email está configurado
 */
export const hasEmail = () => {
  return !!(env.EMAIL_SERVICE && env.EMAIL_USER && env.EMAIL_PASSWORD);
};

/**
 * Helper para verificar si Cloudinary está configurado
 */
export const hasCloudinary = () => {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
};

/**
 * Exportar schema para uso en tests
 */
export { envSchema };

export default {
  env,
  validateEnv,
  isProduction,
  isDevelopment,
  isTest,
  getServerUrl,
  hasRedis,
  hasEmail,
  hasCloudinary
};
