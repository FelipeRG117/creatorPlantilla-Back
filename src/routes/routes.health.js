/**
 * Health Check Routes
 * Endpoints para monitoring y observability
 */

import { Router } from 'express';
import { HealthController } from '../controllers/controller.health.js';

export const routesHealth = Router();

/**
 * @route   GET /health
 * @desc    Health check básico
 * @access  Public
 */
routesHealth.get('/', HealthController.basic);

/**
 * @route   GET /health/detailed
 * @desc    Health check detallado
 * @access  Public
 */
routesHealth.get('/detailed', HealthController.detailed);

/**
 * @route   GET /health/readiness
 * @desc    Readiness probe (Kubernetes)
 * @access  Public
 */
routesHealth.get('/readiness', HealthController.readiness);

/**
 * @route   GET /health/liveness
 * @desc    Liveness probe (Kubernetes)
 * @access  Public
 */
routesHealth.get('/liveness', HealthController.liveness);

/**
 * @route   GET /health/metrics
 * @desc    Application metrics
 * @access  Public
 */
routesHealth.get('/metrics', HealthController.metrics);

export default routesHealth;
