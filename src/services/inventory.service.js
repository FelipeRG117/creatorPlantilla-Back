/**
 * Inventory Service
 *
 * Handles inventory management operations including stock updates,
 * validation, and inventory history tracking
 */

import Product from '../models/model.product.js';
import InventoryLog from '../models/model.inventoryLog.js';
import { logger } from '../config/logger.js';

/**
 * Decrease product variant stock after successful order
 *
 * @param {Array} orderItems - Array of order items with product and variant info
 * @returns {Promise<Object>} Result with success status and updated items
 */
export const decreaseStock = async (orderItems) => {
  const results = {
    success: true,
    updatedItems: [],
    errors: [],
  };

  try {
    // Process each item in the order
    for (const item of orderItems) {
      try {
        const product = await Product.findById(item.product);

        if (!product) {
          results.errors.push({
            productId: item.product,
            error: 'Product not found',
          });
          results.success = false;
          continue;
        }

        // Find the specific variant
        const variant = product.variants.find(
          (v) => v._id?.toString() === item.variant.variantId
        );

        if (!variant) {
          results.errors.push({
            productId: item.product,
            variantId: item.variant.variantId,
            error: 'Variant not found',
          });
          results.success = false;
          continue;
        }

        // Check if we have enough stock
        const currentStock = variant.inventory.stock;
        const requestedQuantity = item.quantity;

        if (currentStock < requestedQuantity) {
          results.errors.push({
            productId: item.product,
            variantId: variant._id,
            currentStock,
            requestedQuantity,
            error: 'Insufficient stock',
          });
          results.success = false;
          continue;
        }

        // Decrease stock
        variant.inventory.stock -= requestedQuantity;

        // Save the product with updated variant
        await product.save();

        // Log inventory change
        try {
          await InventoryLog.logChange({
            product: product._id,
            productSnapshot: {
              name: product.name,
              sku: product.sku,
            },
            variant: {
              variantId: variant._id?.toString(),
              sku: variant.sku,
              name: variant.name,
            },
            changeType: 'sale',
            previousStock: currentStock,
            newStock: variant.inventory.stock,
            quantityChanged: requestedQuantity,
            order: item.orderId || null,
            orderNumber: item.orderNumber || null,
            reason: 'Stock decreased due to order',
            performedBy: {
              source: 'system',
            },
          });
        } catch (logError) {
          logger.error('Failed to log inventory change', {
            error: logError.message,
            productId: product._id,
          });
          // Don't fail the operation if logging fails
        }

        results.updatedItems.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          variantSku: variant.sku,
          previousStock: currentStock,
          newStock: variant.inventory.stock,
          quantityDecreased: requestedQuantity,
        });

        logger.info('Stock decreased successfully', {
          productId: product._id,
          variantSku: variant.sku,
          previousStock: currentStock,
          newStock: variant.inventory.stock,
        });
      } catch (itemError) {
        logger.error('Error processing item stock decrease', {
          item,
          error: itemError.message,
        });
        results.errors.push({
          productId: item.product,
          error: itemError.message,
        });
        results.success = false;
      }
    }

    return results;
  } catch (error) {
    logger.error('Critical error in decreaseStock service', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Increase product variant stock (for cancellations or returns)
 *
 * @param {Array} orderItems - Array of order items to restore stock
 * @returns {Promise<Object>} Result with success status and updated items
 */
export const increaseStock = async (orderItems) => {
  const results = {
    success: true,
    updatedItems: [],
    errors: [],
  };

  try {
    for (const item of orderItems) {
      try {
        const product = await Product.findById(item.product);

        if (!product) {
          results.errors.push({
            productId: item.product,
            error: 'Product not found',
          });
          continue;
        }

        const variant = product.variants.find(
          (v) => v._id?.toString() === item.variant.variantId
        );

        if (!variant) {
          results.errors.push({
            productId: item.product,
            variantId: item.variant.variantId,
            error: 'Variant not found',
          });
          continue;
        }

        const previousStock = variant.inventory.stock;
        variant.inventory.stock += item.quantity;

        await product.save();

        results.updatedItems.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          variantSku: variant.sku,
          previousStock,
          newStock: variant.inventory.stock,
          quantityIncreased: item.quantity,
        });

        logger.info('Stock increased successfully', {
          productId: product._id,
          variantSku: variant.sku,
          previousStock,
          newStock: variant.inventory.stock,
        });
      } catch (itemError) {
        logger.error('Error processing item stock increase', {
          item,
          error: itemError.message,
        });
        results.errors.push({
          productId: item.product,
          error: itemError.message,
        });
      }
    }

    return results;
  } catch (error) {
    logger.error('Critical error in increaseStock service', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Check if products have sufficient stock for order
 *
 * @param {Array} cartItems - Array of cart items to validate
 * @returns {Promise<Object>} Validation result with availability info
 */
export const validateStock = async (cartItems) => {
  const validation = {
    isValid: true,
    items: [],
    outOfStock: [],
    insufficientStock: [],
  };

  try {
    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        validation.isValid = false;
        validation.outOfStock.push({
          productId: item.product._id,
          productName: item.product.name,
          reason: 'Product not found',
        });
        continue;
      }

      // Find active variant
      const variant = product.variants.find((v) => v.isActive);

      if (!variant) {
        validation.isValid = false;
        validation.outOfStock.push({
          productId: product._id,
          productName: product.name,
          reason: 'No active variant available',
        });
        continue;
      }

      const availableStock = variant.inventory.stock;
      const requestedQuantity = item.quantity;

      if (availableStock === 0) {
        validation.isValid = false;
        validation.outOfStock.push({
          productId: product._id,
          productName: product.name,
          variantSku: variant.sku,
          availableStock: 0,
          requestedQuantity,
        });
      } else if (availableStock < requestedQuantity) {
        validation.isValid = false;
        validation.insufficientStock.push({
          productId: product._id,
          productName: product.name,
          variantSku: variant.sku,
          availableStock,
          requestedQuantity,
          message: `Only ${availableStock} units available`,
        });
      } else {
        validation.items.push({
          productId: product._id,
          productName: product.name,
          variantSku: variant.sku,
          availableStock,
          requestedQuantity,
          isAvailable: true,
        });
      }
    }

    return validation;
  } catch (error) {
    logger.error('Error validating stock', { error: error.message });
    throw error;
  }
};

/**
 * Get low stock alerts
 * Returns products with stock below low stock threshold
 *
 * @returns {Promise<Array>} Array of products with low stock
 */
export const getLowStockAlerts = async () => {
  try {
    const products = await Product.find({ status: 'published' });

    const lowStockItems = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        if (
          variant.isActive &&
          variant.inventory.trackInventory &&
          variant.inventory.stock <= variant.inventory.lowStockThreshold
        ) {
          lowStockItems.push({
            productId: product._id,
            productName: product.name,
            variantId: variant._id,
            variantSku: variant.sku,
            currentStock: variant.inventory.stock,
            threshold: variant.inventory.lowStockThreshold,
            status:
              variant.inventory.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          });
        }
      });
    });

    return lowStockItems;
  } catch (error) {
    logger.error('Error getting low stock alerts', { error: error.message });
    throw error;
  }
};

export default {
  decreaseStock,
  increaseStock,
  validateStock,
  getLowStockAlerts,
};
