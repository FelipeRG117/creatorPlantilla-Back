/**
 * Order Model Tests
 *
 * Tests for order creation and business logic
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import Order from '../../src/models/model.order.js';
import { createTestProduct, createTestOrder } from '../helpers/testUtils.js';

describe('Order Model - Business Logic', () => {
  beforeEach(async () => {
    await Order.deleteMany({});
  });

  describe('Order Creation', () => {
    test('should create order with auto-generated order number', async () => {
      // Arrange
      const product = await createTestProduct();

      // Act
      const order = await createTestOrder({ product });

      // Assert
      expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
      expect(order.status).toBe('processing');
      expect(order.payment.status).toBe('paid');
    });

    test('should create sequential order numbers on same day', async () => {
      // Arrange & Act
      const order1 = await createTestOrder();
      const order2 = await createTestOrder();
      const order3 = await createTestOrder();

      // Assert
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      expect(order1.orderNumber).toBe(`ORD-${dateStr}-0001`);
      expect(order2.orderNumber).toBe(`ORD-${dateStr}-0002`);
      expect(order3.orderNumber).toBe(`ORD-${dateStr}-0003`);
    });

    test('should calculate pricing correctly', async () => {
      // Arrange
      const product = await createTestProduct({
        variants: [
          {
            sku: 'PRICE-TEST',
            name: 'Price Test',
            attributes: {},
            pricing: { basePrice: 1000, currency: 'MXN' },
            inventory: { stock: 10, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
            isActive: true,
          },
        ],
      });

      // Act
      const order = await createTestOrder({
        product,
        items: [
          {
            product: product._id,
            productSnapshot: {
              name: product.name,
              slug: product.slug,
              category: product.category,
            },
            variant: {
              variantId: product.variants[0]._id.toString(),
              sku: 'PRICE-TEST',
              name: 'Price Test',
              attributes: {},
            },
            quantity: 2,
            unitPrice: 1000,
            totalPrice: 2000,
          },
        ],
        pricing: {
          subtotal: 2000,
          tax: 320, // 16% of 2000
          taxRate: 0.16,
          shipping: 0, // Free shipping over 1000
          discount: 0,
          total: 2320,
          currency: 'MXN',
        },
      });

      // Assert
      expect(order.pricing.subtotal).toBe(2000);
      expect(order.pricing.tax).toBe(320);
      expect(order.pricing.shipping).toBe(0);
      expect(order.pricing.total).toBe(2320);
    });

    test('should require customer email', async () => {
      // Arrange
      const product = await createTestProduct();
      const orderData = {
        customer: {
          // Missing email
        },
        items: [
          {
            product: product._id,
            productSnapshot: { name: product.name, slug: product.slug, category: product.category },
            variant: {
              variantId: product.variants[0]._id.toString(),
              sku: product.variants[0].sku,
              name: product.variants[0].name,
              attributes: {},
            },
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
        pricing: {
          subtotal: 100,
          tax: 16,
          taxRate: 0.16,
          shipping: 0,
          total: 116,
          currency: 'MXN',
        },
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'MX',
          phone: '1234567890',
        },
        billingAddress: { sameAsShipping: true },
        payment: {
          method: 'stripe',
          status: 'paid',
          paidAt: new Date(),
        },
        status: 'processing',
      };

      // Act & Assert
      await expect(Order.create(orderData)).rejects.toThrow();
    });

    test('should store product snapshot for historical record', async () => {
      // Arrange
      const product = await createTestProduct({
        name: 'Original Product Name',
      });

      // Act
      const order = await createTestOrder({ product });

      // Update product name after order is placed
      product.name = 'Updated Product Name';
      await product.save();

      // Assert - Order should keep original name
      const savedOrder = await Order.findById(order._id);
      expect(savedOrder.items[0].productSnapshot.name).toBe('Original Product Name');
    });

    test('should validate status enum', async () => {
      // Arrange
      const product = await createTestProduct();

      // Act & Assert
      await expect(
        createTestOrder({
          product,
          status: 'invalid-status',
        })
      ).rejects.toThrow();
    });

    test('should create order with multiple items', async () => {
      // Arrange
      const product1 = await createTestProduct({ name: 'Product 1' });
      const product2 = await createTestProduct({ name: 'Product 2' });

      // Act
      const order = await createTestOrder({
        items: [
          {
            product: product1._id,
            productSnapshot: { name: product1.name, slug: product1.slug, category: product1.category },
            variant: {
              variantId: product1.variants[0]._id.toString(),
              sku: product1.variants[0].sku,
              name: product1.variants[0].name,
              attributes: {},
            },
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
          {
            product: product2._id,
            productSnapshot: { name: product2.name, slug: product2.slug, category: product2.category },
            variant: {
              variantId: product2.variants[0]._id.toString(),
              sku: product2.variants[0].sku,
              name: product2.variants[0].name,
              attributes: {},
            },
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
          },
        ],
        pricing: {
          subtotal: 350,
          tax: 56,
          taxRate: 0.16,
          shipping: 0,
          total: 406,
          currency: 'MXN',
        },
      });

      // Assert
      expect(order.items).toHaveLength(2);
      expect(order.pricing.subtotal).toBe(350);
    });
  });

  describe('Order Status Transitions', () => {
    test('should allow valid status transitions', async () => {
      // Arrange
      const order = await createTestOrder({ status: 'pending' });

      // Act & Assert - Valid transitions
      order.status = 'processing';
      await order.save();
      expect(order.status).toBe('processing');

      order.status = 'shipped';
      await order.save();
      expect(order.status).toBe('shipped');

      order.status = 'delivered';
      await order.save();
      expect(order.status).toBe('delivered');
    });

    test('should allow order cancellation', async () => {
      // Arrange
      const order = await createTestOrder({ status: 'pending' });

      // Act
      order.status = 'cancelled';
      await order.save();

      // Assert
      expect(order.status).toBe('cancelled');
    });
  });

  describe('Order Queries', () => {
    test('should find orders by customer email', async () => {
      // Arrange
      await createTestOrder({ customer: { email: 'customer1@test.com' } });
      await createTestOrder({ customer: { email: 'customer1@test.com' } });
      await createTestOrder({ customer: { email: 'customer2@test.com' } });

      // Act
      const customer1Orders = await Order.find({ 'customer.email': 'customer1@test.com' });

      // Assert
      expect(customer1Orders).toHaveLength(2);
    });

    test('should find orders by status', async () => {
      // Arrange
      await createTestOrder({ status: 'pending' });
      await createTestOrder({ status: 'processing' });
      await createTestOrder({ status: 'shipped' });
      await createTestOrder({ status: 'shipped' });

      // Act
      const shippedOrders = await Order.find({ status: 'shipped' });

      // Assert
      expect(shippedOrders).toHaveLength(2);
    });

    test('should find orders by date range', async () => {
      // Arrange
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const order1 = await createTestOrder();
      order1.createdAt = yesterday;
      await order1.save();

      const order2 = await createTestOrder();

      // Act
      const todayOrders = await Order.find({
        createdAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
        },
      });

      // Assert
      expect(todayOrders).toHaveLength(1);
      expect(todayOrders[0]._id.toString()).toBe(order2._id.toString());
    });
  });

  describe('Order Notes', () => {
    test('should allow adding notes to order', async () => {
      // Arrange
      const order = await createTestOrder();

      // Act
      order.notes.push({
        author: 'Admin',
        content: 'Customer requested expedited shipping',
        isPrivate: false,
      });
      await order.save();

      // Assert
      const savedOrder = await Order.findById(order._id);
      expect(savedOrder.notes).toHaveLength(1);
      expect(savedOrder.notes[0].content).toBe('Customer requested expedited shipping');
      expect(savedOrder.notes[0].author).toBe('Admin');
    });

    test('should support private notes', async () => {
      // Arrange
      const order = await createTestOrder();

      // Act
      order.notes.push({
        author: 'System',
        content: 'Payment flagged for review',
        isPrivate: true,
      });
      await order.save();

      // Assert
      const savedOrder = await Order.findById(order._id);
      expect(savedOrder.notes[0].isPrivate).toBe(true);
    });
  });

  describe('Soft Delete', () => {
    test('should soft delete orders instead of hard delete', async () => {
      // Arrange
      const order = await createTestOrder();

      // Act
      order.deletedAt = new Date();
      order.isDeleted = true;
      await order.save();

      // Assert
      const deletedOrder = await Order.findById(order._id);
      expect(deletedOrder.isDeleted).toBe(true);
      expect(deletedOrder.deletedAt).toBeDefined();

      // Should still exist in database
      const allOrders = await Order.find({});
      expect(allOrders).toHaveLength(1);

      // Query only active orders
      const activeOrders = await Order.find({ isDeleted: false });
      expect(activeOrders).toHaveLength(0);
    });
  });
});
