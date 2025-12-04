/**
 * MetricService - Professional Observability & Monitoring
 *
 * Centraliza la recolección y agregación de métricas para:
 * - Circuit Breakers
 * - APIs
 * - Base de datos
 * - Servicios externos (Cloudinary, etc.)
 *
 * Features:
 * - Conteo de operaciones (success, failure, total)
 * - Tracking de latencias (min, max, avg, percentiles)
 * - Ventanas de tiempo (1min, 5min, 1hour)
 * - Memory-efficient circular buffers
 * - Prometheus-compatible output
 */

import { logger } from '../config/logger.js';

/**
 * Circular Buffer para almacenar métricas de manera eficiente
 */
class CircularBuffer {
  constructor(maxSize = 1000) {
    this.buffer = new Array(maxSize);
    this.maxSize = maxSize;
    this.index = 0;
    this.size = 0;
  }

  push(value) {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.maxSize;
    this.size = Math.min(this.size + 1, this.maxSize);
  }

  getAll() {
    if (this.size < this.maxSize) {
      return this.buffer.slice(0, this.size);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  clear() {
    this.index = 0;
    this.size = 0;
  }

  get length() {
    return this.size;
  }
}

/**
 * Time Window Metrics
 * Almacena métricas con ventanas de tiempo específicas
 */
class TimeWindowMetrics {
  constructor(windowDuration = 60000) {
    this.windowDuration = windowDuration; // ms
    this.dataPoints = new CircularBuffer(1000);
    this.lastCleanup = Date.now();
  }

  record(value, timestamp = Date.now()) {
    this.dataPoints.push({ value, timestamp });
    this.cleanup();
  }

  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < 10000) return; // Cleanup cada 10 segundos

    const cutoff = now - this.windowDuration;
    const allData = this.dataPoints.getAll();
    const validData = allData.filter(dp => dp.timestamp >= cutoff);

    this.dataPoints.clear();
    validData.forEach(dp => this.dataPoints.push(dp));
    this.lastCleanup = now;
  }

  getMetrics() {
    this.cleanup();
    const data = this.dataPoints.getAll();
    const values = data.map(dp => dp.value);

    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        sum: 0
      };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum
    };
  }
}

/**
 * Latency Tracker
 * Calcula percentiles y distribución de latencias
 */
class LatencyTracker {
  constructor(windowDuration = 60000) {
    this.latencies = new CircularBuffer(1000);
    this.windowDuration = windowDuration;
  }

  record(latencyMs) {
    this.latencies.push({
      value: latencyMs,
      timestamp: Date.now()
    });
  }

  getStats() {
    const data = this.latencies.getAll();
    const now = Date.now();
    const cutoff = now - this.windowDuration;

    // Filter válidos
    const validLatencies = data
      .filter(d => d.timestamp >= cutoff)
      .map(d => d.value)
      .sort((a, b) => a - b);

    if (validLatencies.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const sum = validLatencies.reduce((a, b) => a + b, 0);
    const avg = sum / validLatencies.length;

    return {
      count: validLatencies.length,
      min: validLatencies[0],
      max: validLatencies[validLatencies.length - 1],
      avg: Math.round(avg * 100) / 100,
      p50: this.percentile(validLatencies, 50),
      p95: this.percentile(validLatencies, 95),
      p99: this.percentile(validLatencies, 99)
    };
  }

  percentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  clear() {
    this.latencies.clear();
  }
}

/**
 * Operation Counter
 * Cuenta éxitos, fallos, totales
 */
class OperationCounter {
  constructor() {
    this.total = 0;
    this.success = 0;
    this.failure = 0;
    this.lastReset = Date.now();
  }

  recordSuccess() {
    this.total++;
    this.success++;
  }

  recordFailure() {
    this.total++;
    this.failure++;
  }

  getStats() {
    const successRate = this.total > 0 ? (this.success / this.total) * 100 : 100;
    const failureRate = this.total > 0 ? (this.failure / this.total) * 100 : 0;

    return {
      total: this.total,
      success: this.success,
      failure: this.failure,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100
    };
  }

  reset() {
    this.total = 0;
    this.success = 0;
    this.failure = 0;
    this.lastReset = Date.now();
  }
}

/**
 * Service Metrics
 * Métricas completas para un servicio específico
 */
class ServiceMetrics {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.windowDuration = options.windowDuration || 60000; // 1 minuto default

    // Contadores
    this.counter = new OperationCounter();

    // Latencias
    this.latencyTracker = new LatencyTracker(this.windowDuration);

    // Time windows
    this.windows = {
      oneMin: new TimeWindowMetrics(60000),      // 1 minuto
      fiveMin: new TimeWindowMetrics(300000),    // 5 minutos
      oneHour: new TimeWindowMetrics(3600000)    // 1 hora
    };

    // Estado
    this.startTime = Date.now();
    this.lastActivity = Date.now();
  }

