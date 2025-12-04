/**
 * Circuit Breaker Monitoring Routes
 * Endpoints para monitorear el estado de los circuit breakers
 */

import { Router } from 'express';
import enhancedCloudinaryService from '../services/service.cloudinary.enhanced.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /api/circuit-breakers/status
 * Estado general de todos los circuit breakers
 */
router.get('/status', async (req, res) => {
  try {
    const health = await enhancedCloudinaryService.healthCheck();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      circuitBreakers: health,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get circuit breaker status', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve circuit breaker status',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/circuit-breakers/metrics
 * Métricas detalladas de los circuit breakers
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = enhancedCloudinaryService.getMetrics();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get circuit breaker metrics', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      correlationId: req.correlationId
    });
  }
});

/**
 * POST /api/circuit-breakers/reset
 * Reset de todos los circuit breakers (ADMIN ONLY)
 * ⚠️ Solo usar para testing o recuperación manual
 */
router.post('/reset', (req, res) => {
  try {
    logger.warn('Circuit breakers manual reset requested', {
      correlationId: req.correlationId,
      ip: req.ip
    });

    enhancedCloudinaryService.resetCircuits();

    res.status(200).json({
      success: true,
      message: 'All circuit breakers have been reset',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to reset circuit breakers', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breakers',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/circuit-breakers/health
 * Health check simple (para load balancers)
 */
router.get('/health', async (req, res) => {
  try {
    const health = await enhancedCloudinaryService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: health.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as routesCircuitBreaker };
export default router;
