/**
 * Inventory Log Model (Enterprise)
 *
 * Tracks all inventory changes for auditing and history
 */

import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    // Product and variant references
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productSnapshot: {
      name: String,
      sku: String,
    },
    variant: {
      variantId: {
        type: String,
        required: true,
        index: true,
      },
      sku: {
        type: String,
        required: true,
      },
      name: String,
    },

    // Change details
    changeType: {
      type: String,
      enum: [
        'sale',           // Stock decreased due to order
        'restock',        // Stock increased (manual or supplier)
        'return',         // Stock increased due to return
        'cancellation',   // Stock increased due to order cancellation
        'adjustment',     // Manual adjustment (audit, damage, etc.)
        'reservation',    // Stock reserved but not yet sold
        'release',        // Reserved stock released back
      ],
      required: true,
      index: true,
    },

    // Stock changes
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    quantityChanged: {
      type: Number,
      required: true,
    },

    // Related entities
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    orderNumber: String,

    // Metadata
    reason: {
      type: String,
      maxlength: 500,
    },
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      userName: String,
      source: {
        type: String,
        enum: ['system', 'admin', 'customer', 'webhook', 'api'],
        default: 'system',
      },
    },
    metadata: {
      type: Map,
      of: String,
    },

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_logs',
  }
);

// Indexes for common queries
inventoryLogSchema.index({ product: 1, timestamp: -1 });
inventoryLogSchema.index({ 'variant.variantId': 1, timestamp: -1 });
inventoryLogSchema.index({ order: 1 });
inventoryLogSchema.index({ changeType: 1, timestamp: -1 });
inventoryLogSchema.index({ 'performedBy.source': 1, timestamp: -1 });

// Compound index for product variant history
inventoryLogSchema.index(
  { product: 1, 'variant.variantId': 1, timestamp: -1 }
);

/**
 * Static method to log inventory change
 *
 * @param {Object} logData - Inventory change data
 * @returns {Promise<InventoryLog>}
 */
inventoryLogSchema.statics.logChange = async function(logData) {
  try {
    const log = await this.create(logData);
    return log;
  } catch (error) {
    console.error('Error creating inventory log:', error);
    throw error;
  }
};

/**
 * Static method to get inventory history for a product variant
 *
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID
 * @param {Object} options - Query options (limit, startDate, endDate)
 * @returns {Promise<Array>}
 */
inventoryLogSchema.statics.getHistory = async function(
  productId,
  variantId,
  options = {}
) {
  const { limit = 50, startDate, endDate } = options;

  const query = {
    product: productId,
    'variant.variantId': variantId,
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('order', 'orderNumber status')
    .populate('performedBy.userId', 'firstName lastName email')
    .lean();
};

/**
 * Static method to get inventory changes by order
 *
 * @param {String} orderId - Order ID
 * @returns {Promise<Array>}
 */
inventoryLogSchema.statics.getByOrder = async function(orderId) {
  return this.find({ order: orderId })
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Static method to get aggregate statistics
 *
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
inventoryLogSchema.statics.getStats = async function(filters = {}) {
  const { startDate, endDate, changeType } = filters;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  if (changeType) {
    matchStage.changeType = changeType;
  }

  const stats = await this.aggregate([
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

  return stats;
};

/**
 * Instance method to format log entry for display
 */
inventoryLogSchema.methods.format = function() {
  return {
    id: this._id,
    product: {
      id: this.product,
      name: this.productSnapshot?.name,
      sku: this.productSnapshot?.sku,
    },
    variant: {
      id: this.variant.variantId,
      sku: this.variant.sku,
      name: this.variant.name,
    },
    change: {
      type: this.changeType,
      previousStock: this.previousStock,
      newStock: this.newStock,
      quantity: this.quantityChanged,
      direction: this.newStock > this.previousStock ? 'increase' : 'decrease',
    },
    order: this.order ? {
      id: this.order,
      number: this.orderNumber,
    } : null,
    performedBy: this.performedBy,
    reason: this.reason,
    timestamp: this.timestamp,
  };
};

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;