  /**
   * Registra una operación exitosa
   */
  recordSuccess(latencyMs = 0) {
    this.counter.recordSuccess();
    if (latencyMs > 0) {
      this.latencyTracker.record(latencyMs);
      this.windows.oneMin.record(latencyMs);
      this.windows.fiveMin.record(latencyMs);
      this.windows.oneHour.record(latencyMs);
    }
    this.lastActivity = Date.now();
  }

  /**
   * Registra una operación fallida
   */
  recordFailure(latencyMs = 0) {
    this.counter.recordFailure();
    if (latencyMs > 0) {
      this.latencyTracker.record(latencyMs);
      this.windows.oneMin.record(latencyMs);
      this.windows.fiveMin.record(latencyMs);
      this.windows.oneHour.record(latencyMs);
    }
    this.lastActivity = Date.now();
  }

  /**
   * Obtiene todas las métricas
   */
  getMetrics() {
    return {
      serviceName: this.serviceName,
      operations: this.counter.getStats(),
      latency: this.latencyTracker.getStats(),
      windows: {
        oneMin: this.windows.oneMin.getMetrics(),
        fiveMin: this.windows.fiveMin.getMetrics(),
        oneHour: this.windows.oneHour.getMetrics()
      },
      uptime: Date.now() - this.startTime,
      lastActivity: this.lastActivity
    };
  }

  /**
   * Reset de métricas
   */
  reset() {
    this.counter.reset();
    this.latencyTracker.clear();
    this.windows.oneMin = new TimeWindowMetrics(60000);
    this.windows.fiveMin = new TimeWindowMetrics(300000);
    this.windows.oneHour = new TimeWindowMetrics(3600000);
  }
}

/**
 * MetricService Singleton
 * Servicio centralizado de métricas
 */
class MetricService {
  constructor() {
    if (MetricService.instance) {
      return MetricService.instance;
    }

    this.services = new Map();
    this.globalStartTime = Date.now();
    this.alerts = [];
    this.maxAlerts = 100;

    // Thresholds para alertas
    this.thresholds = {
      errorRate: 10,        // % - Alertar si error rate > 10%
      latencyP95: 5000,     // ms - Alertar si p95 > 5s
      latencyP99: 10000     // ms - Alertar si p99 > 10s
    };

    logger.info('MetricService initialized', {
      thresholds: this.thresholds
    });

    MetricService.instance = this;
  }

