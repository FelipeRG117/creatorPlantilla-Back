/**
 * Metrics Routes
 * Endpoints para monitorear métricas de observabilidad
 */

import { Router } from 'express';
import metricService from '../lib/MetricService.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /api/metrics/summary
 * Resumen de todas las métricas
 */
router.get('/summary', (req, res) => {
  try {
    const summary = metricService.getSummary();

    res.status(200).json({
      success: true,
      data: summary,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get metrics summary', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics summary',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/metrics/all
 * Todas las métricas detalladas
 */
router.get('/all', (req, res) => {
  try {
    const metrics = metricService.getAllMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get all metrics', {
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
 * GET /api/metrics/service/:serviceName
 * Métricas de un servicio específico
 */
router.get('/service/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    const metrics = metricService.getMetrics(serviceName);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: `Service '${serviceName}' not found`,
        correlationId: req.correlationId
      });
    }

    res.status(200).json({
      success: true,
      data: metrics,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get service metrics', {
      correlationId: req.correlationId,
      serviceName: req.params.serviceName,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service metrics',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/metrics/alerts
 * Alertas recientes
 */
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const alerts = metricService.getAlerts(limit);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get alerts', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      correlationId: req.correlationId
    });
  }
});

/**
 * DELETE /api/metrics/alerts
 * Limpiar alertas
 */
router.delete('/alerts', (req, res) => {
  try {
    const count = metricService.clearAlerts();

    logger.info('Alerts cleared via API', {
      correlationId: req.correlationId,
      count
    });

    res.status(200).json({
      success: true,
      message: `${count} alerts cleared`,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to clear alerts', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to clear alerts',
      correlationId: req.correlationId
    });
  }
});

/**
 * POST /api/metrics/reset
 * Reset de todas las métricas
 */
router.post('/reset', (req, res) => {
  try {
    logger.warn('Metrics reset requested', {
      correlationId: req.correlationId,
      ip: req.ip
    });

    metricService.resetAll();

    res.status(200).json({
      success: true,
      message: 'All metrics have been reset',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to reset metrics', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      correlationId: req.correlationId
    });
  }
});

/**
 * POST /api/metrics/reset/:serviceName
 * Reset de métricas de un servicio específico
 */
router.post('/reset/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;

    logger.warn('Service metrics reset requested', {
      correlationId: req.correlationId,
      serviceName,
      ip: req.ip
    });

    const success = metricService.resetService(serviceName);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Service '${serviceName}' not found`,
        correlationId: req.correlationId
      });
    }

    res.status(200).json({
      success: true,
      message: `Metrics for '${serviceName}' have been reset`,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to reset service metrics', {
      correlationId: req.correlationId,
      serviceName: req.params.serviceName,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reset service metrics',
      correlationId: req.correlationId
    });
  }
});

/**
 * PUT /api/metrics/thresholds
 * Actualizar thresholds de alertas
 */
router.put('/thresholds', (req, res) => {
  try {
    const { errorRate, latencyP95, latencyP99 } = req.body;

    const newThresholds = {};
    if (errorRate !== undefined) newThresholds.errorRate = errorRate;
    if (latencyP95 !== undefined) newThresholds.latencyP95 = latencyP95;
    if (latencyP99 !== undefined) newThresholds.latencyP99 = latencyP99;

    metricService.setThresholds(newThresholds);

    logger.info('Metric thresholds updated', {
      correlationId: req.correlationId,
      thresholds: newThresholds
    });

    res.status(200).json({
      success: true,
      message: 'Thresholds updated successfully',
      thresholds: newThresholds,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to update thresholds', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/metrics/health
 * Health check basado en métricas
 */
router.get('/health', (req, res) => {
  try {
    const health = metricService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get health check', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/metrics/prometheus
 * Métricas en formato Prometheus
 */
router.get('/prometheus', (req, res) => {
  try {
    const prometheusFormat = metricService.toPrometheus();

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(prometheusFormat);
  } catch (error) {
    logger.error('Failed to generate Prometheus metrics', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).send('# Error generating metrics\n');
  }
});

export { router as routesMetrics };
export default router;
