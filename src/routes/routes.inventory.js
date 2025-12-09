/**
 * Inventory Routes
 *
 * Routes for inventory management and logs
 */

import express from 'express';
import {
  getInventoryLogs,
  getProductInventoryLogs,
  getInventoryStats,
} from '../controllers/controller.inventory.js';

const router = express.Router();

/**
 * @route   GET /api/inventory/logs
 * @desc    Get all inventory logs with optional filters
 * @access  Admin
 */
router.get('/logs', getInventoryLogs);

/**
 * @route   GET /api/inventory/logs/product/:productId
 * @desc    Get inventory logs for specific product
 * @access  Admin
 */
router.get('/logs/product/:productId', getProductInventoryLogs);

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory statistics
 * @access  Admin
 */
router.get('/stats', getInventoryStats);

export default router;
