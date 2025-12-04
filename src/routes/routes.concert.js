/**
 * Concert Routes
 * Rutas para el módulo de conciertos
 */

import { Router } from 'express';
import ConcertController from '../controllers/controller.concert.js';
import {
  createConcertSchema,
  updateConcertSchema,
  concertQuerySchema,
  concertIdSchema,
  concertSlugSchema,
  cancelConcertSchema,
  validateBody,
  validateQuery,
  validateParams
} from '../validators/validator.concert.js';
import {
  uploadSingle,
  handleMulterError,
  requireFile
} from '../middleware/upload.middleware.js';

const router = Router();

/**
 * Rutas públicas
 */

// GET /api/concerts - Listar conciertos
router.get('/', validateQuery(concertQuerySchema), ConcertController.getAll);

// GET /api/concerts/upcoming - Próximos conciertos
router.get('/upcoming', ConcertController.getUpcoming);

// GET /api/concerts/featured - Conciertos destacados
router.get('/featured', ConcertController.getFeatured);

// GET /api/concerts/slug/:slug - Obtener por slug
router.get(
  '/slug/:slug',
  validateParams(concertSlugSchema),
  ConcertController.getBySlug
);

// GET /api/concerts/:id - Obtener por ID
router.get(
  '/:id',
  validateParams(concertIdSchema),
  ConcertController.getById
);

/**
 * Rutas protegidas (admin/editor)
 */

// POST /api/concerts - Crear concierto
router.post(
  '/',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateBody(createConcertSchema),
  ConcertController.create
);

// PUT /api/concerts/:id - Actualizar concierto
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(concertIdSchema),
  validateBody(updateConcertSchema),
  ConcertController.update
);

// DELETE /api/concerts/:id - Eliminar concierto
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validateParams(concertIdSchema),
  ConcertController.delete
);

// POST /api/concerts/:id/publish - Publicar
router.post(
  '/:id/publish',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(concertIdSchema),
  ConcertController.publish
);

// POST /api/concerts/:id/cancel - Cancelar
router.post(
  '/:id/cancel',
  // authenticate,
  // authorize(['admin']),
  validateParams(concertIdSchema),
  validateBody(cancelConcertSchema),
  ConcertController.cancel
);

// POST /api/concerts/:id/sold-out - Marcar como sold out
router.post(
  '/:id/sold-out',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(concertIdSchema),
  ConcertController.markAsSoldOut
);

// POST /api/concerts/:id/upload-poster - Subir poster
router.post(
  '/:id/upload-poster',
  // authenticate,
  // authorize(['admin', 'editor']),
  validateParams(concertIdSchema),
  uploadSingle,
  handleMulterError,
  requireFile,
  ConcertController.uploadPoster
);

export const routesConcerts = router;
export default router;
