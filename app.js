/**
 * MARIACHI WEB V3 - BACKEND SERVER (ENTERPRISE EDITION)
 *
 * Express API with Enterprise Features:
 * - ✅ JWT Authentication + RBAC
 * - ✅ Winston Logging + Morgan
 * - ✅ Helmet Security Headers
 * - ✅ Rate Limiting Advanced
 * - ✅ MongoDB Sanitization
 * - ✅ CORS Secure
 * - ✅ Correlation IDs
 * - ✅ Health Checks Detallados
 * - ✅ Environment Validation (Zod)
 * - ✅ Error Handling Profesional
 */

// ==========================================
// VALIDACIÓN DE ENVIRONMENT VARIABLES
// ==========================================
// Validar env vars con Zod (carga .env y valida)
import './src/config/env.validation.js';

// ==========================================
// DEPENDENCIAS
// ==========================================
import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

// ==========================================
// INSTANCIA DE APP
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CONEXIÓN A BASE DE DATOS
// ==========================================
import mongoose from "./database.js";

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES ENTERPRISE
// ==========================================
// Logging
import { logger, morganStream } from "./src/config/logger.js";

// Security
import {
  helmetConfig,
  rateLimiters,
  mongoSanitizeConfig,
  corsConfig,
  securityHeaders,
  sanitizeInput
} from "./src/middleware/security.middleware.js";

// Correlation IDs
import { correlationMiddleware } from "./src/middleware/correlation.middleware.js";

// Error Handling
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

// ==========================================
// IMPORTACIÓN DE RUTAS
// ==========================================
// Rutas de autenticación
import { routesAuth } from "./src/routes/routes.auth.js";

// Health Checks
import { routesHealth } from "./src/routes/routes.health.js";

// Circuit Breaker Monitoring
import { routesCircuitBreaker } from "./src/routes/routes.circuitbreaker.js";

// Metrics Monitoring
import { routesMetrics } from "./src/routes/routes.metrics.js";

// Nuevas rutas CRUD enterprise
import { routesAlbums } from "./src/routes/routes.album.js";
import { routesConcerts } from "./src/routes/routes.concert.js";
import { routesProducts } from "./src/routes/routes.product.js";
import { routesAnnouncements } from "./src/routes/routes.announcement.js";
import { routesOrders } from "./src/routes/routes.order.js";

// Stripe Payment Routes
import routesStripe from "./src/routes/routes.stripe.js";

// Inventory Routes
import routesInventory from "./src/routes/routes.inventory.js";

// Swagger Documentation
import { routesSwagger } from "./src/routes/routes.swagger.js";

// Rutas existentes (mantenidas temporalmente)
import { routesUsers } from "./src/routes/routes.users.js";
import { routesCreators } from "./src/routes/routes.creators.js";
import { routesMerch } from "./src/routes/routes.merch.js";
import { routesSponsors } from "./src/routes/routes.sponsors.js";
import { routesProduction } from "./src/routes/routes.production.js";
import { routesIntitutions } from "./src/routes/routes.institutions.js";
import { routesCourses } from "./src/routes/routes.courses.js";

// ==========================================
// MIDDLEWARES GLOBALES (ENTERPRISE)
// ==========================================

// 1. Correlation IDs (PRIMERO para tracking)
app.use(correlationMiddleware);

// 2. Security Headers (Helmet)
app.use(helmetConfig);
app.use(securityHeaders);

// 3. MongoDB Injection Protection
app.use(mongoSanitizeConfig);

// 4. CORS Seguro
app.use(cors(corsConfig));

// 5. Compression
app.use(compression());

// 6. Body Parser con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Input Sanitization
app.use(sanitizeInput);

// 8. HTTP Request Logging (Morgan + Winston)
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
));

// Log de inicio de servidor
logger.info('Mariachi Web V3 Backend Server starting...', {
  environment: process.env.NODE_ENV,
  port: PORT
});

