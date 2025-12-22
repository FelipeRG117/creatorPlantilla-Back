/**
 * Concert Controller
 * Controlador para manejo de conciertos
 */

import ConcertRepository from '../repositories/repository.concert.js';
import CloudinaryService from '../services/service.cloudinary.js';
import { logger } from '../config/logger.js';
import { bufferToDataURI } from '../middleware/upload.middleware.js';

class ConcertController {
  /**
   * GET /api/concerts
   * Listar todos los conciertos con filtros y paginación
   */
  static async getAll(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, populate, search, ...filters } =
        req.query;

      logger.http('Getting concerts list', {
        correlationId: req.correlationId,
        filters,
        page,
        limit
      });

      let result;
     
        result = await ConcertRepository.findAll(filters, {
          page,
          limit,
          sortBy,
          sortOrder,
          populate
        });
      

      logger.info('Concerts list retrieved successfully', {
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
      logger.error('Failed to get concerts list', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/concerts/:id
   * Obtener un concierto por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { populate } = req.query;

      logger.http('Getting concert by ID', {
        correlationId: req.correlationId,
        concertId: id
      });

      const concert = await ConcertRepository.findById(id, { populate });

      if (!concert) {
        logger.warn('Concert not found', {
          correlationId: req.correlationId,
          concertId: id
        });

        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Concert retrieved successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get concert by ID', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/concerts/slug/:slug
   * Obtener un concierto por slug
   */
  static async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const { populate } = req.query;

      logger.http('Getting concert by slug', {
        correlationId: req.correlationId,
        slug
      });

      const concert = await ConcertRepository.findBySlug(slug, { populate });

      if (!concert) {
        logger.warn('Concert not found by slug', {
          correlationId: req.correlationId,
          slug
        });

        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Concert retrieved by slug successfully', {
        correlationId: req.correlationId,
        slug,
        concertId: concert._id
      });

      res.status(200).json({
        success: true,
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get concert by slug', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/concerts
   * Crear un nuevo concierto
   */
  static async create(req, res, next) {
    try {
      const concertData = req.body;

      logger.http('Creating new concert', {
        correlationId: req.correlationId,
        title: concertData.title
      });

      // Verificar slug único
      if (concertData.slug) {
        const slugExists = await ConcertRepository.existsBySlug(
          concertData.slug
        );
        if (slugExists) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SLUG_ALREADY_EXISTS',
              message: 'A concert with this slug already exists'
            },
            correlationId: req.correlationId
          });
        }
      }

      if (req.user) {
        concertData.createdBy = req.user._id;
      }

      const concert = await ConcertRepository.create(concertData);

      logger.info('Concert created successfully', {
        correlationId: req.correlationId,
        concertId: concert._id,
        title: concert.title
      });

      res.status(201).json({
        success: true,
        message: 'Concert created successfully',
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to create concert', {
        correlationId: req.correlationId,
        error: error.message
      });

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_CONCERT',
            message: 'A concert with this slug already exists'
          },
          correlationId: req.correlationId
        });
      }

      next(error);
    }
  }

  /**
   * PUT /api/concerts/:id
   * Actualizar un concierto
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.http('Updating concert', {
        correlationId: req.correlationId,
        concertId: id
      });

      const existingConcert = await ConcertRepository.findById(id);
      if (!existingConcert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      if (updateData.slug && updateData.slug !== existingConcert.slug) {
        const slugExists = await ConcertRepository.existsBySlug(
          updateData.slug,
          id
        );
        if (slugExists) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SLUG_ALREADY_EXISTS',
              message: 'A concert with this slug already exists'
            },
            correlationId: req.correlationId
          });
        }
      }

      if (req.user) {
        updateData.updatedBy = req.user._id;
      }

      const concert = await ConcertRepository.update(id, updateData);

      logger.info('Concert updated successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        message: 'Concert updated successfully',
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to update concert', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * DELETE /api/concerts/:id
   * Eliminar un concierto
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Deleting concert', {
        correlationId: req.correlationId,
        concertId: id
      });

      const concert = await ConcertRepository.findById(id);

      if (!concert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      // Eliminar imágenes de Cloudinary
      if (CloudinaryService.isConfigured()) {
        try {
          if (concert.posterImagePublicId) {
            await CloudinaryService.deleteImage(concert.posterImagePublicId);
          }

          if (concert.images && concert.images.length > 0) {
            const publicIds = concert.images
              .filter((img) => img.publicId)
              .map((img) => img.publicId);

            if (publicIds.length > 0) {
              await CloudinaryService.deleteMultipleImages(publicIds);
            }
          }
        } catch (cloudinaryError) {
          logger.warn('Failed to delete images from Cloudinary', {
            correlationId: req.correlationId,
            concertId: id,
            error: cloudinaryError.message
          });
        }
      }

      await ConcertRepository.delete(id);

      logger.info('Concert deleted successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        message: 'Concert deleted successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to delete concert', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/concerts/upcoming
   * Obtener próximos conciertos
   */
  static async getUpcoming(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      logger.http('Getting upcoming concerts', {
        correlationId: req.correlationId,
        limit
      });

      const concerts = await ConcertRepository.findUpcoming(limit);

      logger.info('Upcoming concerts retrieved successfully', {
        correlationId: req.correlationId,
        count: concerts.length
      });

      res.status(200).json({
        success: true,
        data: concerts,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get upcoming concerts', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/concerts/featured
   * Obtener conciertos destacados
   */
  static async getFeatured(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;

      logger.http('Getting featured concerts', {
        correlationId: req.correlationId,
        limit
      });

      const concerts = await ConcertRepository.findFeatured(limit);

      logger.info('Featured concerts retrieved successfully', {
        correlationId: req.correlationId,
        count: concerts.length
      });

      res.status(200).json({
        success: true,
        data: concerts,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get featured concerts', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/concerts/:id/publish
   * Publicar un concierto
   */
  static async publish(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Publishing concert', {
        correlationId: req.correlationId,
        concertId: id
      });

      const concert = await ConcertRepository.publish(id);

      if (!concert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Concert published successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        message: 'Concert published successfully',
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to publish concert', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/concerts/:id/cancel
   * Cancelar un concierto
   */
  static async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      logger.http('Cancelling concert', {
        correlationId: req.correlationId,
        concertId: id,
        reason
      });

      const concert = await ConcertRepository.cancel(id, reason);

      if (!concert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Concert cancelled successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        message: 'Concert cancelled successfully',
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to cancel concert', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/concerts/:id/sold-out
   * Marcar concierto como sold out
   */
  static async markAsSoldOut(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Marking concert as sold out', {
        correlationId: req.correlationId,
        concertId: id
      });

      const concert = await ConcertRepository.markAsSoldOut(id);

      if (!concert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Concert marked as sold out successfully', {
        correlationId: req.correlationId,
        concertId: id,
        title: concert.title
      });

      res.status(200).json({
        success: true,
        message: 'Concert marked as sold out',
        data: concert,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to mark concert as sold out', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/concerts/:id/upload-poster
   * Subir/actualizar poster image
   */
  static async uploadPoster(req, res, next) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_PROVIDED',
            message: 'No image file provided'
          },
          correlationId: req.correlationId
        });
      }

      logger.http('Uploading poster image', {
        correlationId: req.correlationId,
        concertId: id,
        filename: file.originalname
      });

      const concert = await ConcertRepository.findById(id);
      if (!concert) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONCERT_NOT_FOUND',
            message: 'Concert not found'
          },
          correlationId: req.correlationId
        });
      }

      // Eliminar poster anterior
      if (concert.posterImagePublicId && CloudinaryService.isConfigured()) {
        try {
          await CloudinaryService.deleteImage(concert.posterImagePublicId);
        } catch (error) {
          logger.warn('Failed to delete old poster image', {
            correlationId: req.correlationId,
            publicId: concert.posterImagePublicId,
            error: error.message
          });
        }
      }

      // Subir nueva imagen
      const dataURI = bufferToDataURI(file);
      const uploadResult = await CloudinaryService.uploadImage(dataURI, {
        folder: 'mariachi-web/concerts/posters',
        transformation: [{ width: 1200, height: 1600, crop: 'fill' }]
      });

      const updatedConcert = await ConcertRepository.update(id, {
        posterImage: uploadResult.data.secureUrl,
        posterImagePublicId: uploadResult.data.publicId
      });

      logger.info('Poster image uploaded successfully', {
        correlationId: req.correlationId,
        concertId: id,
        publicId: uploadResult.data.publicId
      });

      res.status(200).json({
        success: true,
        message: 'Poster image uploaded successfully',
        data: {
          posterImage: updatedConcert.posterImage,
          posterImagePublicId: updatedConcert.posterImagePublicId
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to upload poster image', {
        correlationId: req.correlationId,
        concertId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }
}

export default ConcertController;
