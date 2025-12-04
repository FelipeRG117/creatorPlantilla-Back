/**
 * Test Helpers
 * Utilidades comunes para tests
 */

import jwt from 'jsonwebtoken';

/**
 * Generar token JWT para tests
 */
export function generateTestToken(userId, role = 'user') {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

/**
 * Crear usuario de prueba
 */
export function createTestUser(overrides = {}) {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'Test123!@#',
    role: 'user',
    isActive: true,
    ...overrides
  };
}

/**
 * Crear admin de prueba
 */
export function createTestAdmin(overrides = {}) {
  return createTestUser({
    email: 'admin@example.com',
    role: 'admin',
    ...overrides
  });
}

/**
 * Crear álbum de prueba
 */
export function createTestAlbum(overrides = {}) {
  return {
    title: 'Test Album',
    artist: 'Mariachi Gago',
    releaseDate: new Date('2024-01-01'),
    genre: ['Mariachi', 'Regional Mexican'],
    description: 'Test album description',
    coverImage: 'https://res.cloudinary.com/test/image/upload/test/album-cover.jpg',
    coverImagePublicId: 'test/album-cover',
    tracks: [
      {
        trackNumber: 1,
        title: 'Test Track 1',
        duration: '3:45'
      },
      {
        trackNumber: 2,
        title: 'Test Track 2',
        duration: '4:20'
      }
    ],
    streamingLinks: [],
    purchaseLinks: [],
    images: [],
    featured: false,
    isNewRelease: false,
    physicalAvailable: false,
    tags: [],
    status: 'draft',
    type: 'LP',
    ...overrides
  };
}

/**
 * Crear producto de prueba
 */
export function createTestProduct(overrides = {}) {
  return {
    name: 'Test Product',
    description: 'This is a test product description with enough characters to pass validation',
    shortDescription: 'Short test description',
    category: 'apparel',
    subcategory: 'T-Shirts',
    brand: 'Test Brand',
    tags: ['test', 'product', 'mariachi'],
    variants: [
      {
        sku: 'TEST-001',
        name: 'Test Variant - Medium Black',
        attributes: {
          size: 'M',
          color: 'Black',
          material: 'Cotton'
        },
        pricing: {
          basePrice: 299.99,
          currency: 'MXN'
        },
        inventory: {
          stock: 10,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: false
        },
        images: [],
        isActive: true
      }
    ],
    images: [
      {
        url: 'https://res.cloudinary.com/test/image/upload/test/product-1.jpg',
        publicId: 'test/product-1',
        altText: 'Test product image',
        isPrimary: true,
        order: 0
      }
    ],
    features: ['High quality material', 'Comfortable fit', 'Authentic design'],
    shipping: {
      isFreeShipping: false,
      shippingClass: 'standard',
      estimatedDeliveryDays: {
        min: 3,
        max: 5
      }
    },
    status: 'draft',
    isFeatured: false,
    isNewArrival: false,
    ...overrides
  };
}

/**
 * Crear concierto de prueba
 */
export function createTestConcert(overrides = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // 30 días en el futuro

  return {
    title: 'Test Concert',
    description: 'Test concert description',
    eventDate: futureDate,
    eventTime: '20:00',
    duration: 120,
    location: {
      venueName: 'Test Venue',
      address: 'Test Street 123',
      city: 'Mexico City',
      state: 'CDMX',
      country: 'México',
      zipCode: '01000'
    },
    tickets: [
      {
        type: 'General',
        price: 500,
        currency: 'MXN',
        available: true,
        quantity: 100
      },
      {
        type: 'VIP',
        price: 1000,
        currency: 'MXN',
        available: true,
        quantity: 50
      }
    ],
    posterImage: 'https://res.cloudinary.com/test/image/upload/test/concert-poster.jpg',
    posterImagePublicId: 'test/concert-poster',
    images: [],
    setlist: [],
    featured: false,
    eventType: 'Concert',
    status: 'draft',
    availabilityStatus: 'available',
    tags: [],
    ...overrides
  };
}

/**
 * Crear anuncio de prueba
 */
export function createTestAnnouncement(authorId, overrides = {}) {
  return {
    title: 'Test Announcement Title',
    subtitle: 'Test announcement subtitle',
    content: 'This is a test announcement content that has enough characters to pass validation requirements',
    excerpt: 'Short test excerpt for the announcement',
    category: 'news',
    priority: 'normal',
    status: 'draft',
    isPinned: false,
    isFeatured: false,
    tags: ['test', 'announcement', 'news'],
    author: authorId,
    ...overrides
  };
}

/**
 * Esperar por tiempo específico (para tests async)
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validar estructura de respuesta de API
 */
export function validateApiResponse(response, expectedStatus = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success');
  expect(response.headers['content-type']).toMatch(/json/);
}

/**
 * Validar respuesta de éxito
 */
export function validateSuccessResponse(response, expectedStatus = 200) {
  validateApiResponse(response, expectedStatus);
  expect(response.body.success).toBe(true);
  expect(response.body).toHaveProperty('data');
}

/**
 * Validar respuesta de error
 */
export function validateErrorResponse(response, expectedStatus = 400) {
  validateApiResponse(response, expectedStatus);
  expect(response.body.success).toBe(false);
  expect(response.body).toHaveProperty('error');
}

/**
 * Validar paginación
 */
export function validatePaginationResponse(response) {
  validateSuccessResponse(response);
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('pages');
}

/**
 * Validar que un objeto tenga timestamps
 */
export function validateTimestamps(obj) {
  expect(obj).toHaveProperty('createdAt');
  expect(obj).toHaveProperty('updatedAt');
  expect(new Date(obj.createdAt)).toBeInstanceOf(Date);
  expect(new Date(obj.updatedAt)).toBeInstanceOf(Date);
}

/**
 * Validar que un objeto tenga campos de auditoría
 */
export function validateAuditFields(obj) {
  validateTimestamps(obj);
  expect(obj).toHaveProperty('_id');
}

/**
 * Extraer ID de MongoDB de respuesta
 */
export function extractId(response) {
  return response.body.data._id || response.body.data.id;
}

/**
 * Mock de req y res para tests de middlewares
 */
export function createMockReqRes() {
  const req = {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    correlationId: 'test-correlation-id'
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  };

  const next = jest.fn();

  return { req, res, next };
}

/**
 * Limpiar mocks
 */
export function clearAllMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}

export default {
  generateTestToken,
  createTestUser,
  createTestAdmin,
  createTestAlbum,
  createTestProduct,
  createTestConcert,
  createTestAnnouncement,
  wait,
  validateApiResponse,
  validateSuccessResponse,
  validateErrorResponse,
  validatePaginationResponse,
  validateTimestamps,
  validateAuditFields,
  extractId,
  createMockReqRes,
  clearAllMocks
};
