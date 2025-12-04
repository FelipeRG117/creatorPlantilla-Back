/**
 * Album Controller
 * Controlador para manejo de álbumes
 * Implementa todos los métodos CRUD + funcionalidades especiales
 */

import AlbumRepository from '../repositories/repository.album.js';
import CloudinaryService from '../services/service.cloudinary.js';
import { logger } from '../config/logger.js';
import { bufferToDataURI } from '../middleware/upload.middleware.js';

class AlbumController {
  /**
   * GET /api/albums
   * Listar todos los álbumes con filtros y paginación
   */
  static async getAll(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, populate, search, ...filters } =
        req.query;

      logger.http('Getting albums list', {
        correlationId: req.correlationId,
        filters,
        page,
        limit
      });

      // Si hay búsqueda, usar el método search
      let result;
      if (search) {
        result = await AlbumRepository.search(search, {
          page,
          limit,
          sortBy,
          sortOrder,
          populate
        });
      } else {
        result = await AlbumRepository.findAll(filters, {
          page,
          limit,
          sortBy,
          sortOrder,
          populate
        });
      }

      logger.info('Albums list retrieved successfully', {
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
      logger.error('Failed to get albums list', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/albums/:id
   * Obtener un álbum por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { populate } = req.query;

      logger.http('Getting album by ID', {
        correlationId: req.correlationId,
        albumId: id
      });

      const album = await AlbumRepository.findById(id, { populate });

      if (!album) {
        logger.warn('Album not found', {
          correlationId: req.correlationId,
          albumId: id
        });

        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Album retrieved successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get album by ID', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/albums/slug/:slug
   * Obtener un álbum por slug
   */
  static async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const { populate } = req.query;

      logger.http('Getting album by slug', {
        correlationId: req.correlationId,
        slug
      });

      const album = await AlbumRepository.findBySlug(slug, { populate });

      if (!album) {
        logger.warn('Album not found by slug', {
          correlationId: req.correlationId,
          slug
        });

        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Album retrieved by slug successfully', {
        correlationId: req.correlationId,
        slug,
        albumId: album._id
      });

      res.status(200).json({
        success: true,
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get album by slug', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/albums
   * Crear un nuevo álbum
   */
  static async create(req, res, next) {
    try {
      const albumData = req.body;

      logger.http('Creating new album', {
        correlationId: req.correlationId,
        title: albumData.title
      });

      // Verificar si el slug ya existe
      if (albumData.slug) {
        const slugExists = await AlbumRepository.existsBySlug(albumData.slug);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SLUG_ALREADY_EXISTS',
              message: 'An album with this slug already exists'
            },
            correlationId: req.correlationId
          });
        }
      }

      // Si hay usuario autenticado, agregarlo como creador
      if (req.user) {
        albumData.createdBy = req.user._id;
      }

      const album = await AlbumRepository.create(albumData);

      logger.info('Album created successfully', {
        correlationId: req.correlationId,
        albumId: album._id,
        title: album.title
      });

      res.status(201).json({
        success: true,
        message: 'Album created successfully',
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to create album', {
        correlationId: req.correlationId,
        error: error.message
      });

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ALBUM',
            message: 'An album with this slug already exists'
          },
          correlationId: req.correlationId
        });
      }

      next(error);
    }
  }

  /**
   * PUT /api/albums/:id
   * Actualizar un álbum
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.http('Updating album', {
        correlationId: req.correlationId,
        albumId: id
      });

      // Verificar si el álbum existe
      const existingAlbum = await AlbumRepository.findById(id);
      if (!existingAlbum) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      // Verificar si el nuevo slug ya existe (si se está cambiando)
      if (updateData.slug && updateData.slug !== existingAlbum.slug) {
        const slugExists = await AlbumRepository.existsBySlug(
          updateData.slug,
          id
        );
        if (slugExists) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SLUG_ALREADY_EXISTS',
              message: 'An album with this slug already exists'
            },
            correlationId: req.correlationId
          });
        }
      }

      // Si hay usuario autenticado, agregarlo como actualizador
      if (req.user) {
        updateData.updatedBy = req.user._id;
      }

      const album = await AlbumRepository.update(id, updateData);

      logger.info('Album updated successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        message: 'Album updated successfully',
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to update album', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ALBUM',
            message: 'An album with this slug already exists'
          },
          correlationId: req.correlationId
        });
      }

      next(error);
    }
  }

  /**
   * DELETE /api/albums/:id
   * Eliminar un álbum
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Deleting album', {
        correlationId: req.correlationId,
        albumId: id
      });

      const album = await AlbumRepository.findById(id);

      if (!album) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      // Eliminar imágenes de Cloudinary si están configuradas
      if (CloudinaryService.isConfigured()) {
        try {
          // Eliminar cover image
          if (album.coverImagePublicId) {
            await CloudinaryService.deleteImage(album.coverImagePublicId);
          }

          // Eliminar imágenes adicionales
          if (album.images && album.images.length > 0) {
            const publicIds = album.images
              .filter((img) => img.publicId)
              .map((img) => img.publicId);

            if (publicIds.length > 0) {
              await CloudinaryService.deleteMultipleImages(publicIds);
            }
          }
        } catch (cloudinaryError) {
          logger.warn('Failed to delete images from Cloudinary', {
            correlationId: req.correlationId,
            albumId: id,
            error: cloudinaryError.message
          });
          // Continuar con la eliminación del álbum aunque falle Cloudinary
        }
      }

      await AlbumRepository.delete(id);

      logger.info('Album deleted successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        message: 'Album deleted successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to delete album', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/albums/featured
   * Obtener álbumes destacados
   */
  static async getFeatured(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;

      logger.http('Getting featured albums', {
        correlationId: req.correlationId,
        limit
      });

      const albums = await AlbumRepository.findFeatured(limit);

      logger.info('Featured albums retrieved successfully', {
        correlationId: req.correlationId,
        count: albums.length
      });

      res.status(200).json({
        success: true,
        data: albums,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get featured albums', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * GET /api/albums/new-releases
   * Obtener nuevos lanzamientos
   */
  static async getNewReleases(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;

      logger.http('Getting new releases', {
        correlationId: req.correlationId,
        limit
      });

      const albums = await AlbumRepository.findNewReleases(limit);

      logger.info('New releases retrieved successfully', {
        correlationId: req.correlationId,
        count: albums.length
      });

      res.status(200).json({
        success: true,
        data: albums,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get new releases', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/albums/:id/publish
   * Publicar un álbum
   */
  static async publish(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Publishing album', {
        correlationId: req.correlationId,
        albumId: id
      });

      const album = await AlbumRepository.publish(id);

      if (!album) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Album published successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        message: 'Album published successfully',
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to publish album', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/albums/:id/unpublish
   * Despublicar un álbum
   */
  static async unpublish(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Unpublishing album', {
        correlationId: req.correlationId,
        albumId: id
      });

      const album = await AlbumRepository.unpublish(id);

      if (!album) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Album unpublished successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        message: 'Album unpublished successfully',
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to unpublish album', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/albums/:id/archive
   * Archivar un álbum
   */
  static async archive(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Archiving album', {
        correlationId: req.correlationId,
        albumId: id
      });

      const album = await AlbumRepository.archive(id);

      if (!album) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      logger.info('Album archived successfully', {
        correlationId: req.correlationId,
        albumId: id,
        title: album.title
      });

      res.status(200).json({
        success: true,
        message: 'Album archived successfully',
        data: album,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to archive album', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * POST /api/albums/:id/upload-cover
   * Subir/actualizar cover image
   */
  static async uploadCover(req, res, next) {
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

      logger.http('Uploading cover image', {
        correlationId: req.correlationId,
        albumId: id,
        filename: file.originalname
      });

      // Verificar que el álbum existe
      const album = await AlbumRepository.findById(id);
      if (!album) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ALBUM_NOT_FOUND',
            message: 'Album not found'
          },
          correlationId: req.correlationId
        });
      }

      // Eliminar cover anterior si existe
      if (album.coverImagePublicId && CloudinaryService.isConfigured()) {
        try {
          await CloudinaryService.deleteImage(album.coverImagePublicId);
        } catch (error) {
          logger.warn('Failed to delete old cover image', {
            correlationId: req.correlationId,
            publicId: album.coverImagePublicId,
            error: error.message
          });
        }
      }

      // Subir nueva imagen a Cloudinary
      const dataURI = bufferToDataURI(file);
      const uploadResult = await CloudinaryService.uploadImage(dataURI, {
        folder: 'mariachi-web/albums/covers',
        transformation: [{ width: 1500, height: 1500, crop: 'fill' }]
      });

      // Actualizar álbum con nueva imagen
      const updatedAlbum = await AlbumRepository.update(id, {
        coverImage: uploadResult.data.secureUrl,
        coverImagePublicId: uploadResult.data.publicId
      });

      logger.info('Cover image uploaded successfully', {
        correlationId: req.correlationId,
        albumId: id,
        publicId: uploadResult.data.publicId
      });

      res.status(200).json({
        success: true,
        message: 'Cover image uploaded successfully',
        data: {
          coverImage: updatedAlbum.coverImage,
          coverImagePublicId: updatedAlbum.coverImagePublicId
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to upload cover image', {
        correlationId: req.correlationId,
        albumId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }
}

export default AlbumController;
