/**
 * Order Routes (Enterprise)
 *
 * Handles order management endpoints
 */

import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByEmail,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from '../controllers/controller.order.js';

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Admin/System)
 */
router.post('/', createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with pagination and filters
 * @access  Private (Admin)
 */
router.get('/', getAllOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics for admin dashboard
 * @access  Private (Admin)
 */
router.get('/stats', getOrderStats);

/**
 * @route   GET /api/orders/customer/:email
 * @desc    Get orders by customer email
 * @access  Public (with email verification) or Private (Admin)
 */
router.get('/customer/:email', getOrdersByEmail);

/**
 * @route   GET /api/orders/:identifier
 * @desc    Get order by ID or order number
 * @access  Public (with email verification) or Private (Admin)
 */
router.get('/:identifier', getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.put('/:id/status', updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Public (customer with email) or Private (Admin)
 */
router.put('/:id/cancel', cancelOrder);

export { router as routesOrders };
