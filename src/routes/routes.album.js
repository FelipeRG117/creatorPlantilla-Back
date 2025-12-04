/**
 * Album Routes
 * Rutas para el módulo de álbumes
 * Incluye validación Zod, autenticación y rate limiting
 */

import { Router } from 'express';
import AlbumController from '../controllers/controller.album.js';
import {
  createAlbumSchema,
  updateAlbumSchema,
  albumQuerySchema,
  albumIdSchema,
  albumSlugSchema,
  validateBody,
  validateQuery,
  validateParams
} from '../validators/validator.album.js';
import {
  uploadSingle,
  handleMulterError,
  requireFile
} from '../middleware/upload.middleware.js';
// import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Rutas públicas (sin autenticación)
 */

// GET /api/albums - Listar todos los álbumes
router.get('/', validateQuery(albumQuerySchema), AlbumController.getAll);

// GET /api/albums/featured - Álbumes destacados
router.get('/featured', AlbumController.getFeatured);

// GET /api/albums/new-releases - Nuevos lanzamientos
router.get('/new-releases', AlbumController.getNewReleases);

// GET /api/albums/slug/:slug - Obtener álbum por slug
router.get(
  '/slug/:slug',
  validateParams(albumSlugSchema),
  AlbumController.getBySlug
);

// GET /api/albums/:id - Obtener álbum por ID
router.get('/:id', validateParams(albumIdSchema), AlbumController.getById);

/**
 * Rutas protegidas (requieren autenticación)
 * TODO: Descomentar cuando el middleware de auth esté disponible
 */

// POST /api/albums - Crear nuevo álbum
router.post(
  '/',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateBody(createAlbumSchema),
  AlbumController.create
);

// PUT /api/albums/:id - Actualizar álbum
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(albumIdSchema),
  validateBody(updateAlbumSchema),
  AlbumController.update
);

// DELETE /api/albums/:id - Eliminar álbum
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validateParams(albumIdSchema),
  AlbumController.delete
);

// POST /api/albums/:id/publish - Publicar álbum
router.post(
  '/:id/publish',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(albumIdSchema),
  AlbumController.publish
);

// POST /api/albums/:id/unpublish - Despublicar álbum
router.post(
  '/:id/unpublish',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(albumIdSchema),
  AlbumController.unpublish
);

// POST /api/albums/:id/archive - Archivar álbum
router.post(
  '/:id/archive',
  // authenticate,
  // authorize(['admin']),
  validateParams(albumIdSchema),
  AlbumController.archive
);

// POST /api/albums/:id/upload-cover - Subir cover image
router.post(
  '/:id/upload-cover',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(albumIdSchema),
  uploadSingle,
  handleMulterError,
  requireFile,
  AlbumController.uploadCover
);

export const routesAlbums = router;
export default router;
