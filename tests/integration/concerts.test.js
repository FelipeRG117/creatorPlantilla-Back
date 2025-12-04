/**
 * Concerts Integration Tests
 * Tests completos del CRUD de conciertos
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import {
  connectTestDB,
  disconnectTestDB,
  clearTestDB
} from '../helpers/testDb.js';
import {
  createTestConcert,
  createTestUser,
  validateSuccessResponse,
  validateErrorResponse,
  validatePaginationResponse,
  generateTestToken
} from '../helpers/testHelpers.js';
import { concertModel as Concert } from '../../src/models/model.concert.js';
import { userModel as User } from '../../src/models/model.users.js';

describe('Concerts API', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  // Setup y teardown
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Crear usuarios para tests de autenticación
    adminUser = await User.create(
      createTestUser({
        email: 'admin@test.com',
        role: 'admin'
      })
    );
    adminToken = generateTestToken(adminUser._id, 'admin');

    regularUser = await User.create(
      createTestUser({
        email: 'user@test.com',
        role: 'user'
      })
    );
    userToken = generateTestToken(regularUser._id, 'user');
  });

  // ==========================================
  // GET /api/concerts - List all concerts
  // ==========================================
  describe('GET /api/concerts', () => {
    test('Should list all concerts with default pagination', async () => {
      // Crear 3 conciertos de prueba
      await Concert.create([
        createTestConcert({ title: 'Concert 1', status: 'published' }),
        createTestConcert({ title: 'Concert 2', status: 'published' }),
        createTestConcert({ title: 'Concert 3', status: 'draft' })
      ]);

      const response = await request(app)
        .get('/api/concerts');

      validateSuccessResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    test('Should paginate results correctly', async () => {
      // Crear 15 conciertos
      const concerts = Array.from({ length: 15 }, (_, i) =>
        createTestConcert({ title: `Concert ${i + 1}` })
      );
      await Concert.create(concerts);

      // Página 1 con límite de 5
      const response1 = await request(app)
        .get('/api/concerts?page=1&limit=5');

      validatePaginationResponse(response1);
      expect(response1.body.data.length).toBe(5);
      expect(response1.body.pagination.page).toBe(1);
      expect(response1.body.pagination.pages).toBe(3);

      // Página 2
      const response2 = await request(app)
        .get('/api/concerts?page=2&limit=5');

      expect(response2.body.data.length).toBe(5);
      expect(response2.body.pagination.page).toBe(2);
    });

    test('Should filter by status', async () => {
      await Concert.create([
        createTestConcert({ title: 'Published 1', status: 'published' }),
        createTestConcert({ title: 'Published 2', status: 'published' }),
        createTestConcert({ title: 'Draft 1', status: 'draft' }),
        createTestConcert({ title: 'Cancelled 1', status: 'cancelled' })
      ]);

      const response = await request(app)
        .get('/api/concerts?status=published');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(concert => concert.status === 'published')).toBe(true);
    });

    test('Should filter by featured flag', async () => {
      await Concert.create([
        createTestConcert({ title: 'Featured 1', featured: true }),
        createTestConcert({ title: 'Featured 2', featured: true }),
        createTestConcert({ title: 'Not Featured', featured: false })
      ]);

      const response = await request(app)
        .get('/api/concerts?featured=true');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(concert => concert.featured === true)).toBe(true);
    });

    test('Should sort by eventDate ascending by default', async () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-06-01');
      const date3 = new Date('2025-03-01');

      await Concert.create([
        createTestConcert({ title: 'Latest', eventDate: date2 }),
        createTestConcert({ title: 'Earliest', eventDate: date1 }),
        createTestConcert({ title: 'Middle', eventDate: date3 })
      ]);

      const response = await request(app)
        .get('/api/concerts');

      validateSuccessResponse(response, 200);
      expect(response.body.data[0].title).toBe('Earliest');
      expect(response.body.data[2].title).toBe('Latest');
    });

    test('Should return empty array when no concerts exist', async () => {
      const response = await request(app)
        .get('/api/concerts');

      validateSuccessResponse(response, 200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  // ==========================================
  // GET /api/concerts/:id - Get concert by ID
  // ==========================================
  describe('GET /api/concerts/:id', () => {
    test('Should get concert by valid ID', async () => {
      const concert = await Concert.create(
        createTestConcert({ title: 'Test Concert' })
      );

      const response = await request(app)
        .get(`/api/concerts/${concert._id}`);

      validateSuccessResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Test Concert');
      expect(response.body.data._id).toBe(concert._id.toString());
    });

    test('Should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/concerts/${fakeId}`);

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('CONCERT_NOT_FOUND');
    });

    test('Should return error for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/concerts/invalid-id');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should include all concert fields', async () => {
      const concertData = createTestConcert({
        title: 'Complete Concert',
        description: 'Full description',
        featured: true,
        tags: ['test', 'concert']
      });

      const concert = await Concert.create(concertData);

      const response = await request(app)
        .get(`/api/concerts/${concert._id}`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('Complete Concert');
      expect(response.body.data.description).toBe('Full description');
      expect(response.body.data.featured).toBe(true);
      expect(response.body.data.location).toBeDefined();
      expect(response.body.data.tickets).toBeInstanceOf(Array);
    });
  });

  // ==========================================
  // POST /api/concerts - Create concert
  // ==========================================
  describe('POST /api/concerts', () => {
    test('Should create concert with valid data', async () => {
      const concertData = createTestConcert({
        title: 'New Concert',
        eventDate: new Date('2025-12-31')
      });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('New Concert');
      expect(response.body.data._id).toBeDefined();

      // Verificar que se guardó en DB
      const dbConcert = await Concert.findById(response.body.data._id);
      expect(dbConcert).toBeDefined();
      expect(dbConcert.title).toBe('New Concert');
    });

    test('Should auto-generate slug from title and date', async () => {
      const concertData = createTestConcert({
        title: 'Mi Concierto Especial 2025',
        eventDate: new Date('2025-12-31')
      });
      delete concertData.slug;

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.slug).toBeDefined();
      expect(response.body.data.slug).toMatch(/^[a-z0-9-]+$/);
      expect(response.body.data.slug).toContain('2025-12-31');
    });

    test('Should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/concerts')
        .send({
          title: 'Test Concert'
          // Faltan eventDate, eventTime, location, tickets, posterImage
        });

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with empty tickets array', async () => {
      const concertData = createTestConcert({ tickets: [] });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with invalid eventTime format', async () => {
      const concertData = createTestConcert({
        eventTime: '25:00' // Formato inválido
      });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with duplicate slug', async () => {
      const concertData1 = createTestConcert({
        title: 'Test Concert',
        slug: 'test-concert-unique-slug'
      });

      const concertData2 = createTestConcert({
        title: 'Another Concert',
        slug: 'test-concert-unique-slug' // Slug duplicado
      });

      await request(app).post('/api/concerts').send(concertData1);

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData2);

      validateErrorResponse(response, 400);
      expect(response.body.error.code).toBe('SLUG_ALREADY_EXISTS');
    });

    test('Should accept valid status values', async () => {
      const statuses = ['draft', 'published'];

      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const timestamp = Date.now() + i * 1000; // Asegurar timestamp único
        const concertData = createTestConcert({
          title: `Concert ${status} ${timestamp}`,
          slug: `concert-${status}-${timestamp}`,
          status
        });

        const response = await request(app)
          .post('/api/concerts')
          .send(concertData);

        if (response.status !== 201) {
          console.log('Error creating concert with status:', status);
          console.log('Response:', response.body);
        }

        validateSuccessResponse(response, 201);
        expect(response.body.data.status).toBe(status);
      }
    });

    test('Should set publishedAt when status is published', async () => {
      const concertData = createTestConcert({
        status: 'published'
      });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.publishedAt).toBeDefined();
    });

    test('Should accept valid ticket types', async () => {
      const ticketTypes = ['General', 'VIP', 'Preferente', 'Palco', 'Mesa', 'Other'];

      for (const type of ticketTypes) {
        const concertData = createTestConcert({
          title: `Concert ${type}`,
          slug: `concert-ticket-${type.toLowerCase()}-${Date.now()}`,
          tickets: [
            {
              type: type,
              price: 500,
              currency: 'MXN',
              available: true
            }
          ]
        });

        const response = await request(app)
          .post('/api/concerts')
          .send(concertData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.tickets[0].type).toBe(type);
      }
    });
  });

  // ==========================================
  // PUT /api/concerts/:id - Update concert
  // ==========================================
  describe('PUT /api/concerts/:id', () => {
    test('Should update concert with valid data', async () => {
      const concert = await Concert.create(createTestConcert());

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/concerts/${concert._id}`)
        .send(updateData);

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('Updated description');

      // Verificar en DB
      const dbConcert = await Concert.findById(concert._id);
      expect(dbConcert.title).toBe('Updated Title');
    });

    test('Should return 404 for non-existent concert', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/concerts/${fakeId}`)
        .send({ title: 'Updated Title' });

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('CONCERT_NOT_FOUND');
    });

    test('Should update only provided fields', async () => {
      const concert = await Concert.create(
        createTestConcert({
          title: 'Original Title',
          description: 'Original description',
          duration: 120
        })
      );

      const response = await request(app)
        .put(`/api/concerts/${concert._id}`)
        .send({ title: 'New Title' });

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('New Title');
      expect(response.body.data.description).toBe('Original description');
      expect(response.body.data.duration).toBe(120);
    });

    test('Should update tickets array', async () => {
      const concert = await Concert.create(createTestConcert());

      const newTickets = [
        { type: 'General', price: 300, currency: 'MXN', available: true },
        { type: 'VIP', price: 800, currency: 'MXN', available: true },
        { type: 'Preferente', price: 1500, currency: 'MXN', available: true }
      ];

      const response = await request(app)
        .put(`/api/concerts/${concert._id}`)
        .send({ tickets: newTickets });

      validateSuccessResponse(response, 200);
      expect(response.body.data.tickets.length).toBeGreaterThanOrEqual(2);
    });

    test('Should fail with duplicate slug on different concert', async () => {
      const concert1 = await Concert.create(
        createTestConcert({ slug: 'concert-one' })
      );
      const concert2 = await Concert.create(
        createTestConcert({ slug: 'concert-two' })
      );

      const response = await request(app)
        .put(`/api/concerts/${concert2._id}`)
        .send({ slug: 'concert-one' });

      validateErrorResponse(response, 400);
      expect(response.body.error.code).toBe('SLUG_ALREADY_EXISTS');
    });

    test('Should update featured flag', async () => {
      const concert = await Concert.create(
        createTestConcert({ featured: false })
      );

      const response = await request(app)
        .put(`/api/concerts/${concert._id}`)
        .send({ featured: true });

      validateSuccessResponse(response, 200);
      expect(response.body.data.featured).toBe(true);
    });
  });

  // ==========================================
  // DELETE /api/concerts/:id - Delete concert
  // ==========================================
  describe('DELETE /api/concerts/:id', () => {
    test('Should delete concert successfully', async () => {
      const concert = await Concert.create(createTestConcert());

      const response = await request(app)
        .delete(`/api/concerts/${concert._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);

      // Verificar que se eliminó de DB
      const dbConcert = await Concert.findById(concert._id);
      expect(dbConcert).toBeNull();
    });

    test('Should return 404 for non-existent concert', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/concerts/${fakeId}`);

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('CONCERT_NOT_FOUND');
    });

    test('Should return error for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/concerts/invalid-id-format');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/concerts/upcoming - Upcoming concerts
  // ==========================================
  describe('GET /api/concerts/upcoming', () => {
    test('Should get upcoming concerts', async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 14);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      await Concert.create([
        createTestConcert({ title: 'Upcoming 1', eventDate: futureDate1, status: 'published' }),
        createTestConcert({ title: 'Upcoming 2', eventDate: futureDate2, status: 'published' }),
        createTestConcert({ title: 'Past Concert', eventDate: pastDate, status: 'published' })
      ]);

      const response = await request(app)
        .get('/api/concerts/upcoming');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(c => new Date(c.eventDate) >= new Date())).toBe(true);
    });

    test('Should respect limit parameter', async () => {
      const concerts = Array.from({ length: 15 }, (_, i) => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (i + 1));
        return createTestConcert({
          title: `Concert ${i + 1}`,
          eventDate: futureDate,
          status: 'published'
        });
      });
      await Concert.create(concerts);

      const response = await request(app)
        .get('/api/concerts/upcoming?limit=5');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(5);
    });
  });

  // ==========================================
  // GET /api/concerts/featured - Featured concerts
  // ==========================================
  describe('GET /api/concerts/featured', () => {
    test('Should get featured concerts', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await Concert.create([
        createTestConcert({ title: 'Featured 1', featured: true, status: 'published', eventDate: futureDate }),
        createTestConcert({ title: 'Featured 2', featured: true, status: 'published', eventDate: futureDate }),
        createTestConcert({ title: 'Not Featured', featured: false, status: 'published', eventDate: futureDate })
      ]);

      const response = await request(app)
        .get('/api/concerts/featured');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(concert => concert.featured === true)).toBe(true);
    });
  });

  // ==========================================
  // POST /api/concerts/:id/publish - Publish concert
  // ==========================================
  describe('POST /api/concerts/:id/publish', () => {
    test('Should publish draft concert', async () => {
      const concert = await Concert.create(
        createTestConcert({ status: 'draft' })
      );

      const response = await request(app)
        .post(`/api/concerts/${concert._id}/publish`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).toBeDefined();

      const dbConcert = await Concert.findById(concert._id);
      expect(dbConcert.status).toBe('published');
    });

    test('Should return 404 for non-existent concert', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/concerts/${fakeId}/publish`);

      validateErrorResponse(response, 404);
    });
  });

  // ==========================================
  // POST /api/concerts/:id/cancel - Cancel concert
  // ==========================================
  describe('POST /api/concerts/:id/cancel', () => {
    test('Should cancel concert with reason', async () => {
      const concert = await Concert.create(
        createTestConcert({ status: 'published' })
      );

      const response = await request(app)
        .post(`/api/concerts/${concert._id}/cancel`)
        .send({ reason: 'Weather conditions' });

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.availabilityStatus).toBe('cancelled');
      expect(response.body.data.cancelledAt).toBeDefined();

      const dbConcert = await Concert.findById(concert._id);
      expect(dbConcert.status).toBe('cancelled');
      expect(dbConcert.specialNotes).toContain('Weather conditions');
    });
  });

  // ==========================================
  // POST /api/concerts/:id/sold-out - Mark as sold out
  // ==========================================
  describe('POST /api/concerts/:id/sold-out', () => {
    test('Should mark concert as sold out', async () => {
      const concert = await Concert.create(
        createTestConcert({ status: 'published' })
      );

      const response = await request(app)
        .post(`/api/concerts/${concert._id}/sold-out`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('sold_out');
      expect(response.body.data.availabilityStatus).toBe('sold_out');

      const dbConcert = await Concert.findById(concert._id);
      expect(dbConcert.status).toBe('sold_out');
    });
  });

  // ==========================================
  // Edge Cases & Validation
  // ==========================================
  describe('Edge Cases & Validation', () => {
    test('Should handle very long concert title (within limits)', async () => {
      const longTitle = 'A'.repeat(200);
      const concertData = createTestConcert({ title: longTitle });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.title.length).toBe(200);
    });

    test('Should reject concert title exceeding max length', async () => {
      const tooLongTitle = 'A'.repeat(201);
      const concertData = createTestConcert({ title: tooLongTitle });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should accept valid event types', async () => {
      const eventTypes = ['Concert', 'Festival', 'Private Event', 'Wedding', 'Corporate', 'Tour', 'Other'];

      for (const eventType of eventTypes) {
        const concertData = createTestConcert({
          title: `Event ${eventType}`,
          slug: `event-${eventType.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
          eventType
        });

        const response = await request(app)
          .post('/api/concerts')
          .send(concertData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.eventType).toBe(eventType);
      }
    });

    test('Should handle concerts with setlist', async () => {
      const concertData = createTestConcert({
        setlist: [
          { order: 1, songTitle: 'Cielito Lindo', duration: '4:30' },
          { order: 2, songTitle: 'El Rey', duration: '3:45' },
          { order: 3, songTitle: 'Guadalajara', duration: '5:00' }
        ]
      });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.setlist.length).toBe(3);
    });

    test('Should handle concerts with multiple currencies', async () => {
      const concertData = createTestConcert({
        tickets: [
          { type: 'General', price: 500, currency: 'MXN', available: true },
          { type: 'VIP', price: 50, currency: 'USD', available: true },
          { type: 'Preferente', price: 40, currency: 'EUR', available: true }
        ]
      });

      const response = await request(app)
        .post('/api/concerts')
        .send(concertData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.tickets.length).toBe(3);
      expect(response.body.data.tickets[0].currency).toBe('MXN');
      expect(response.body.data.tickets[1].currency).toBe('USD');
      expect(response.body.data.tickets[2].currency).toBe('EUR');
    });
  });
});