  /**
   * Obtiene o crea métricas para un servicio
   */
  getServiceMetrics(serviceName) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new ServiceMetrics(serviceName));
    }
    return this.services.get(serviceName);
  }

  /**
   * Registra operación exitosa
   */
  recordSuccess(serviceName, latencyMs = 0) {
    const metrics = this.getServiceMetrics(serviceName);
    metrics.recordSuccess(latencyMs);
    this.checkThresholds(serviceName, metrics);
  }

  /**
   * Registra operación fallida
   */
  recordFailure(serviceName, latencyMs = 0, error = null) {
    const metrics = this.getServiceMetrics(serviceName);
    metrics.recordFailure(latencyMs);
    this.checkThresholds(serviceName, metrics);

    if (error) {
      logger.warn('Service operation failed', {
        serviceName,
        latencyMs,
        error: error.message
      });
    }
  }

  /**
   * Helper para medir operaciones automáticamente
   */
  async measure(serviceName, fn, ...args) {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const latency = Date.now() - startTime;
      this.recordSuccess(serviceName, latency);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordFailure(serviceName, latency, error);
      throw error;
    }
  }

  /**
   * Verifica thresholds y genera alertas
   */
  checkThresholds(serviceName, metrics) {
    const stats = metrics.getMetrics();

    // Check error rate
    if (stats.operations.failureRate > this.thresholds.errorRate) {
      this.addAlert({
        severity: 'high',
        serviceName,
        type: 'error_rate',
        message: `High error rate: ${stats.operations.failureRate.toFixed(2)}%`,
        threshold: this.thresholds.errorRate,
        actual: stats.operations.failureRate,
        timestamp: Date.now()
      });
    }

    // Check latency p95
    if (stats.latency.p95 > this.thresholds.latencyP95) {
      this.addAlert({
        severity: 'medium',
        serviceName,
        type: 'latency_p95',
        message: `High p95 latency: ${stats.latency.p95}ms`,
        threshold: this.thresholds.latencyP95,
        actual: stats.latency.p95,
        timestamp: Date.now()
      });
    }

    // Check latency p99
    if (stats.latency.p99 > this.thresholds.latencyP99) {
      this.addAlert({
        severity: 'high',
        serviceName,
        type: 'latency_p99',
        message: `High p99 latency: ${stats.latency.p99}ms`,
        threshold: this.thresholds.latencyP99,
        actual: stats.latency.p99,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Añade una alerta
   */
  addAlert(alert) {
    this.alerts.unshift(alert);

    // Mantener solo las últimas N alertas
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    logger.warn('Metric alert triggered', alert);
  }

  /**
   * Obtiene métricas de un servicio específico
   */
  getMetrics(serviceName) {
    const metrics = this.services.get(serviceName);
    if (!metrics) {
      return null;
    }
    return metrics.getMetrics();
  }

  /**
   * Obtiene métricas de todos los servicios
   */
  getAllMetrics() {
    const allMetrics = {};
    for (const [name, service] of this.services.entries()) {
      allMetrics[name] = service.getMetrics();
    }

    return {
      services: allMetrics,
      globalUptime: Date.now() - this.globalStartTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtiene resumen de métricas
   */
  getSummary() {
    const services = {};
    let totalOperations = 0;
    let totalFailures = 0;

    for (const [name, service] of this.services.entries()) {
      const metrics = service.getMetrics();
      services[name] = {
        operations: metrics.operations.total,
        successRate: metrics.operations.successRate,
        avgLatency: metrics.latency.avg,
        p95: metrics.latency.p95
      };
      totalOperations += metrics.operations.total;
      totalFailures += metrics.operations.failure;
    }

    const globalSuccessRate = totalOperations > 0
      ? ((totalOperations - totalFailures) / totalOperations) * 100
      : 100;

    return {
      summary: {
        totalServices: this.services.size,
        totalOperations,
        totalFailures,
        globalSuccessRate: Math.round(globalSuccessRate * 100) / 100
      },
      services,
      alerts: this.alerts.slice(0, 10), // Últimas 10 alertas
      uptime: Date.now() - this.globalStartTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtiene alertas
   */
  getAlerts(limit = 50) {
    return this.alerts.slice(0, limit);
  }

  /**
   * Limpia alertas
   */
  clearAlerts() {
    const count = this.alerts.length;
    this.alerts = [];
    logger.info('Alerts cleared', { count });
    return count;
  }

  /**
   * Reset de métricas de un servicio
   */
  resetService(serviceName) {
    const metrics = this.services.get(serviceName);
    if (metrics) {
      metrics.reset();
      logger.info('Service metrics reset', { serviceName });
      return true;
    }
    return false;
  }

  /**
   * Reset de todas las métricas
   */
  resetAll() {
    for (const [name, service] of this.services.entries()) {
      service.reset();
    }
    this.alerts = [];
    logger.info('All metrics reset');
  }

  /**
   * Configura thresholds
   */
  setThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
    logger.info('Thresholds updated', { thresholds: this.thresholds });
  }

  /**
   * Formato Prometheus
   * Genera métricas en formato compatible con Prometheus
   */
  toPrometheus() {
    const lines = [];

    for (const [name, service] of this.services.entries()) {
      const metrics = service.getMetrics();
      const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

      // Operations
      lines.push(`# HELP ${safeName}_operations_total Total operations`);
      lines.push(`# TYPE ${safeName}_operations_total counter`);
      lines.push(`${safeName}_operations_total ${metrics.operations.total}`);

      lines.push(`# HELP ${safeName}_operations_success Successful operations`);
      lines.push(`# TYPE ${safeName}_operations_success counter`);
      lines.push(`${safeName}_operations_success ${metrics.operations.success}`);

      lines.push(`# HELP ${safeName}_operations_failure Failed operations`);
      lines.push(`# TYPE ${safeName}_operations_failure counter`);
      lines.push(`${safeName}_operations_failure ${metrics.operations.failure}`);

      // Latency
      lines.push(`# HELP ${safeName}_latency_avg Average latency in milliseconds`);
      lines.push(`# TYPE ${safeName}_latency_avg gauge`);
      lines.push(`${safeName}_latency_avg ${metrics.latency.avg}`);

      lines.push(`# HELP ${safeName}_latency_p95 95th percentile latency`);
      lines.push(`# TYPE ${safeName}_latency_p95 gauge`);
      lines.push(`${safeName}_latency_p95 ${metrics.latency.p95}`);

      lines.push(`# HELP ${safeName}_latency_p99 99th percentile latency`);
      lines.push(`# TYPE ${safeName}_latency_p99 gauge`);
      lines.push(`${safeName}_latency_p99 ${metrics.latency.p99}`);
    }

    return lines.join('\n');
  }

  /**
   * Health check basado en métricas
   */
  healthCheck() {
    const summary = this.getSummary();
    const criticalAlerts = this.alerts.filter(a => a.severity === 'high').length;

    const isHealthy = summary.summary.globalSuccessRate > 90 && criticalAlerts === 0;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      successRate: summary.summary.globalSuccessRate,
      totalOperations: summary.summary.totalOperations,
      criticalAlerts,
      services: this.services.size
    };
  }
}

// Exportar instancia singleton
const metricService = new MetricService();

export default metricService;
export { MetricService, ServiceMetrics, LatencyTracker, OperationCounter };
