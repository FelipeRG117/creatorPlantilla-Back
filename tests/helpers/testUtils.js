/**
 * Test Utilities
 *
 * Helper functions for testing
 */

import Product from '../../src/models/model.product.js';
import Order from '../../src/models/model.order.js';
import mongoose from 'mongoose';

/**
 * Create a test product with variants
 *
 * @param {Object} overrides - Custom product data
 * @returns {Promise<Product>} Created product
 */
export const createTestProduct = async (overrides = {}) => {
  const defaultProduct = {
    name: 'Test Product',
    slug: `test-product-${Date.now()}`,
    description: 'Test product description',
    shortDescription: 'Test short description',
    sku: `TEST-${Date.now()}`,
    category: 'test-category',
    status: 'published',
    variants: [
      {
        sku: `TEST-VAR-${Date.now()}`,
        name: 'Default Variant',
        attributes: {
          size: 'M',
          color: 'Black',
        },
        pricing: {
          basePrice: 100,
          salePrice: null,
          currency: 'MXN',
        },
        inventory: {
          stock: 10,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: false,
        },
        isActive: true,
      },
    ],
    images: [
      {
        url: 'https://test.com/image.jpg',
        altText: 'Test Image',
        isPrimary: true,
      },
    ],
    isFeatured: false,
    isNewArrival: false,
    tags: ['test'],
  };

  const productData = { ...defaultProduct, ...overrides };
  return await Product.create(productData);
};

/**
 * Create multiple test products
 *
 * @param {number} count - Number of products to create
 * @returns {Promise<Array<Product>>} Created products
 */
export const createTestProducts = async (count = 3) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = await createTestProduct({
      name: `Test Product ${i + 1}`,
      slug: `test-product-${i + 1}-${Date.now()}`,
      sku: `TEST-${i + 1}-${Date.now()}`,
    });
    products.push(product);
  }
  return products;
};

/**
 * Create a test order
 *
 * @param {Object} overrides - Custom order data
 * @returns {Promise<Order>} Created order
 */
export const createTestOrder = async (overrides = {}) => {
  const product = overrides.product || (await createTestProduct());

  const defaultOrder = {
    customer: {
      email: 'test@example.com',
    },
    items: [
      {
        product: product._id,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          category: product.category,
        },
        variant: {
          variantId: product.variants[0]._id?.toString(),
          sku: product.variants[0].sku,
          name: product.variants[0].name,
          attributes: product.variants[0].attributes,
        },
        quantity: 1,
        unitPrice: product.variants[0].pricing.basePrice,
        totalPrice: product.variants[0].pricing.basePrice,
      },
    ],
    pricing: {
      subtotal: 100,
      tax: 16,
      taxRate: 0.16,
      shipping: 0,
      discount: 0,
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
    billingAddress: {
      sameAsShipping: true,
    },
    payment: {
      method: 'stripe',
      status: 'paid',
      paidAt: new Date(),
      stripeSessionId: 'test_session_123',
    },
    status: 'processing',
  };

  const orderData = { ...defaultOrder, ...overrides };
  return await Order.create(orderData);
};

/**
 * Clear all test data from database
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

/**
 * Wait for a condition to be true
 *
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Max time to wait in ms
 * @param {number} interval - Check interval in ms
 */
export const waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

/**
 * Mock Stripe session data
 */
export const mockStripeSession = (overrides = {}) => {
  return {
    id: 'cs_test_123456',
    object: 'checkout.session',
    payment_status: 'paid',
    customer_email: 'test@example.com',
    amount_total: 11600, // $116.00 in cents
    currency: 'mxn',
    metadata: {
      subtotal: '100.00',
      tax: '16.00',
      shipping: '0.00',
      total: '116.00',
    },
    customer_details: {
      email: 'test@example.com',
      name: 'Test User',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'MX',
      },
      phone: '1234567890',
    },
    line_items: {
      data: [
        {
          quantity: 1,
          price: {
            unit_amount: 10000,
            product: {
              metadata: {
                productId: overrides.productId || 'test_product_id',
                variantId: overrides.variantId || 'test_variant_id',
                sku: overrides.sku || 'TEST-SKU-001',
              },
            },
          },
          amount_total: 10000,
        },
      ],
    },
    ...overrides,
  };
};

export default {
  createTestProduct,
  createTestProducts,
  createTestOrder,
  clearDatabase,
  waitFor,
  mockStripeSession,
};
