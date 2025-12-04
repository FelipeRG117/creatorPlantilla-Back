/**
 * Album Repository
 * Capa de acceso a datos para álbumes
 * Implementa el patrón Repository para abstraer la lógica de BD
 */

import { albumModel } from '../models/model.album.js';
import { logger } from '../config/logger.js';

class AlbumRepository {
  /**
   * Crear un nuevo álbum
   * @param {Object} albumData - Datos del álbum
   * @returns {Promise<Object>} - Álbum creado
   */
  static async create(albumData) {
    try {
      logger.debug('Creating new album', {
        title: albumData.title
      });

      const album = new albumModel(albumData);
      await album.save();

      logger.info('Album created successfully', {
        albumId: album._id,
        title: album.title
      });

      return album;
    } catch (error) {
      logger.error('Failed to create album', {
        error: error.message,
        data: albumData
      });
      throw error;
    }
  }

  /**
   * Buscar todos los álbumes con filtros y paginación
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} options - Opciones de paginación y ordenamiento
   * @returns {Promise<Object>} - Lista de álbumes con metadata
   */
  static async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'releaseDate',
        sortOrder = 'desc',
        populate = false
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      logger.debug('Finding albums', {
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      let query = albumModel.find(filters).sort(sort).skip(skip).limit(limit);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const [albums, total] = await Promise.all([
        query.exec(),
        albumModel.countDocuments(filters)
      ]);

      logger.info('Albums found', {
        count: albums.length,
        total,
        page,
        limit
      });

      return {
        data: albums,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to find albums', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Buscar álbum por ID
   * @param {string} id - ID del álbum
   * @param {Object} options - Opciones
   * @returns {Promise<Object|null>} - Álbum encontrado o null
   */
  static async findById(id, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding album by ID', { albumId: id });

      let query = albumModel.findById(id);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const album = await query.exec();

      if (album) {
        logger.info('Album found', {
          albumId: id,
          title: album.title
        });
      } else {
        logger.warn('Album not found', { albumId: id });
      }

      return album;
    } catch (error) {
      logger.error('Failed to find album by ID', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar álbum por slug
   * @param {string} slug - Slug del álbum
   * @param {Object} options - Opciones
   * @returns {Promise<Object|null>} - Álbum encontrado o null
   */
  static async findBySlug(slug, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding album by slug', { slug });

      let query = albumModel.findOne({ slug });

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const album = await query.exec();

      if (album) {
        logger.info('Album found by slug', {
          slug,
          albumId: album._id,
          title: album.title
        });
      } else {
        logger.warn('Album not found by slug', { slug });
      }

      return album;
    } catch (error) {
      logger.error('Failed to find album by slug', {
        slug,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar álbum
   * @param {string} id - ID del álbum
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object|null>} - Álbum actualizado o null
   */
  static async update(id, updateData) {
    try {
      logger.debug('Updating album', {
        albumId: id,
        fields: Object.keys(updateData)
      });

      const album = await albumModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (album) {
        logger.info('Album updated successfully', {
          albumId: id,
          title: album.title
        });
      } else {
        logger.warn('Album not found for update', { albumId: id });
      }

      return album;
    } catch (error) {
      logger.error('Failed to update album', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Eliminar álbum
   * @param {string} id - ID del álbum
   * @returns {Promise<Object|null>} - Álbum eliminado o null
   */
  static async delete(id) {
    try {
      logger.debug('Deleting album', { albumId: id });

      const album = await albumModel.findByIdAndDelete(id);

      if (album) {
        logger.info('Album deleted successfully', {
          albumId: id,
          title: album.title
        });
      } else {
        logger.warn('Album not found for deletion', { albumId: id });
      }

      return album;
    } catch (error) {
      logger.error('Failed to delete album', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar álbumes publicados
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} - Álbumes publicados
   */
  static async findPublished(options = {}) {
    return this.findAll({ status: 'published' }, options);
  }

  /**
   * Buscar álbumes destacados
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Álbumes destacados
   */
  static async findFeatured(limit = 6) {
    try {
      logger.debug('Finding featured albums', { limit });

      const albums = await albumModel.findFeatured().limit(limit).exec();

      logger.info('Featured albums found', { count: albums.length });

      return albums;
    } catch (error) {
      logger.error('Failed to find featured albums', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar nuevos lanzamientos
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Nuevos lanzamientos
   */
  static async findNewReleases(limit = 6) {
    try {
      logger.debug('Finding new releases', { limit });

      const albums = await albumModel.findNewReleases().limit(limit).exec();

      logger.info('New releases found', { count: albums.length });

      return albums;
    } catch (error) {
      logger.error('Failed to find new releases', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar álbumes por año
   * @param {number} year - Año de lanzamiento
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} - Álbumes del año
   */
  static async findByYear(year, options = {}) {
    try {
      logger.debug('Finding albums by year', { year });

      return this.findAll({ releaseYear: year, status: 'published' }, options);
    } catch (error) {
      logger.error('Failed to find albums by year', {
        year,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar álbumes por género
   * @param {string} genre - Género musical
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} - Álbumes del género
   */
  static async findByGenre(genre, options = {}) {
    try {
      logger.debug('Finding albums by genre', { genre });

      return this.findAll({ genre: genre, status: 'published' }, options);
    } catch (error) {
      logger.error('Failed to find albums by genre', {
        genre,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar álbumes por texto (título o descripción)
   * @param {string} searchText - Texto a buscar
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} - Álbumes encontrados
   */
  static async search(searchText, options = {}) {
    try {
      logger.debug('Searching albums', { searchText });

      const regex = new RegExp(searchText, 'i');
      const filters = {
        status: 'published',
        $or: [{ title: regex }, { description: regex }, { artist: regex }]
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to search albums', {
        searchText,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Contar álbumes por filtros
   * @param {Object} filters - Filtros
   * @returns {Promise<number>} - Cantidad de álbumes
   */
  static async count(filters = {}) {
    try {
      const count = await albumModel.countDocuments(filters);
      return count;
    } catch (error) {
      logger.error('Failed to count albums', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verificar si existe un álbum con un slug
   * @param {string} slug - Slug a verificar
   * @param {string} excludeId - ID a excluir (para updates)
   * @returns {Promise<boolean>} - True si existe
   */
  static async existsBySlug(slug, excludeId = null) {
    try {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await albumModel.countDocuments(query);
      return count > 0;
    } catch (error) {
      logger.error('Failed to check slug existence', {
        slug,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Publicar álbum
   * @param {string} id - ID del álbum
   * @returns {Promise<Object|null>} - Álbum publicado
   */
  static async publish(id) {
    try {
      logger.debug('Publishing album', { albumId: id });

      const album = await albumModel.findById(id);
      if (!album) {
        return null;
      }

      await album.publish();

      logger.info('Album published successfully', {
        albumId: id,
        title: album.title
      });

      return album;
    } catch (error) {
      logger.error('Failed to publish album', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Despublicar álbum
   * @param {string} id - ID del álbum
   * @returns {Promise<Object|null>} - Álbum despublicado
   */
  static async unpublish(id) {
    try {
      logger.debug('Unpublishing album', { albumId: id });

      const album = await albumModel.findById(id);
      if (!album) {
        return null;
      }

      await album.unpublish();

      logger.info('Album unpublished successfully', {
        albumId: id,
        title: album.title
      });

      return album;
    } catch (error) {
      logger.error('Failed to unpublish album', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Archivar álbum
   * @param {string} id - ID del álbum
   * @returns {Promise<Object|null>} - Álbum archivado
   */
  static async archive(id) {
    try {
      logger.debug('Archiving album', { albumId: id });

      const album = await albumModel.findById(id);
      if (!album) {
        return null;
      }

      await album.archive();

      logger.info('Album archived successfully', {
        albumId: id,
        title: album.title
      });

      return album;
    } catch (error) {
      logger.error('Failed to archive album', {
        albumId: id,
        error: error.message
      });
      throw error;
    }
  }
}

export default AlbumRepository;
