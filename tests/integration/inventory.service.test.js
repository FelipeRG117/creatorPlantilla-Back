/**
 * Inventory Service Tests
 *
 * CRITICAL TESTS - Prevent overselling and inventory issues
 * These tests ensure business integrity
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import {
  decreaseStock,
  increaseStock,
  validateStock,
  getLowStockAlerts,
} from '../../src/services/inventory.service.js';
import Product from '../../src/models/model.product.js';
import InventoryLog from '../../src/models/model.inventoryLog.js';
import { createTestProduct } from '../helpers/testUtils.js';

describe('Inventory Service - Critical Business Logic', () => {
  beforeEach(async () => {
    // Clear database before each test
    await Product.deleteMany({});
    await InventoryLog.deleteMany({});
  });

  describe('decreaseStock()', () => {
    test('should decrease stock correctly for single item', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'TEST-001',
            name: 'Test Variant',
            attributes: { size: 'M' },
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 10,
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      const orderItems = [
        {
          product: product._id,
          variant: {
            variantId: product.variants[0]._id.toString(),
            sku: 'TEST-001',
          },
          quantity: 3,
          orderId: new mongoose.Types.ObjectId(),
          orderNumber: 'ORD-TEST-001',
        },
      ];

      // Act
      const result = await decreaseStock(orderItems);

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedItems).toHaveLength(1);
      expect(result.updatedItems[0].previousStock).toBe(10);
      expect(result.updatedItems[0].newStock).toBe(7);
      expect(result.errors).toHaveLength(0);

      // Verify database was updated
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.variants[0].inventory.stock).toBe(7);

      // Verify inventory log was created
      const logs = await InventoryLog.find({ product: product._id });
      expect(logs).toHaveLength(1);
      expect(logs[0].changeType).toBe('sale');
      expect(logs[0].quantityChanged).toBe(3);
    });

    test('should PREVENT overselling - insufficient stock', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'TEST-002',
            name: 'Low Stock Item',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 2, // Only 2 in stock
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      const orderItems = [
        {
          product: product._id,
          variant: {
            variantId: product.variants[0]._id.toString(),
            sku: 'TEST-002',
          },
          quantity: 5, // Trying to buy 5 but only 2 available
        },
      ];

      // Act
      const result = await decreaseStock(orderItems);

      // Assert - CRITICAL: Should FAIL
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Insufficient stock');
      expect(result.errors[0].currentStock).toBe(2);
      expect(result.errors[0].requestedQuantity).toBe(5);

      // Verify stock was NOT changed
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.variants[0].inventory.stock).toBe(2); // Still 2
    });

    test('should PREVENT overselling - out of stock', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'TEST-003',
            name: 'Out of Stock',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 0, // Out of stock
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      const orderItems = [
        {
          product: product._id,
          variant: {
            variantId: product.variants[0]._id.toString(),
            sku: 'TEST-003',
          },
          quantity: 1,
        },
      ];

      // Act
      const result = await decreaseStock(orderItems);

      // Assert - CRITICAL: Should FAIL
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].currentStock).toBe(0);
    });

    test('should handle multiple items correctly', async () => {
      // Arrange
      const product1 = await createTestProduct({
        name: 'Product 1',
        sku: 'PROD-001',
        variants: [
          {
            sku: 'VAR-001',
            name: 'Variant 1',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: { stock: 10, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const product2 = await createTestProduct({
        name: 'Product 2',
        sku: 'PROD-002',
        variants: [
          {
            sku: 'VAR-002',
            name: 'Variant 2',
            attributes: {},
            pricing: { basePrice: 200, currency: 'MXN' },
            inventory: { stock: 5, lowStockThreshold: 2, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const orderItems = [
        {
          product: product1._id,
          variant: { variantId: product1.variants[0]._id.toString(), sku: 'VAR-001' },
          quantity: 2,
        },
        {
          product: product2._id,
          variant: { variantId: product2.variants[0]._id.toString(), sku: 'VAR-002' },
          quantity: 1,
        },
      ];

      // Act
      const result = await decreaseStock(orderItems);

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedItems).toHaveLength(2);

      const updated1 = await Product.findById(product1._id);
      const updated2 = await Product.findById(product2._id);

      expect(updated1.variants[0].inventory.stock).toBe(8); // 10 - 2
      expect(updated2.variants[0].inventory.stock).toBe(4); // 5 - 1
    });

    test('should create inventory log for each stock decrease', async () => {
      // Arrange
      const product = await createTestProduct();
      const orderItems = [
        {
          product: product._id,
          variant: {
            variantId: product.variants[0]._id.toString(),
            sku: product.variants[0].sku,
          },
          quantity: 2,
          orderId: new mongoose.Types.ObjectId(),
          orderNumber: 'ORD-LOG-TEST',
        },
      ];

      // Act
      await decreaseStock(orderItems);

      // Assert
      const logs = await InventoryLog.find({ product: product._id });
      expect(logs).toHaveLength(1);
      expect(logs[0].changeType).toBe('sale');
      expect(logs[0].orderNumber).toBe('ORD-LOG-TEST');
      expect(logs[0].previousStock).toBe(10);
      expect(logs[0].newStock).toBe(8);
      expect(logs[0].quantityChanged).toBe(2);
    });
  });

  describe('increaseStock()', () => {
    test('should increase stock for returns/cancellations', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'TEST-RETURN',
            name: 'Returnable Item',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: { stock: 5, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const orderItems = [
        {
          product: product._id,
          variant: {
            variantId: product.variants[0]._id.toString(),
            sku: 'TEST-RETURN',
          },
          quantity: 3,
        },
      ];

      // Act
      const result = await increaseStock(orderItems);

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedItems).toHaveLength(1);
      expect(result.updatedItems[0].previousStock).toBe(5);
      expect(result.updatedItems[0].newStock).toBe(8);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.variants[0].inventory.stock).toBe(8);
    });
  });

  describe('validateStock()', () => {
    test('should validate available stock before checkout', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'VAL-001',
            name: 'Validation Test',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: { stock: 10, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const cartItems = [
        {
          product: {
            _id: product._id,
            name: product.name,
            variants: product.variants,
          },
          quantity: 5,
        },
      ];

      // Act
      const result = await validateStock(cartItems);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.outOfStock).toHaveLength(0);
      expect(result.insufficientStock).toHaveLength(0);
    });

    test('should detect out of stock items', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'VAL-002',
            name: 'Out of Stock',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: { stock: 0, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const cartItems = [
        {
          product: { _id: product._id, name: product.name, variants: product.variants },
          quantity: 1,
        },
      ];

      // Act
      const result = await validateStock(cartItems);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.outOfStock).toHaveLength(1);
      expect(result.outOfStock[0].availableStock).toBe(0);
    });

    test('should detect insufficient stock', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'VAL-003',
            name: 'Low Stock',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: { stock: 3, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      const cartItems = [
        {
          product: { _id: product._id, name: product.name, variants: product.variants },
          quantity: 5, // Want 5 but only 3 available
        },
      ];

      // Act
      const result = await validateStock(cartItems);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.insufficientStock).toHaveLength(1);
      expect(result.insufficientStock[0].availableStock).toBe(3);
      expect(result.insufficientStock[0].requestedQuantity).toBe(5);
    });
  });

  describe('getLowStockAlerts()', () => {
    test('should identify products with low stock', async () => {
      // Arrange
      await createTestProduct({
        name: 'Low Stock Product',
        variants: [
          {
            sku: 'LOW-001',
            name: 'Low Variant',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 3, // Below threshold of 5
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      await createTestProduct({
        name: 'Good Stock Product',
        variants: [
          {
            sku: 'GOOD-001',
            name: 'Good Variant',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 20,
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      // Act
      const alerts = await getLowStockAlerts();

      // Assert
      expect(alerts).toHaveLength(1);
      expect(alerts[0].variantSku).toBe('LOW-001');
      expect(alerts[0].currentStock).toBe(3);
      expect(alerts[0].threshold).toBe(5);
      expect(alerts[0].status).toBe('LOW_STOCK');
    });

    test('should identify out of stock products', async () => {
      // Arrange
      await createTestProduct({
        name: 'Out of Stock',
        variants: [
          {
            sku: 'OUT-001',
            name: 'Out Variant',
            attributes: {},
            pricing: { basePrice: 100, currency: 'MXN' },
            inventory: {
              stock: 0,
              lowStockThreshold: 5,
              trackInventory: true,
              allowBackorder: false,
            },
            isActive: true,
          },
        ],
      });

      // Act
      const alerts = await getLowStockAlerts();

      // Assert
      expect(alerts).toHaveLength(1);
      expect(alerts[0].status).toBe('OUT_OF_STOCK');
      expect(alerts[0].currentStock).toBe(0);
    });
  });
});
