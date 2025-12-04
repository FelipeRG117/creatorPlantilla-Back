/**
 * Announcement Routes
 * Rutas para la gestión de anuncios
 */

import { Router } from 'express';
import AnnouncementController from '../controllers/controller.announcement.js';
import { validateRequest as validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdSchema,
  announcementSlugSchema,
  announcementQuerySchema,
  categorySchema,
  scheduleAnnouncementSchema,
  limitSchema
} from '../validators/validator.announcement.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();

// ==========================================
// RUTAS PÚBLICAS (READ-ONLY)
// ==========================================

/**
 * GET /api/announcements/published
 * Obtener anuncios publicados
 */
router.get('/published', validateQuery(limitSchema), AnnouncementController.getPublished);

/**
 * GET /api/announcements/featured
 * Obtener anuncios destacados
 */
router.get('/featured', validateQuery(limitSchema), AnnouncementController.getFeatured);

/**
 * GET /api/announcements/pinned
 * Obtener anuncios fijados
 */
router.get('/pinned', AnnouncementController.getPinned);

/**
 * GET /api/announcements/recent
 * Obtener anuncios recientes
 */
router.get('/recent', validateQuery(limitSchema), AnnouncementController.getRecent);

/**
 * GET /api/announcements/urgent
 * Obtener anuncios urgentes
 */
router.get('/urgent', AnnouncementController.getUrgent);

/**
 * GET /api/announcements/category/:category
 * Obtener anuncios por categoría
 */
router.get(
  '/category/:category',
  validateParams(categorySchema),
  validateQuery(limitSchema),
  AnnouncementController.getByCategory
);

/**
 * GET /api/announcements/slug/:slug
 * Obtener anuncio por slug
 */
router.get('/slug/:slug', validateParams(announcementSlugSchema), AnnouncementController.getBySlug);

/**
 * GET /api/announcements/:id
 * Obtener anuncio por ID
 */
router.get('/:id', validateParams(announcementIdSchema), AnnouncementController.getById);

/**
 * GET /api/announcements
 * Obtener todos los anuncios con filtros
 */
router.get('/', validateQuery(announcementQuerySchema), AnnouncementController.getAll);

// ==========================================
// RUTAS PROTEGIDAS (ADMIN/AUTH)
// ==========================================

/**
 * POST /api/announcements
 * Crear un nuevo anuncio
 */
router.post('/', validateBody(createAnnouncementSchema), AnnouncementController.create);

/**
 * PUT /api/announcements/:id
 * Actualizar un anuncio
 */
router.put(
  '/:id',
  validateParams(announcementIdSchema),
  validateBody(updateAnnouncementSchema),
  AnnouncementController.update
);

/**
 * DELETE /api/announcements/:id
 * Eliminar un anuncio
 */
router.delete('/:id', validateParams(announcementIdSchema), AnnouncementController.delete);

/**
 * POST /api/announcements/:id/publish
 * Publicar un anuncio
 */
router.post('/:id/publish', validateParams(announcementIdSchema), AnnouncementController.publish);

/**
 * POST /api/announcements/:id/schedule
 * Programar publicación de un anuncio
 */
router.post('/:id/schedule', validateParams(announcementIdSchema), AnnouncementController.schedule);

/**
 * POST /api/announcements/:id/archive
 * Archivar un anuncio
 */
router.post('/:id/archive', validateParams(announcementIdSchema), AnnouncementController.archive);

/**
 * POST /api/announcements/:id/pin
 * Fijar un anuncio
 */
router.post('/:id/pin', validateParams(announcementIdSchema), AnnouncementController.pin);

/**
 * POST /api/announcements/:id/unpin
 * Desfijar un anuncio
 */
router.post('/:id/unpin', validateParams(announcementIdSchema), AnnouncementController.unpin);

/**
 * POST /api/announcements/:id/feature
 * Marcar como featured
 */
router.post('/:id/feature', validateParams(announcementIdSchema), AnnouncementController.feature);

/**
 * POST /api/announcements/:id/unfeature
 * Quitar featured
 */
router.post('/:id/unfeature', validateParams(announcementIdSchema), AnnouncementController.unfeature);

/**
 * POST /api/announcements/:id/share
 * Registrar share (para analytics)
 */
router.post('/:id/share', validateParams(announcementIdSchema), AnnouncementController.share);

/**
 * POST /api/announcements/:id/click
 * Registrar click (para analytics)
 */
router.post('/:id/click', validateParams(announcementIdSchema), AnnouncementController.click);

/**
 * POST /api/announcements/:id/upload-cover
 * Subir imagen de cobertura
 */
router.post(
  '/:id/upload-cover',
  validateParams(announcementIdSchema),
  uploadSingle,
  AnnouncementController.uploadCover
);

export { router as routesAnnouncements };
export default router;
