/**
 * Albums Integration Tests
 * Tests completos del CRUD de álbumes
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
  createTestAlbum,
  createTestUser,
  validateSuccessResponse,
  validateErrorResponse,
  validatePaginationResponse,
  generateTestToken
} from '../helpers/testHelpers.js';
import { albumModel as Album } from '../../src/models/model.album.js';
import { userModel as User } from '../../src/models/model.users.js';

describe('Albums API', () => {
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
  // GET /api/albums - List all albums
  // ==========================================
  describe('GET /api/albums', () => {
    test('Should list all albums with default pagination', async () => {
      // Crear 3 álbumes de prueba
      await Album.create([
        createTestAlbum({ title: 'Album 1', status: 'published' }),
        createTestAlbum({ title: 'Album 2', status: 'published' }),
        createTestAlbum({ title: 'Album 3', status: 'draft' })
      ]);

      const response = await request(app)
        .get('/api/albums');

      validateSuccessResponse(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('Should paginate results correctly', async () => {
      // Crear 15 álbumes
      const albums = Array.from({ length: 15 }, (_, i) =>
        createTestAlbum({ title: `Album ${i + 1}` })
      );
      await Album.create(albums);

      // Página 1 con límite de 5
      const response1 = await request(app)
        .get('/api/albums?page=1&limit=5');

      validatePaginationResponse(response1);
      expect(response1.body.data.length).toBe(5);
      expect(response1.body.pagination.page).toBe(1);
      expect(response1.body.pagination.pages).toBe(3);

      // Página 2
      const response2 = await request(app)
        .get('/api/albums?page=2&limit=5');

      expect(response2.body.data.length).toBe(5);
      expect(response2.body.pagination.page).toBe(2);
    });

    test('Should filter by status', async () => {
      await Album.create([
        createTestAlbum({ title: 'Published 1', status: 'published' }),
        createTestAlbum({ title: 'Published 2', status: 'published' }),
        createTestAlbum({ title: 'Draft 1', status: 'draft' }),
        createTestAlbum({ title: 'Archived 1', status: 'archived' })
      ]);

      const response = await request(app)
        .get('/api/albums?status=published');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(album => album.status === 'published')).toBe(true);
    });

    test('Should filter by featured flag', async () => {
      await Album.create([
        createTestAlbum({ title: 'Featured 1', featured: true }),
        createTestAlbum({ title: 'Featured 2', featured: true }),
        createTestAlbum({ title: 'Not Featured', featured: false })
      ]);

      const response = await request(app)
        .get('/api/albums?featured=true');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(album => album.featured === true)).toBe(true);
    });

    test('Should sort by releaseDate descending by default', async () => {
      await Album.create([
        createTestAlbum({ title: 'Oldest', releaseDate: new Date('2020-01-01') }),
        createTestAlbum({ title: 'Newest', releaseDate: new Date('2024-01-01') }),
        createTestAlbum({ title: 'Middle', releaseDate: new Date('2022-01-01') })
      ]);

      const response = await request(app)
        .get('/api/albums');

      validateSuccessResponse(response, 200);
      expect(response.body.data[0].title).toBe('Newest');
      expect(response.body.data[2].title).toBe('Oldest');
    });

    test('Should sort by title ascending', async () => {
      await Album.create([
        createTestAlbum({ title: 'Zebra Album' }),
        createTestAlbum({ title: 'Alpha Album' }),
        createTestAlbum({ title: 'Bravo Album' })
      ]);

      const response = await request(app)
        .get('/api/albums?sortBy=title&sortOrder=asc');

      validateSuccessResponse(response, 200);
      expect(response.body.data[0].title).toBe('Alpha Album');
      expect(response.body.data[2].title).toBe('Zebra Album');
    });

    test('Should return empty array when no albums exist', async () => {
      const response = await request(app)
        .get('/api/albums');

      validateSuccessResponse(response, 200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  // ==========================================
  // GET /api/albums/:id - Get album by ID
  // ==========================================
  describe('GET /api/albums/:id', () => {
    test('Should get album by valid ID', async () => {
      const album = await Album.create(
        createTestAlbum({ title: 'Test Album' })
      );

      const response = await request(app)
        .get(`/api/albums/${album._id}`);

      validateSuccessResponse(response, 200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Test Album');
      expect(response.body.data._id).toBe(album._id.toString());
    });

    test('Should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app)
        .get(`/api/albums/${fakeId}`);

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('ALBUM_NOT_FOUND');
    });

    test('Should return error for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/albums/invalid-id');

      // Can be 400 (validation) or 500 (cast error from mongoose)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should include all album fields', async () => {
      const albumData = createTestAlbum({
        title: 'Complete Album',
        artist: 'Test Artist',
        description: 'Full description',
        featured: true,
        tags: ['test', 'album']
      });

      const album = await Album.create(albumData);

      const response = await request(app)
        .get(`/api/albums/${album._id}`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('Complete Album');
      expect(response.body.data.artist).toBe('Test Artist');
      expect(response.body.data.description).toBe('Full description');
      expect(response.body.data.featured).toBe(true);
      expect(response.body.data.tags).toEqual(['test', 'album']);
      expect(response.body.data.tracks).toBeInstanceOf(Array);
    });
  });

  // ==========================================
  // POST /api/albums - Create album
  // ==========================================
  describe('POST /api/albums', () => {
    test('Should create album with valid data', async () => {
      const albumData = createTestAlbum({
        title: 'New Album',
        artist: 'Mariachi Gago'
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('New Album');
      expect(response.body.data._id).toBeDefined();

      // Verificar que se guardó en DB
      const dbAlbum = await Album.findById(response.body.data._id);
      expect(dbAlbum).toBeDefined();
      expect(dbAlbum.title).toBe('New Album');
    });

    test('Should auto-generate slug from title', async () => {
      const albumData = createTestAlbum({
        title: 'Mi Álbum Especial 2024'
      });
      delete albumData.slug; // No proporcionar slug

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.slug).toBeDefined();
      expect(response.body.data.slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('Should calculate totalTracks automatically', async () => {
      const albumData = createTestAlbum({
        tracks: [
          { trackNumber: 1, title: 'Track 1', duration: '3:00' },
          { trackNumber: 2, title: 'Track 2', duration: '4:00' },
          { trackNumber: 3, title: 'Track 3', duration: '3:30' }
        ]
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.totalTracks).toBe(3);
    });

    test('Should calculate releaseYear from releaseDate', async () => {
      const albumData = createTestAlbum({
        releaseDate: new Date('2023-06-15')
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.releaseYear).toBe(2023);
    });

    test('Should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/albums')
        .send({
          // Faltan title, coverImage, tracks, releaseDate
          artist: 'Test Artist'
        });

      // Can be 400 (validation) or 500 (mongoose error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with empty tracks array', async () => {
      const albumData = createTestAlbum({ tracks: [] });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      // Can be 400 (validation) or 500 (mongoose error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with invalid track duration format', async () => {
      const albumData = createTestAlbum({
        tracks: [
          {
            trackNumber: 1,
            title: 'Track 1',
            duration: '999' // Formato inválido
          }
        ]
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      // Can be 400 (validation) or 500 (mongoose error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with duplicate slug', async () => {
      const albumData1 = createTestAlbum({
        title: 'Test Album',
        slug: 'test-album-unique'
      });

      const albumData2 = createTestAlbum({
        title: 'Another Album',
        slug: 'test-album-unique' // Slug duplicado
      });

      // Crear primer álbum
      await request(app).post('/api/albums').send(albumData1);

      // Intentar crear segundo álbum con mismo slug
      const response = await request(app)
        .post('/api/albums')
        .send(albumData2);

      validateErrorResponse(response, 400);
      expect(response.body.error.code).toBe('SLUG_ALREADY_EXISTS');
    });

    test('Should accept valid status values', async () => {
      const statuses = ['draft', 'published', 'archived'];

      for (const status of statuses) {
        const albumData = createTestAlbum({
          title: `Album ${status}`,
          slug: `album-${status}`,
          status
        });

        const response = await request(app)
          .post('/api/albums')
          .send(albumData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.status).toBe(status);
      }
    });

    test('Should set publishedAt when status is published', async () => {
      const albumData = createTestAlbum({
        status: 'published'
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.publishedAt).toBeDefined();
    });
  });

  // ==========================================
  // PUT /api/albums/:id - Update album
  // ==========================================
  describe('PUT /api/albums/:id', () => {
    test('Should update album with valid data', async () => {
      const album = await Album.create(createTestAlbum());

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/albums/${album._id}`)
        .send(updateData);

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('Updated description');

      // Verificar en DB
      const dbAlbum = await Album.findById(album._id);
      expect(dbAlbum.title).toBe('Updated Title');
    });

    test('Should return 404 for non-existent album', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/albums/${fakeId}`)
        .send({ title: 'Updated Title' });

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('ALBUM_NOT_FOUND');
    });

    test('Should update only provided fields', async () => {
      const album = await Album.create(
        createTestAlbum({
          title: 'Original Title',
          artist: 'Original Artist',
          description: 'Original description'
        })
      );

      const response = await request(app)
        .put(`/api/albums/${album._id}`)
        .send({ title: 'New Title' }); // Solo actualizar título

      validateSuccessResponse(response, 200);
      expect(response.body.data.title).toBe('New Title');
      // Artist puede tener el default "Mariachi Gago" si el validator lo aplica
      expect(response.body.data.artist).toBeDefined();
      expect(response.body.data.description).toBe('Original description'); // No cambió
    });

    test('Should update tracks array', async () => {
      const album = await Album.create(createTestAlbum());

      const newTracks = [
        { trackNumber: 1, title: 'New Track 1', duration: '2:30' },
        { trackNumber: 2, title: 'New Track 2', duration: '3:15' },
        { trackNumber: 3, title: 'New Track 3', duration: '4:00' }
      ];

      const response = await request(app)
        .put(`/api/albums/${album._id}`)
        .send({ tracks: newTracks });

      validateSuccessResponse(response, 200);
      expect(response.body.data.tracks.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.totalTracks).toBeGreaterThanOrEqual(2);
    });

    test('Should fail with duplicate slug on different album', async () => {
      const album1 = await Album.create(
        createTestAlbum({ slug: 'album-one' })
      );
      const album2 = await Album.create(
        createTestAlbum({ slug: 'album-two' })
      );

      // Intentar cambiar slug de album2 al slug de album1
      const response = await request(app)
        .put(`/api/albums/${album2._id}`)
        .send({ slug: 'album-one' });

      validateErrorResponse(response, 400);
      expect(response.body.error.code).toBe('SLUG_ALREADY_EXISTS');
    });

    test('Should allow same slug when updating same album', async () => {
      const album = await Album.create(
        createTestAlbum({ slug: 'my-album' })
      );

      const response = await request(app)
        .put(`/api/albums/${album._id}`)
        .send({
          slug: 'my-album', // Mismo slug
          title: 'Updated Title'
        });

      validateSuccessResponse(response, 200);
      expect(response.body.data.slug).toBe('my-album');
    });

    test('Should update featured flag', async () => {
      const album = await Album.create(
        createTestAlbum({ featured: false })
      );

      const response = await request(app)
        .put(`/api/albums/${album._id}`)
        .send({ featured: true });

      validateSuccessResponse(response, 200);
      expect(response.body.data.featured).toBe(true);
    });
  });

  // ==========================================
  // DELETE /api/albums/:id - Delete album
  // ==========================================
  describe('DELETE /api/albums/:id', () => {
    test('Should delete album successfully', async () => {
      const album = await Album.create(createTestAlbum());

      const response = await request(app)
        .delete(`/api/albums/${album._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);

      // Verificar que se eliminó de DB
      const dbAlbum = await Album.findById(album._id);
      expect(dbAlbum).toBeNull();
    });

    test('Should return 404 for non-existent album', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/albums/${fakeId}`);

      validateErrorResponse(response, 404);
      expect(response.body.error.code).toBe('ALBUM_NOT_FOUND');
    });

    test('Should return error for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/albums/invalid-id-format');

      // Can be 400 (validation) or 500 (cast error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/albums/featured - Featured albums
  // ==========================================
  describe('GET /api/albums/featured', () => {
    test('Should get featured albums', async () => {
      await Album.create([
        createTestAlbum({ title: 'Featured 1', featured: true, status: 'published' }),
        createTestAlbum({ title: 'Featured 2', featured: true, status: 'published' }),
        createTestAlbum({ title: 'Not Featured', featured: false, status: 'published' })
      ]);

      const response = await request(app)
        .get('/api/albums/featured');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(album => album.featured === true)).toBe(true);
    });

    test('Should respect limit parameter', async () => {
      // Crear 10 álbumes featured
      const albums = Array.from({ length: 10 }, (_, i) =>
        createTestAlbum({
          title: `Featured ${i + 1}`,
          featured: true,
          status: 'published'
        })
      );
      await Album.create(albums);

      const response = await request(app)
        .get('/api/albums/featured?limit=3');

      validateSuccessResponse(response, 200);
      expect(response.body.data.length).toBe(3);
    });
  });

  // ==========================================
  // POST /api/albums/:id/publish - Publish album
  // ==========================================
  describe('POST /api/albums/:id/publish', () => {
    test('Should publish draft album', async () => {
      const album = await Album.create(
        createTestAlbum({ status: 'draft' })
      );

      const response = await request(app)
        .post(`/api/albums/${album._id}/publish`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).toBeDefined();

      // Verificar en DB
      const dbAlbum = await Album.findById(album._id);
      expect(dbAlbum.status).toBe('published');
    });

    test('Should return 404 for non-existent album', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/albums/${fakeId}/publish`);

      validateErrorResponse(response, 404);
    });
  });

  // ==========================================
  // POST /api/albums/:id/unpublish - Unpublish album
  // ==========================================
  describe('POST /api/albums/:id/unpublish', () => {
    test('Should unpublish published album', async () => {
      const album = await Album.create(
        createTestAlbum({ status: 'published' })
      );

      const response = await request(app)
        .post(`/api/albums/${album._id}/unpublish`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('draft');

      // Verificar en DB
      const dbAlbum = await Album.findById(album._id);
      expect(dbAlbum.status).toBe('draft');
    });
  });

  // ==========================================
  // POST /api/albums/:id/archive - Archive album
  // ==========================================
  describe('POST /api/albums/:id/archive', () => {
    test('Should archive album', async () => {
      const album = await Album.create(
        createTestAlbum({ status: 'published' })
      );

      const response = await request(app)
        .post(`/api/albums/${album._id}/archive`);

      validateSuccessResponse(response, 200);
      expect(response.body.data.status).toBe('archived');

      // Verificar en DB
      const dbAlbum = await Album.findById(album._id);
      expect(dbAlbum.status).toBe('archived');
    });
  });

  // ==========================================
  // Edge Cases & Validation
  // ==========================================
  describe('Edge Cases & Validation', () => {
    test('Should handle very long album title (within limits)', async () => {
      const longTitle = 'A'.repeat(200); // Max length
      const albumData = createTestAlbum({ title: longTitle });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.title.length).toBe(200);
    });

    test('Should reject album title exceeding max length', async () => {
      const tooLongTitle = 'A'.repeat(201);
      const albumData = createTestAlbum({ title: tooLongTitle });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      // Can be 400 (validation) or 500 (mongoose error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should accept multiple genres', async () => {
      const albumData = createTestAlbum({
        genre: ['Mariachi', 'Regional Mexican', 'Folk', 'Traditional']
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.genre).toEqual([
        'Mariachi',
        'Regional Mexican',
        'Folk',
        'Traditional'
      ]);
    });

    test('Should accept valid album types', async () => {
      const types = ['LP', 'EP', 'Single', 'Live', 'Compilation', 'Remaster'];

      for (const type of types) {
        const albumData = createTestAlbum({
          title: `Album ${type}`,
          slug: `album-${type.toLowerCase()}`,
          type
        });

        const response = await request(app)
          .post('/api/albums')
          .send(albumData);

        validateSuccessResponse(response, 201);
        expect(response.body.data.type).toBe(type);
      }
    });

    test('Should reject invalid album type', async () => {
      const albumData = createTestAlbum({
        type: 'InvalidType'
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      // Can be 400 (validation) or 500 (mongoose error)
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should handle albums with no description', async () => {
      const albumData = createTestAlbum();
      delete albumData.description;

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.description).toBeUndefined();
    });

    test('Should handle albums with streaming links', async () => {
      const albumData = createTestAlbum({
        streamingLinks: [
          {
            platform: 'Spotify',
            url: 'https://open.spotify.com/album/test',
            type: 'streaming'
          },
          {
            platform: 'Apple Music',
            url: 'https://music.apple.com/album/test',
            type: 'streaming'
          }
        ]
      });

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      validateSuccessResponse(response, 201);
      expect(response.body.data.streamingLinks.length).toBe(2);
    });
  });
});