// ==========================================
// ROOT & INFO ENDPOINT
// ==========================================
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed', {
    correlationId: req.correlationId,
    ip: req.ip
  });

  res.json({
    service: 'Mariachi Web V3 API',
    version: '3.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    documentation: '/api/docs',
    health: {
      basic: '/health',
      detailed: '/health/detailed',
      readiness: '/health/readiness',
      liveness: '/health/liveness',
      metrics: '/health/metrics'
    },
    monitoring: {
      circuitBreakers: '/api/circuit-breakers/status',
      metrics: '/api/metrics/summary',
      prometheus: '/api/metrics/prometheus'
    },
    endpoints: {
      auth: '/api/auth',
      albums: '/api/albums',
      concerts: '/api/concerts',
      products: '/api/products',
      announcements: '/api/announcements'
    }
  });
});

// ==========================================
// RUTAS DE LA API
// ==========================================

// API Documentation (Sin rate limit)
app.use('/api/docs', routesSwagger);

// Health Checks (Sin rate limit)
app.use('/health', routesHealth);

// Circuit Breaker Monitoring (Sin rate limit)
app.use('/api/circuit-breakers', routesCircuitBreaker);

// Metrics Monitoring (Sin rate limit)
app.use('/api/metrics', routesMetrics);

// Autenticación (Con rate limiting específico)
app.use('/api/auth/login', rateLimiters.auth);
app.use('/api/auth/register', rateLimiters.auth);
app.use('/api/auth/forgot-password', rateLimiters.passwordReset);
app.use('/api/auth', routesAuth);

// Rate limiting general para API
app.use('/api', rateLimiters.general);

// ===== NUEVAS RUTAS CRUD ENTERPRISE (Fase 3.2b) =====
app.use('/api/albums', routesAlbums);
app.use('/api/concerts', routesConcerts);
app.use('/api/products', routesProducts);
app.use('/api/announcements', routesAnnouncements);
app.use('/api/orders', routesOrders);

// ===== STRIPE PAYMENT ROUTES =====
app.use('/api/stripe', routesStripe);

// ===== INVENTORY ROUTES =====
app.use('/api/inventory', routesInventory);

// ===== RUTAS EXISTENTES (Legacy - se migrarán gradualmente) =====
app.use("/api/users", routesUsers);
app.use("/api/creators", routesCreators);
app.use("/api/merch", routesMerch);
app.use("/api/sponsor", routesSponsors);
app.use("/api/production", routesProduction);
app.use("/api/institutions", routesIntitutions);
app.use("/api/courses", routesCourses);

// ==========================================
// MANEJO DE ERRORES
// ==========================================

// 404 - Rutas no encontradas (DEBE IR ANTES del errorHandler)
app.use(notFoundHandler);

// Error Handler Global (DEBE IR AL FINAL)
app.use(errorHandler);

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
// Solo iniciar servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎵 MARIACHI WEB V3 - BACKEND SERVER (ENTERPRISE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Enterprise Features Activados:');
  console.log('   ✓ Winston Logger + Morgan');
  console.log('   ✓ Helmet Security Headers');
  console.log('   ✓ Rate Limiting Avanzado');
  console.log('   ✓ MongoDB Sanitization');
  console.log('   ✓ CORS Seguro');
  console.log('   ✓ Correlation IDs');
  console.log('   ✓ Health Checks Detallados');
  console.log('   ✓ Environment Validation (Zod)');
  console.log('\n📚 Endpoints Principales:');
  console.log('   Health:');
  console.log('     - GET  /health');
  console.log('     - GET  /health/detailed');
  console.log('     - GET  /health/readiness');
  console.log('     - GET  /health/liveness');
  console.log('     - GET  /health/metrics');
  console.log('   Auth:');
  console.log('     - POST /api/auth/register');
  console.log('     - POST /api/auth/login');
  console.log('     - GET  /api/auth/me (protegido)');
  console.log('     - PUT  /api/auth/profile (protegido)');
  console.log('     - PUT  /api/auth/change-password (protegido)');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV,
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME,
    cors: process.env.FRONTEND_URL
  });
  });
}

// Exportar app para tests
export default app;
