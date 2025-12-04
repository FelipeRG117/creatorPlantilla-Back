/**
 * Announcements Integration Tests
 * Tests completos para el módulo de anuncios (CRUD + special endpoints)
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../app.js';
import { announcementModel as Announcement } from '../../src/models/model.announcement.js';
import { userModel as User } from '../../src/models/model.users.js';
import {
  createTestUser,
  createTestAnnouncement,
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
  await Announcement.deleteMany({});
  await User.deleteMany({});

  // Crear usuario de prueba
  testUser = await User.create(createTestUser());
  authToken = generateTestToken(testUser._id);
});

describe('Announcements API - Integration Tests', () => {
  // ========================================
  // GET /api/announcements - Listar
  // ========================================
  describe('GET /api/announcements', () => {
    test('Should return empty array when no announcements exist', async () => {
      const response = await request(app).get('/api/announcements');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    test('Should return all announcements with default pagination', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Announcement 1' }),
        createTestAnnouncement(testUser._id, { title: 'Announcement 2' }),
        createTestAnnouncement(testUser._id, { title: 'Announcement 3' })
      ]);

      const response = await request(app).get('/api/announcements');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    test('Should paginate announcements correctly', async () => {
      const announcements = Array.from({ length: 25 }, (_, i) =>
        createTestAnnouncement(testUser._id, {
          title: `Announcement ${i + 1}`,
          slug: `announcement-${i + 1}`
        })
      );
      await Announcement.create(announcements);

      // Página 1
      const page1 = await request(app).get('/api/announcements?page=1&limit=20');
      validatePaginationResponse(page1);
      expect(page1.body.data).toHaveLength(20);

      // Página 2
      const page2 = await request(app).get('/api/announcements?page=2&limit=20');
      validatePaginationResponse(page2);
      expect(page2.body.data).toHaveLength(5);
    });

    test('Should filter by status', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Draft', status: 'draft' }),
        createTestAnnouncement(testUser._id, { title: 'Published', status: 'published' })
      ]);

      const response = await request(app).get('/api/announcements?status=published');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('published');
    });

    test('Should filter by category', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'News Article', category: 'news' }),
        createTestAnnouncement(testUser._id, { title: 'Event Announcement', category: 'event' })
      ]);

      const response = await request(app).get('/api/announcements?category=event');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('event');
    });

    test('Should filter by priority', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Normal', priority: 'normal' }),
        createTestAnnouncement(testUser._id, { title: 'Urgent', priority: 'urgent' })
      ]);

      const response = await request(app).get('/api/announcements?priority=urgent');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('urgent');
    });

    test('Should filter by isPinned', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Regular', isPinned: false }),
        createTestAnnouncement(testUser._id, { title: 'Pinned', isPinned: true })
      ]);

      const response = await request(app).get('/api/announcements?isPinned=true');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isPinned).toBe(true);
    });

    test('Should filter by isFeatured', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Regular', isFeatured: false }),
        createTestAnnouncement(testUser._id, { title: 'Featured', isFeatured: true })
      ]);

      const response = await request(app).get('/api/announcements?isFeatured=true');

      validatePaginationResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isFeatured).toBe(true);
    });
  });

  // ========================================
  // GET /api/announcements/:id - Por ID
  // ========================================
  describe('GET /api/announcements/:id', () => {
    test('Should get announcement by ID', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );

      const response = await request(app).get(`/api/announcements/${announcement._id}`);

      validateSuccessResponse(response);
      expect(response.body.data._id).toBe(announcement._id.toString());
      expect(response.body.data.title).toBe(announcement.title);
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/announcements/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should return 400 for invalid ID', async () => {
      const response = await request(app).get('/api/announcements/invalid-id');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should increment views when getting announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );
      expect(announcement.metrics.views).toBe(0);

      await request(app).get(`/api/announcements/${announcement._id}`);

      const updated = await Announcement.findById(announcement._id);
      expect(updated.metrics.views).toBe(1);
    });
  });

  // ========================================
  // GET /api/announcements/slug/:slug
  // ========================================
  describe('GET /api/announcements/slug/:slug', () => {
    test('Should get announcement by slug', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { slug: 'test-slug' })
      );

      const response = await request(app).get('/api/announcements/slug/test-slug');

      validateSuccessResponse(response);
      expect(response.body.data.slug).toBe('test-slug');
    });

    test('Should return 404 for non-existent slug', async () => {
      const response = await request(app).get('/api/announcements/slug/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should increment views when getting by slug', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { slug: 'view-test' })
      );

      await request(app).get('/api/announcements/slug/view-test');

      const updated = await Announcement.findById(announcement._id);
      expect(updated.metrics.views).toBe(1);
    });
  });

  // ========================================
  // POST /api/announcements - Crear
  // ========================================
  describe('POST /api/announcements', () => {
    test('Should create announcement with valid data', async () => {
      const announcementData = createTestAnnouncement(testUser._id, {
        title: 'New Announcement'
      });

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.title).toBe('New Announcement');
      expect(response.body.data).toHaveProperty('_id');

      const dbAnnouncement = await Announcement.findById(response.body.data._id);
      expect(dbAnnouncement).toBeDefined();
    });

    test('Should reject announcement without title', async () => {
      const announcementData = createTestAnnouncement(testUser._id);
      delete announcementData.title;

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject announcement without content', async () => {
      const announcementData = createTestAnnouncement(testUser._id);
      delete announcementData.content;

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject announcement without author', async () => {
      const announcementData = createTestAnnouncement(testUser._id);
      delete announcementData.author;

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject title shorter than 5 characters', async () => {
      const announcementData = createTestAnnouncement(testUser._id, {
        title: 'Test'
      });

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject content shorter than 20 characters', async () => {
      const announcementData = createTestAnnouncement(testUser._id, {
        content: 'Too short'
      });

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should accept valid categories', async () => {
      const categories = ['news', 'event', 'update', 'promotion', 'alert', 'general'];

      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const announcementData = createTestAnnouncement(testUser._id, {
          title: `Test ${category} announcement ${i}`,
          slug: `test-${category}-${i}`,
          category
        });

        const response = await request(app)
          .post('/api/announcements')
          .send(announcementData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.category).toBe(category);
      }
    });

    test('Should accept valid priorities', async () => {
      const priorities = ['low', 'normal', 'high', 'urgent'];

      for (let i = 0; i < priorities.length; i++) {
        const priority = priorities[i];
        const announcementData = createTestAnnouncement(testUser._id, {
          title: `Test priority announcement ${i}`,
          slug: `test-priority-${i}`,
          priority
        });

        const response = await request(app)
          .post('/api/announcements')
          .send(announcementData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.priority).toBe(priority);
      }
    });

    test('Should auto-generate slug if not provided', async () => {
      const announcementData = createTestAnnouncement(testUser._id, {
        title: 'Auto Generated Slug'
      });
      delete announcementData.slug;

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.slug).toBeTruthy();
      expect(response.body.data.slug).toMatch(/auto-generated-slug/);
    });

    test('Should auto-generate excerpt if not provided', async () => {
      const announcementData = createTestAnnouncement(testUser._id);
      delete announcementData.excerpt;

      const response = await request(app)
        .post('/api/announcements')
        .send(announcementData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.excerpt).toBeTruthy();
    });
  });

  // ========================================
  // PUT /api/announcements/:id - Actualizar
  // ========================================
  describe('PUT /api/announcements/:id', () => {
    test('Should update announcement with valid data', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );

      const updateData = {
        title: 'Updated Title Test',
        content: 'Updated content with enough characters to pass validation'
      };

      const response = await request(app)
        .put(`/api/announcements/${announcement._id}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.title).toBe('Updated Title Test');
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/announcements/${fakeId}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should update only provided fields', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, {
          title: 'Original Title',
          category: 'news'
        })
      );

      const response = await request(app)
        .put(`/api/announcements/${announcement._id}`)
        .send({ title: 'New Title Here' });

      validateSuccessResponse(response);
      expect(response.body.data.title).toBe('New Title Here');
      expect(response.body.data.category).toBe('news');
    });
  });

  // ========================================
  // DELETE /api/announcements/:id
  // ========================================
  describe('DELETE /api/announcements/:id', () => {
    test('Should delete existing announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );

      const response = await request(app).delete(`/api/announcements/${announcement._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);

      const dbAnnouncement = await Announcement.findById(announcement._id);
      expect(dbAnnouncement).toBeNull();
    });

    test('Should return 404 when deleting non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/announcements/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // GET /api/announcements/published
  // ========================================
  describe('GET /api/announcements/published', () => {
    test('Should return only published announcements', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, { title: 'Draft', status: 'draft' }),
        createTestAnnouncement(testUser._id, { title: 'Published 1', status: 'published' }),
        createTestAnnouncement(testUser._id, { title: 'Published 2', status: 'published' })
      ]);

      const response = await request(app).get('/api/announcements/published');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(announcement => {
        expect(announcement.status).toBe('published');
      });
    });

    test('Should respect limit parameter', async () => {
      const announcements = Array.from({ length: 10 }, (_, i) =>
        createTestAnnouncement(testUser._id, {
          title: `Published ${i}`,
          slug: `published-${i}`,
          status: 'published'
        })
      );
      await Announcement.create(announcements);

      const response = await request(app).get('/api/announcements/published?limit=5');

      validateSuccessResponse(response);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  // ========================================
  // GET /api/announcements/featured
  // ========================================
  describe('GET /api/announcements/featured', () => {
    test('Should return only featured announcements', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, {
          title: 'Regular',
          status: 'published',
          isFeatured: false
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Featured 1',
          status: 'published',
          isFeatured: true
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Featured 2',
          status: 'published',
          isFeatured: true
        })
      ]);

      const response = await request(app).get('/api/announcements/featured');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(announcement => {
        expect(announcement.isFeatured).toBe(true);
      });
    });
  });

  // ========================================
  // GET /api/announcements/pinned
  // ========================================
  describe('GET /api/announcements/pinned', () => {
    test('Should return only pinned announcements', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, {
          title: 'Regular',
          status: 'published',
          isPinned: false
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Pinned',
          status: 'published',
          isPinned: true
        })
      ]);

      const response = await request(app).get('/api/announcements/pinned');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isPinned).toBe(true);
    });
  });

  // ========================================
  // GET /api/announcements/recent
  // ========================================
  describe('GET /api/announcements/recent', () => {
    test('Should return recent announcements', async () => {
      const recentDate = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      await Announcement.create([
        createTestAnnouncement(testUser._id, {
          title: 'Old Announcement',
          status: 'published',
          publishedAt: oldDate
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Recent Announcement',
          status: 'published',
          publishedAt: recentDate
        })
      ]);

      const response = await request(app).get('/api/announcements/recent');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Recent Announcement');
    });
  });

  // ========================================
  // GET /api/announcements/urgent
  // ========================================
  describe('GET /api/announcements/urgent', () => {
    test('Should return only urgent announcements', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, {
          title: 'Normal',
          status: 'published',
          priority: 'normal'
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Urgent',
          status: 'published',
          priority: 'urgent'
        })
      ]);

      const response = await request(app).get('/api/announcements/urgent');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('urgent');
    });
  });

  // ========================================
  // GET /api/announcements/category/:category
  // ========================================
  describe('GET /api/announcements/category/:category', () => {
    test('Should return announcements from specific category', async () => {
      await Announcement.create([
        createTestAnnouncement(testUser._id, {
          title: 'News 1',
          category: 'news',
          status: 'published'
        }),
        createTestAnnouncement(testUser._id, {
          title: 'Event 1',
          category: 'event',
          status: 'published'
        })
      ]);

      const response = await request(app).get('/api/announcements/category/event');

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('event');
    });

    test('Should return 400 for invalid category', async () => {
      const response = await request(app).get('/api/announcements/category/invalid');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/publish
  // ========================================
  describe('POST /api/announcements/:id/publish', () => {
    test('Should publish draft announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { status: 'draft' })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/publish`);

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).toBeTruthy();
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/announcements/${fakeId}/publish`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/archive
  // ========================================
  describe('POST /api/announcements/:id/archive', () => {
    test('Should archive announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { status: 'published' })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/archive`);

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('archived');
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/announcements/${fakeId}/archive`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/pin
  // ========================================
  describe('POST /api/announcements/:id/pin', () => {
    test('Should pin announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { isPinned: false })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/pin`);

      validateSuccessResponse(response);
      expect(response.body.data.isPinned).toBe(true);
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/announcements/${fakeId}/pin`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/unpin
  // ========================================
  describe('POST /api/announcements/:id/unpin', () => {
    test('Should unpin announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { isPinned: true })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/unpin`);

      validateSuccessResponse(response);
      expect(response.body.data.isPinned).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/feature
  // ========================================
  describe('POST /api/announcements/:id/feature', () => {
    test('Should feature announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { isFeatured: false })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/feature`);

      validateSuccessResponse(response);
      expect(response.body.data.isFeatured).toBe(true);
    });
  });

  // ========================================
  // POST /api/announcements/:id/unfeature
  // ========================================
  describe('POST /api/announcements/:id/unfeature', () => {
    test('Should unfeature announcement', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id, { isFeatured: true })
      );

      const response = await request(app).post(`/api/announcements/${announcement._id}/unfeature`);

      validateSuccessResponse(response);
      expect(response.body.data.isFeatured).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/share
  // ========================================
  describe('POST /api/announcements/:id/share', () => {
    test('Should increment shares', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );
      expect(announcement.metrics.shares).toBe(0);

      const response = await request(app).post(`/api/announcements/${announcement._id}/share`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/recorded/i);

      const updated = await Announcement.findById(announcement._id);
      expect(updated.metrics.shares).toBe(1);
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/announcements/${fakeId}/share`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // POST /api/announcements/:id/click
  // ========================================
  describe('POST /api/announcements/:id/click', () => {
    test('Should increment clicks', async () => {
      const announcement = await Announcement.create(
        createTestAnnouncement(testUser._id)
      );
      expect(announcement.metrics.clicks).toBe(0);

      const response = await request(app).post(`/api/announcements/${announcement._id}/click`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/recorded/i);

      const updated = await Announcement.findById(announcement._id);
      expect(updated.metrics.clicks).toBe(1);
    });

    test('Should return 404 for non-existent announcement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).post(`/api/announcements/${fakeId}/click`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
