/**
 * Announcement Controller
 * Controlador para gestión de anuncios
 */

import AnnouncementRepository from '../repositories/repository.announcement.js';
import { logger } from '../config/logger.js';
import CloudinaryService from '../services/service.cloudinary.js';

class AnnouncementController {
  /**
   * Obtener todos los anuncios con filtros y paginación
   * GET /api/announcements
   */
  static async getAll(req, res, next) {
    try {
      logger.http('Getting all announcements', {
        correlationId: req.correlationId,
        query: req.query
      });

      const {
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        category,
        priority,
        isPinned,
        isFeatured,
        search
      } = req.query;

      // Construir filtros
      const filters = {};

      if (status) filters.status = status;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;
      if (isPinned !== undefined) filters.isPinned = isPinned;
      if (isFeatured !== undefined) filters.isFeatured = isFeatured;

      // Opciones
      const options = {
        page: page || 1,
        limit: limit || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      };

      let result;

      // Si hay búsqueda, usar el método search
      if (search) {
        result = await AnnouncementRepository.search(search, options);
      } else {
        result = await AnnouncementRepository.findAll(filters, options);
      }

      logger.info('Announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: result.data.length,
        total: result.pagination.total
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener un anuncio por ID
   * GET /api/announcements/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Getting announcement by ID', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.findById(id, { populate: true });

      if (!announcement) {
        logger.warn('Announcement not found', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      // Incrementar vistas
      await AnnouncementRepository.incrementViews(id);

      logger.info('Announcement retrieved successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        title: announcement.title
      });

      res.status(200).json({
        success: true,
        data: announcement,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener un anuncio por slug
   * GET /api/announcements/slug/:slug
   */
  static async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      logger.http('Getting announcement by slug', {
        correlationId: req.correlationId,
        slug
      });

      const announcement = await AnnouncementRepository.findBySlug(slug, { populate: true });

      if (!announcement) {
        logger.warn('Announcement not found by slug', {
          correlationId: req.correlationId,
          slug
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      // Incrementar vistas
      await AnnouncementRepository.incrementViews(announcement._id);

      logger.info('Announcement retrieved by slug successfully', {
        correlationId: req.correlationId,
        slug,
        announcementId: announcement._id
      });

      res.status(200).json({
        success: true,
        data: announcement,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get announcement by slug', {
        correlationId: req.correlationId,
        slug: req.params.slug,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Crear un nuevo anuncio
   * POST /api/announcements
   */
  static async create(req, res, next) {
    try {
      logger.http('Creating announcement', {
        correlationId: req.correlationId,
        title: req.body.title
      });

      const announcement = await AnnouncementRepository.create(req.body);

      logger.info('Announcement created successfully', {
        correlationId: req.correlationId,
        announcementId: announcement._id,
        title: announcement.title
      });

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to create announcement', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Actualizar un anuncio
   * PUT /api/announcements/:id
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Updating announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.update(id, req.body);

      if (!announcement) {
        logger.warn('Announcement not found for update', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Announcement updated successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        title: announcement.title
      });

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement updated successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to update announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Eliminar un anuncio
   * DELETE /api/announcements/:id
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Deleting announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.delete(id);

      if (!announcement) {
        logger.warn('Announcement not found for deletion', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Announcement deleted successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        title: announcement.title
      });

      res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to delete announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios publicados
   * GET /api/announcements/published
   */
  static async getPublished(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;

      logger.http('Getting published announcements', {
        correlationId: req.correlationId,
        limit
      });

      const announcements = await AnnouncementRepository.findPublished({ limit });

      logger.info('Published announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get published announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios destacados
   * GET /api/announcements/featured
   */
  static async getFeatured(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 5;

      logger.http('Getting featured announcements', {
        correlationId: req.correlationId,
        limit
      });

      const announcements = await AnnouncementRepository.findFeatured(limit);

      logger.info('Featured announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get featured announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios fijados
   * GET /api/announcements/pinned
   */
  static async getPinned(req, res, next) {
    try {
      logger.http('Getting pinned announcements', {
        correlationId: req.correlationId
      });

      const announcements = await AnnouncementRepository.findPinned();

      logger.info('Pinned announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get pinned announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios recientes
   * GET /api/announcements/recent
   */
  static async getRecent(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      logger.http('Getting recent announcements', {
        correlationId: req.correlationId,
        limit
      });

      const announcements = await AnnouncementRepository.findRecent(limit);

      logger.info('Recent announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get recent announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios urgentes
   * GET /api/announcements/urgent
   */
  static async getUrgent(req, res, next) {
    try {
      logger.http('Getting urgent announcements', {
        correlationId: req.correlationId
      });

      const announcements = await AnnouncementRepository.findUrgent();

      logger.info('Urgent announcements retrieved successfully', {
        correlationId: req.correlationId,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get urgent announcements', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener anuncios por categoría
   * GET /api/announcements/category/:category
   */
  static async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      logger.http('Getting announcements by category', {
        correlationId: req.correlationId,
        category
      });

      const announcements = await AnnouncementRepository.findByCategory(category, { limit });

      logger.info('Announcements by category retrieved successfully', {
        correlationId: req.correlationId,
        category,
        count: announcements.length
      });

      res.status(200).json({
        success: true,
        data: announcements,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get announcements by category', {
        correlationId: req.correlationId,
        category: req.params.category,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Publicar anuncio
   * POST /api/announcements/:id/publish
   */
  static async publish(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Publishing announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.publish(id);

      if (!announcement) {
        logger.warn('Announcement not found for publishing', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Announcement published successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        title: announcement.title
      });

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement published successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to publish announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Programar publicación
   * POST /api/announcements/:id/schedule
   */
  static async schedule(req, res, next) {
    try {
      const { id } = req.params;
      const { publishDate } = req.body;

      logger.http('Scheduling announcement', {
        correlationId: req.correlationId,
        announcementId: id,
        publishDate
      });

      const announcement = await AnnouncementRepository.schedule(id, publishDate);

      if (!announcement) {
        logger.warn('Announcement not found for scheduling', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Announcement scheduled successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        publishDate
      });

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement scheduled successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to schedule announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Archivar anuncio
   * POST /api/announcements/:id/archive
   */
  static async archive(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Archiving announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.archive(id);

      if (!announcement) {
        logger.warn('Announcement not found for archiving', {
          correlationId: req.correlationId,
          announcementId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Announcement archived successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        title: announcement.title
      });

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement archived successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to archive announcement', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Fijar anuncio
   * POST /api/announcements/:id/pin
   */
  static async pin(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Pinning announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.pin(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement pinned successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to pin announcement', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Desfijar anuncio
   * POST /api/announcements/:id/unpin
   */
  static async unpin(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Unpinning announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.unpin(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement unpinned successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to unpin announcement', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Marcar como featured
   * POST /api/announcements/:id/feature
   */
  static async feature(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Featuring announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.feature(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement featured successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to feature announcement', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Quitar featured
   * POST /api/announcements/:id/unfeature
   */
  static async unfeature(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Unfeaturing announcement', {
        correlationId: req.correlationId,
        announcementId: id
      });

      const announcement = await AnnouncementRepository.unfeature(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement unfeatured successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to unfeature announcement', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Incrementar shares
   * POST /api/announcements/:id/share
   */
  static async share(req, res, next) {
    try {
      const { id } = req.params;

      const announcement = await AnnouncementRepository.incrementShares(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        message: 'Share recorded successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Incrementar clicks
   * POST /api/announcements/:id/click
   */
  static async click(req, res, next) {
    try {
      const { id } = req.params;

      const announcement = await AnnouncementRepository.incrementClicks(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      res.status(200).json({
        success: true,
        message: 'Click recorded successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subir imagen de cobertura
   * POST /api/announcements/:id/upload-cover
   */
  static async uploadCover(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Uploading cover image', {
        correlationId: req.correlationId,
        announcementId: id
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          correlationId: req.correlationId
        });
      }

      // Subir a Cloudinary
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'announcements',
        {
          correlationId: req.correlationId
        }
      );

      // Actualizar anuncio con la nueva imagen
      const announcement = await AnnouncementRepository.findById(id);

      if (!announcement) {
        await CloudinaryService.deleteImage(uploadResult.public_id);

        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
          correlationId: req.correlationId
        });
      }

      announcement.coverImage = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        altText: req.body.altText || announcement.title
      };

      await announcement.save();

      logger.info('Cover image uploaded successfully', {
        correlationId: req.correlationId,
        announcementId: id,
        imageUrl: uploadResult.secure_url
      });

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Cover image uploaded successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to upload cover image', {
        correlationId: req.correlationId,
        announcementId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }
}

export default AnnouncementController;
