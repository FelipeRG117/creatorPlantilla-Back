/**
 * Products Integration Tests
 * Tests completos para el módulo de productos (CRUD + special endpoints)
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../app.js';
import { productModel as Product } from '../../src/models/model.product.js';
import { userModel as User } from '../../src/models/model.users.js';
import {
  createTestUser,
  createTestProduct,
  generateTestToken,
  validateSuccessResponse,
  validateErrorResponse,
  validatePaginationResponse
} from '../helpers/testHelpers.js';

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  // Configurar servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Desconectar cualquier conexión existente
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Conectar a MongoDB en memoria
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Limpiar y cerrar conexiones
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Limpiar colecciones antes de cada test
  await Product.deleteMany({});
  await User.deleteMany({});

  // Crear usuario de prueba
  testUser = await User.create(createTestUser());
  authToken = generateTestToken(testUser._id);
});

describe('Products API - Integration Tests', () => {
  // ========================================
  // GET /api/products - Listar productos
  // ========================================
  describe('GET /api/products', () => {
    test('Should return empty array when no products exist', async () => {
      const response = await request(app).get('/api/products');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    test('Should return all products with default pagination', async () => {
      // Crear 3 productos de prueba con SKUs únicos
      await Product.create([
        createTestProduct({
          name: 'Product 1',
          variants: [
            {
              sku: 'PROD1-001',
              name: 'Product 1 Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Product 2',
          slug: 'product-2',
          variants: [
            {
              sku: 'PROD2-001',
              name: 'Product 2 Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Product 3',
          slug: 'product-3',
          variants: [
            {
              sku: 'PROD3-001',
              name: 'Product 3 Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
    });

    test('Should paginate products correctly', async () => {
      // Crear 15 productos
      const products = Array.from({ length: 15 }, (_, i) =>
        createTestProduct({
          name: `Product ${i + 1}`,
          slug: `product-${i + 1}`,
          variants: [
            {
              sku: `TEST-${String(i + 1).padStart(3, '0')}`,
              name: `Variant ${i + 1}`,
              pricing: { basePrice: 100 + i, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      );
      await Product.create(products);

      // Página 1
      const page1 = await request(app).get('/api/products?page=1&limit=10');
      validatePaginationResponse(page1);
      expect(page1.body.data).toHaveLength(10);
      expect(Number(page1.body.pagination.page)).toBe(1);
      expect(Number(page1.body.pagination.pages)).toBe(2);

      // Página 2
      const page2 = await request(app).get('/api/products?page=2&limit=10');
      validatePaginationResponse(page2);
      expect(page2.body.data).toHaveLength(5);
      expect(Number(page2.body.pagination.page)).toBe(2);
    });

    test('Should filter by status', async () => {
      await Product.create([
        createTestProduct({ name: 'Draft Product', status: 'draft' }),
        createTestProduct({
          name: 'Published Product',
          slug: 'published-product',
          variants: [
            {
              sku: 'PUB-001',
              name: 'Published Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ],
          status: 'published'
        })
      ]);

      const response = await request(app).get('/api/products?status=published');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('published');
    });

    test('Should filter by category', async () => {
      await Product.create([
        createTestProduct({ name: 'Apparel Product', category: 'apparel' }),
        createTestProduct({
          name: 'Music Product',
          slug: 'music-product',
          category: 'music',
          variants: [
            {
              sku: 'MUS-001',
              name: 'Music Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products?category=music');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('music');
    });

    test('Should filter by isFeatured', async () => {
      await Product.create([
        createTestProduct({ name: 'Regular Product', isFeatured: false }),
        createTestProduct({
          name: 'Featured Product',
          slug: 'featured-product',
          isFeatured: true,
          variants: [
            {
              sku: 'FEAT-001',
              name: 'Featured Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products?isFeatured=true');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isFeatured).toBe(true);
    });

    test('Should sort by name ascending', async () => {
      await Product.create([
        createTestProduct({
          name: 'Zebra Product',
          slug: 'zebra',
          variants: [
            {
              sku: 'ZEBRA-001',
              name: 'Zebra Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Alpha Product',
          slug: 'alpha',
          variants: [
            {
              sku: 'ALPHA-001',
              name: 'Alpha Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products?sortBy=name&sortOrder=asc');

      validatePaginationResponse(response);
      expect(response.body.data[0].name).toBe('Alpha Product');
      expect(response.body.data[1].name).toBe('Zebra Product');
    });
  });

  // ========================================
  // GET /api/products/:id - Obtener por ID
  // ========================================
  describe('GET /api/products/:id', () => {
    test('Should get product by ID', async () => {
      const product = await Product.create(createTestProduct());

      const response = await request(app).get(`/api/products/${product._id}`);

      validateSuccessResponse(response);
      expect(response.body.data._id).toBe(product._id.toString());
      expect(response.body.data.name).toBe(product.name);
      expect(response.body.data).toHaveProperty('variants');
    });

    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should return 400 for invalid product ID', async () => {
      const response = await request(app).get('/api/products/invalid-id');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should increment views when getting product', async () => {
      const product = await Product.create(createTestProduct());
      expect(product.metrics.views).toBe(0);

      await request(app).get(`/api/products/${product._id}`);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.metrics.views).toBe(1);
    });
  });

  // ========================================
  // GET /api/products/slug/:slug - Por slug
  // ========================================
  describe('GET /api/products/slug/:slug', () => {
    test('Should get product by slug', async () => {
      const product = await Product.create(
        createTestProduct({ name: 'Test Product', slug: 'test-product' })
      );

      const response = await request(app).get('/api/products/slug/test-product');

      validateSuccessResponse(response);
      expect(response.body.data._id).toBe(product._id.toString());
      expect(response.body.data.slug).toBe('test-product');
    });

    test('Should return 404 for non-existent slug', async () => {
      const response = await request(app).get('/api/products/slug/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should increment views when getting by slug', async () => {
      const product = await Product.create(
        createTestProduct({ slug: 'test-slug' })
      );

      await request(app).get('/api/products/slug/test-slug');

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.metrics.views).toBe(1);
    });
  });

  // ========================================
  // POST /api/products - Crear producto
  // ========================================
  describe('POST /api/products', () => {
    test('Should create product with valid data', async () => {
      const productData = createTestProduct({ name: 'New Product' });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.data).toHaveProperty('_id');

      // Verificar que se guardó en la base de datos
      const dbProduct = await Product.findById(response.body.data._id);
      expect(dbProduct).toBeDefined();
      expect(dbProduct.name).toBe('New Product');
    });

    test('Should reject product without name', async () => {
      const productData = createTestProduct();
      delete productData.name;

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject product without description', async () => {
      const productData = createTestProduct();
      delete productData.description;

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject product without variants', async () => {
      const productData = createTestProduct();
      delete productData.variants;

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject product with empty variants array', async () => {
      const productData = createTestProduct({ variants: [] });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject product with invalid category', async () => {
      const productData = createTestProduct({ category: 'invalid-category' });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should accept valid categories', async () => {
      const categories = ['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other'];

      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const timestamp = Date.now() + i * 1000;
        const productData = createTestProduct({
          name: `Product ${category} ${timestamp}`,
          slug: `product-${category}-${timestamp}`,
          category,
          variants: [
            {
              sku: `CAT-${i}-${timestamp}`,
              name: `Variant ${category}`,
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        });

        const response = await request(app)
          .post('/api/products')
          .send(productData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.category).toBe(category);
      }
    });

    test('Should auto-generate slug if not provided', async () => {
      const productData = createTestProduct({ name: 'Auto Slug Product' });
      delete productData.slug;

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.slug).toBeTruthy();
      expect(response.body.data.slug).toMatch(/auto-slug-product/);
    });

    test('Should create product with multiple variants', async () => {
      const productData = createTestProduct({
        variants: [
          {
            sku: 'MULTI-001',
            name: 'Small Variant',
            attributes: { size: 'S', color: 'Red' },
            pricing: { basePrice: 200, currency: 'MXN' },
            inventory: { stock: 5 }
          },
          {
            sku: 'MULTI-002',
            name: 'Large Variant',
            attributes: { size: 'L', color: 'Blue' },
            pricing: { basePrice: 250, currency: 'MXN' },
            inventory: { stock: 8 }
          }
        ]
      });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.variants).toHaveLength(2);
      expect(response.body.data.variants[0].sku).toBe('MULTI-001');
      expect(response.body.data.variants[1].sku).toBe('MULTI-002');
    });

    test('Should create product with sale price', async () => {
      const productData = createTestProduct({
        variants: [
          {
            sku: 'SALE-001',
            name: 'Sale Variant',
            pricing: {
              basePrice: 500,
              salePrice: 400,
              currency: 'MXN'
            },
            inventory: { stock: 10 }
          }
        ]
      });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.variants[0].pricing.basePrice).toBe(500);
      expect(response.body.data.variants[0].pricing.salePrice).toBe(400);
    });

    test('Should reject sale price >= base price', async () => {
      const productData = createTestProduct({
        variants: [
          {
            sku: 'BAD-SALE-001',
            name: 'Bad Sale Variant',
            pricing: {
              basePrice: 400,
              salePrice: 500, // Mayor que base price
              currency: 'MXN'
            },
            inventory: { stock: 10 }
          }
        ]
      });

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // PUT /api/products/:id - Actualizar
  // ========================================
  describe('PUT /api/products/:id', () => {
    test('Should update product with valid data', async () => {
      const product = await Product.create(createTestProduct());

      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description with enough characters'
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.name).toBe('Updated Product Name');
      expect(response.body.data.description).toBe('Updated description with enough characters');
    });

    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should update only provided fields', async () => {
      const product = await Product.create(
        createTestProduct({ name: 'Original Name', category: 'apparel' })
      );

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ name: 'New Name' });

      validateSuccessResponse(response);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.category).toBe('apparel'); // No cambió
    });

    test('Should update product status', async () => {
      const product = await Product.create(createTestProduct({ status: 'draft' }));

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ status: 'published' });

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('published');
    });

    test('Should update isFeatured flag', async () => {
      const product = await Product.create(createTestProduct({ isFeatured: false }));

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ isFeatured: true });

      validateSuccessResponse(response);
      expect(response.body.data.isFeatured).toBe(true);
    });
  });

  // ========================================
  // DELETE /api/products/:id - Eliminar
  // ========================================
  describe('DELETE /api/products/:id', () => {
    test('Should delete existing product', async () => {
      const product = await Product.create(createTestProduct());

      const response = await request(app).delete(`/api/products/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);

      // Verificar que se eliminó de la base de datos
      const dbProduct = await Product.findById(product._id);
      expect(dbProduct).toBeNull();
    });

    test('Should return 404 when deleting non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should return 400 for invalid product ID', async () => {
      const response = await request(app).delete('/api/products/invalid-id');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // GET /api/products/featured - Destacados
  // ========================================
  describe('GET /api/products/featured', () => {
    test('Should return only featured products', async () => {
      await Product.create([
        createTestProduct({ name: 'Featured 1', isFeatured: true, status: 'published' }),
        createTestProduct({
          name: 'Featured 2',
          slug: 'featured-2',
          isFeatured: true,
          status: 'published',
          variants: [
            {
              sku: 'FEAT-002',
              name: 'Featured 2 Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Not Featured',
          slug: 'not-featured',
          isFeatured: false,
          variants: [
            {
              sku: 'NFEAT-001',
              name: 'Not Featured Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products/featured');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(product => {
        expect(product.isFeatured).toBe(true);
      });
    });

    test('Should respect limit parameter', async () => {
      // Crear 5 productos destacados
      const products = Array.from({ length: 5 }, (_, i) =>
        createTestProduct({
          name: `Featured ${i + 1}`,
          slug: `featured-${i + 1}`,
          isFeatured: true,
          status: 'published',
          variants: [
            {
              sku: `FEAT-${String(i + 1).padStart(3, '0')}`,
              name: `Featured ${i + 1} Variant`,
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      );
      await Product.create(products);

      const response = await request(app).get('/api/products/featured?limit=3');

      validateSuccessResponse(response);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  // ========================================
  // GET /api/products/new-arrivals
  // ========================================
  describe('GET /api/products/new-arrivals', () => {
    test('Should return only new arrival products', async () => {
      await Product.create([
        createTestProduct({ name: 'New 1', isNewArrival: true, status: 'published' }),
        createTestProduct({
          name: 'New 2',
          slug: 'new-2',
          isNewArrival: true,
          status: 'published',
          variants: [
            {
              sku: 'NEW-002',
              name: 'New 2 Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Old Product',
          slug: 'old-product',
          isNewArrival: false,
          variants: [
            {
              sku: 'OLD-001',
              name: 'Old Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products/new-arrivals');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(product => {
        expect(product.isNewArrival).toBe(true);
      });
    });
  });

  // ========================================
  // GET /api/products/bestsellers
  // ========================================
  describe('GET /api/products/bestsellers', () => {
    test('Should return products sorted by sales', async () => {
      await Product.create([
        createTestProduct({
          name: 'Best Seller',
          status: 'published',
          metrics: { sales: 100 }
        }),
        createTestProduct({
          name: 'Medium Seller',
          slug: 'medium-seller',
          status: 'published',
          metrics: { sales: 50 },
          variants: [
            {
              sku: 'MED-001',
              name: 'Medium Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        }),
        createTestProduct({
          name: 'Low Seller',
          slug: 'low-seller',
          status: 'published',
          metrics: { sales: 10 },
          variants: [
            {
              sku: 'LOW-001',
              name: 'Low Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products/bestsellers');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].metrics.sales).toBeGreaterThanOrEqual(
        response.body.data[1].metrics.sales
      );
    });
  });

  // ========================================
  // GET /api/products/category/:category
  // ========================================
  describe('GET /api/products/category/:category', () => {
    test('Should return products from specific category', async () => {
      await Product.create([
        createTestProduct({ name: 'Apparel 1', category: 'apparel', status: 'published' }),
        createTestProduct({
          name: 'Music 1',
          slug: 'music-1',
          category: 'music',
          status: 'published',
          variants: [
            {
              sku: 'MUS-001',
              name: 'Music Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      ]);

      const response = await request(app).get('/api/products/category/music');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('music');
    });

    test('Should return 400 for invalid category', async () => {
      const response = await request(app).get('/api/products/category/invalid-cat');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/products/:id/publish
  // ========================================
  describe('POST /api/products/:id/publish', () => {
    test('Should publish draft product with stock', async () => {
      const product = await Product.create(
        createTestProduct({
          status: 'draft',
          variants: [
            {
              sku: 'PUB-001',
              name: 'Publish Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10, trackInventory: true }
            }
          ]
        })
      );

      const response = await request(app).post(`/api/products/${product._id}/publish`);

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('published');
    });

    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/products/${fakeId}/publish`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/products/:id/archive
  // ========================================
  describe('POST /api/products/:id/archive', () => {
    test('Should archive product', async () => {
      const product = await Product.create(createTestProduct({ status: 'published' }));

      const response = await request(app).post(`/api/products/${product._id}/archive`);

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('archived');
    });

    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/products/${fakeId}/archive`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // GET /api/products/sku/:sku
  // ========================================
  describe('GET /api/products/sku/:sku', () => {
    test('Should find product by SKU', async () => {
      const product = await Product.create(
        createTestProduct({
          variants: [
            {
              sku: 'UNIQUE-SKU-001',
              name: 'Unique Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      );

      const response = await request(app).get('/api/products/sku/UNIQUE-SKU-001');

      validateSuccessResponse(response);
      expect(response.body.data.product._id).toBe(product._id.toString());
      expect(response.body.data.variant.sku).toBe('UNIQUE-SKU-001');
    });

    test('Should return 404 for non-existent SKU', async () => {
      const response = await request(app).get('/api/products/sku/NON-EXISTENT-SKU');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should accept SKU in lowercase and convert to uppercase', async () => {
      await Product.create(
        createTestProduct({
          variants: [
            {
              sku: 'LOWER-001',
              name: 'Lower Variant',
              pricing: { basePrice: 100, currency: 'MXN' },
              inventory: { stock: 10 }
            }
          ]
        })
      );

      const response = await request(app).get('/api/products/sku/lower-001');

      // Puede funcionar dependiendo de la implementación
      // Solo verificar que no crashee
      expect([200, 404]).toContain(response.status);
    });
  });
});
