/**
 * Inventory Controller
 *
 * Handle inventory-related requests
 */

import InventoryLog from '../models/model.inventoryLog.js';
import { logger } from '../config/logger.js';

/**
 * Get all inventory logs
 *
 * @route   GET /api/inventory/logs
 * @access  Admin
 */
export const getInventoryLogs = async (req, res) => {
  try {
    const { limit = 100, startDate, endDate, changeType, productId } = req.query;

    const query = {};

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Filter by change type
    if (changeType) {
      query.changeType = changeType;
    }

    // Filter by product
    if (productId) {
      query.product = productId;
    }

    const logs = await InventoryLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('product', 'name sku')
      .populate('order', 'orderNumber')
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    logger.error('Error fetching inventory logs', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching inventory logs',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get inventory logs for specific product
 *
 * @route   GET /api/inventory/logs/product/:productId
 * @access  Admin
 */
export const getProductInventoryLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, limit = 50 } = req.query;

    const query = { product: productId };

    if (variantId) {
      query['variant.variantId'] = variantId;
    }

    const logs = await InventoryLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('order', 'orderNumber status')
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    logger.error('Error fetching product inventory logs', {
      error: error.message,
      productId: req.params.productId,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching product inventory logs',
    });
  }
};

/**
 * Get inventory statistics
 *
 * @route   GET /api/inventory/stats
 * @access  Admin
 */
export const getInventoryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const stats = await InventoryLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$changeType',
          count: { $sum: 1 },
          totalQuantityChanged: { $sum: '$quantityChanged' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching inventory stats', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching inventory stats',
    });
  }
};

export default {
  getInventoryLogs,
  getProductInventoryLogs,
  getInventoryStats,
};
