/**
 * Order Controller (Enterprise)
 *
 * Handles all order-related operations:
 * - Create order (from Stripe webhook)
 * - Get all orders (admin)
 * - Get order by ID/number
 * - Update order status
 * - Cancel order
 */

import Order from '../models/model.order.js';
import { logger } from '../config/logger.js';

/**
 * Create a new order
 *
 * @route   POST /api/orders
 * @access  Private (Admin or System)
 */
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    // Create order
    const order = await Order.create(orderData);

    logger.info('Order created successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      total: order.pricing.total,
    });

    res.status(201).json({
      success: true,
      data: order,
    });

  } catch (error) {
    logger.error('Error creating order', {
      error: error.message,
      stack: error.stack,
    });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        messages,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error creating order',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all orders with pagination and filters
 *
 * @route   GET /api/orders
 * @access  Private (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      email,
      orderNumber,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (email) filter['customer.email'] = email.toLowerCase();
    if (orderNumber) filter.orderNumber = orderNumber;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name slug category')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Order.countDocuments(filter),
    ]);

    logger.info('Orders retrieved', {
      count: orders.length,
      total,
      page,
      filters: filter,
    });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    logger.error('Error fetching orders', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching orders',
    });
  }
};

/**
 * Get order by ID or order number
 *
 * @route   GET /api/orders/:identifier
 * @access  Public (with email verification) or Private (Admin)
 */
export const getOrderById = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by orderNumber first, then by _id
    let order = await Order.findOne({
      orderNumber: identifier,
      isDeleted: false,
    }).populate('items.product', 'name slug category images');

    if (!order) {
      order = await Order.findOne({
        _id: identifier,
        isDeleted: false,
      }).populate('items.product', 'name slug category images');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    logger.info('Order retrieved', {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    logger.error('Error fetching order', {
      error: error.message,
      identifier: req.params.identifier,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching order',
    });
  }
};

/**
 * Get orders by customer email
 *
 * @route   GET /api/orders/customer/:email
 * @access  Public (with email verification) or Private (Admin)
 */
export const getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const orders = await Order.findByEmail(email)
      .populate('items.product', 'name slug category images')
      .lean();

    logger.info('Customer orders retrieved', {
      email,
      count: orders.length,
    });

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });

  } catch (error) {
    logger.error('Error fetching customer orders', {
      error: error.message,
      email: req.params.email,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching customer orders',
    });
  }
};

/**
 * Update order status
 *
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingInfo, notes } = req.body;

    const order = await Order.findById(id);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Update based on status
    switch (status) {
      case 'shipped':
        if (!trackingInfo) {
          return res.status(400).json({
            success: false,
            error: 'Tracking information required for shipped status',
          });
        }
        await order.markAsShipped(trackingInfo);
        break;

      case 'delivered':
        await order.markAsDelivered();
        break;

      case 'cancelled':
        if (!notes) {
          return res.status(400).json({
            success: false,
            error: 'Cancellation reason required',
          });
        }
        await order.cancel(notes, 'admin');
        break;

      default:
        order.status = status;
        if (notes) order.notes.internal = notes;
        await order.save();
    }

    logger.info('Order status updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus: order.status,
      newStatus: status,
    });

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    logger.error('Error updating order status', {
      error: error.message,
      orderId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Error updating order status',
    });
  }
};

/**
 * Cancel order
 *
 * @route   PUT /api/orders/:id/cancel
 * @access  Public (customer with email) or Private (Admin)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, email } = req.body;

    const order = await Order.findById(id);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Verificar que el email coincida (si es customer)
    if (email && order.customer.email !== email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Email does not match order',
      });
    }

    // No permitir cancelar si ya está enviado o entregado
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel order that has been shipped or delivered',
      });
    }

    await order.cancel(reason, email ? 'customer' : 'admin');

    logger.info('Order cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      cancelledBy: email ? 'customer' : 'admin',
    });

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    logger.error('Error cancelling order', {
      error: error.message,
      orderId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Error cancelling order',
    });
  }
};

/**
 * Get order statistics (admin dashboard)
 *
 * @route   GET /api/orders/stats
 * @access  Private (Admin)
 */
export const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = { isDeleted: false };
    if (Object.keys(dateFilter).length > 0) {
      filter.createdAt = dateFilter;
    }

    const [
      totalOrders,
      totalRevenue,
      statusBreakdown,
      paymentStatusBreakdown,
    ] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: '$payment.status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      paymentStatusBreakdown: paymentStatusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    logger.info('Order stats retrieved', stats);

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    logger.error('Error fetching order stats', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Error fetching order statistics',
    });
  }
};
