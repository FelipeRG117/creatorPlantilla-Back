/**
 * Health Check Controller
 * Endpoints para monitoring y observability
 */

import mongoose from 'mongoose';
import { cloudinary } from '../services/cloudinary.Config.js';
import { logger } from '../config/logger.js';

export class HealthController {
  /**
   * GET /health
   * Health check básico para load balancers
   */
  static async basic(req, res) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mariachi-web-backend'
    });
  }

  /**
   * GET /health/detailed
   * Health check detallado para monitoring
   */
  static async detailed(req, res) {
    const startTime = performance.now();

    try {
      const checks = {
        server: await checkServer(),
        database: await checkDatabase(),
        cloudinary: await checkCloudinary(),
        memory: checkMemory(),
        disk: checkDisk(),
        uptime: process.uptime()
      };

      const allHealthy = Object.values(checks).every(
        check => check.status === 'ok' || check.status === 'warning'
      );

      const duration = performance.now() - startTime;
      const statusCode = allHealthy ? 200 : 503;

      logger.info('Health check performed', {
        healthy: allHealthy,
        duration: `${duration.toFixed(2)}ms`,
        correlationId: req.correlationId
      });

      res.status(statusCode).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        duration: `${duration.toFixed(2)}ms`,
        checks
      });
    } catch (error) {
      logger.error('Health check failed', {
        error: error.message,
        correlationId: req.correlationId
      });

      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * GET /health/readiness
   * Readiness probe para Kubernetes
   * Verifica si la aplicación está lista para recibir tráfico
   */
  static async readiness(req, res) {
    try {
      // Verificar dependencias críticas
      const dbHealthy = await checkDatabase();
      const cloudinaryHealthy = await checkCloudinary();

      // Cloudinary es opcional, solo DB es crítico para readiness
      const isReady = dbHealthy.status === 'ok';

      if (isReady) {
        res.status(200).json({
          ready: true,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          ready: false,
          timestamp: new Date().toISOString(),
          reason: {
            database: dbHealthy.status !== 'ok' ? dbHealthy.error : null,
            cloudinary: cloudinaryHealthy.status !== 'ok' ? cloudinaryHealthy.error : null
          }
        });
      }
    } catch (error) {
      logger.error('Readiness check failed', {
        error: error.message,
        correlationId: req.correlationId
      });

      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * GET /health/liveness
   * Liveness probe para Kubernetes
   * Verifica si la aplicación está viva
   */
  static async liveness(req, res) {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  /**
   * GET /health/metrics
   * Métricas de la aplicación
   */
  static async metrics(req, res) {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
        heapUsagePercent: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
      },
      cpu: {
        user: `${(cpuUsage.user / 1000).toFixed(2)} ms`,
        system: `${(cpuUsage.system / 1000).toFixed(2)} ms`
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  }
}

/**
 * Verificar estado del servidor
 */
async function checkServer() {
  try {
    return {
      status: 'ok',
      timestamp: Date.now(),
      pid: process.pid,
      nodeVersion: process.version
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verificar conexión a MongoDB
 */
async function checkDatabase() {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state === 1) {
      // Ping a la base de datos
      const startTime = performance.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = performance.now() - startTime;

      return {
        status: 'ok',
        state: states[state],
        responseTime: `${responseTime.toFixed(2)}ms`,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      return {
        status: 'error',
        state: states[state],
        error: 'Database not connected'
      };
    }
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verificar conexión a Cloudinary
 */
async function checkCloudinary() {
  try {
    // Verificar configuración
    if (!cloudinary.config().cloud_name) {
      return {
        status: 'warning',
        message: 'Cloudinary not configured (optional)'
      };
    }

    // Ping a Cloudinary
    const startTime = performance.now();
    await cloudinary.api.ping();
    const responseTime = performance.now() - startTime;

    return {
      status: 'ok',
      responseTime: `${responseTime.toFixed(2)}ms`,
      cloudName: cloudinary.config().cloud_name
    };
  } catch (error) {
    logger.error('Cloudinary health check failed', { error: error.message });
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verificar uso de memoria
 */
function checkMemory() {
  const used = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(used.rss / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024)
  };

  // Calcular porcentaje de uso de heap
  const heapUsagePercent = (memoryMB.heapUsed / memoryMB.heapTotal) * 100;

  // Alertar si uso excede 80%
  if (heapUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      heapUsagePercent: heapUsagePercent.toFixed(2),
      memoryMB
    });

    return {
      status: 'warning',
      usage: memoryMB,
      heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
      message: 'High memory usage detected'
    };
  }

  return {
    status: 'ok',
    usage: memoryMB,
    heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`
  };
}

/**
 * Verificar espacio en disco (solo disponible en algunos sistemas)
 */
function checkDisk() {
  try {
    // Node.js no tiene API nativa para disk space
    // En producción se puede usar un paquete como 'diskusage'
    return {
      status: 'ok',
      message: 'Disk check not implemented'
    };
  } catch (error) {
    return {
      status: 'warning',
      error: error.message
    };
  }
}

export default HealthController;
