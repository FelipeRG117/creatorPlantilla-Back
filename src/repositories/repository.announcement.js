/**
 * Announcement Repository
 * Capa de acceso a datos para anuncios
 * Implementa el patrón Repository
 */

import { announcementModel } from '../models/model.announcement.js';
import { logger } from '../config/logger.js';

class AnnouncementRepository {
  /**
   * Crear un nuevo anuncio
   */
  static async create(announcementData) {
    try {
      logger.debug('Creating new announcement', {
        title: announcementData.title,
        category: announcementData.category
      });

      const announcement = new announcementModel(announcementData);
      await announcement.save();

      logger.info('Announcement created successfully', {
        announcementId: announcement._id,
        title: announcement.title,
        slug: announcement.slug
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to create announcement', {
        error: error.message,
        data: announcementData
      });
      throw error;
    }
  }

  /**
   * Buscar todos los anuncios con filtros y paginación
   */
  static async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        populate = false
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Si hay isPinned en el sort, dar prioridad a los fijados
      if (filters.status === 'published') {
        sort.isPinned = -1;
      }

      logger.debug('Finding announcements', {
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      let query = announcementModel.find(filters).sort(sort).skip(skip).limit(limit);

      if (populate) {
        query = query
          .populate({ path: 'author', select: 'firstName lastName email' })
          .populate({ path: 'createdBy', select: 'firstName lastName email' })
          .populate({ path: 'updatedBy', select: 'firstName lastName email' });
      }

      const [announcements, total] = await Promise.all([
        query.exec(),
        announcementModel.countDocuments(filters)
      ]);

      logger.info('Announcements found', {
        count: announcements.length,
        total,
        page,
        limit
      });

      return {
        data: announcements,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to find announcements', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Buscar anuncio por ID
   */
  static async findById(id, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding announcement by ID', { announcementId: id });

      let query = announcementModel.findById(id);

      if (populate) {
        query = query
          .populate({ path: 'author', select: 'firstName lastName email' })
          .populate({ path: 'createdBy', select: 'firstName lastName email' })
          .populate({ path: 'updatedBy', select: 'firstName lastName email' });
      }

      const announcement = await query.exec();

      if (announcement) {
        logger.info('Announcement found', {
          announcementId: id,
          title: announcement.title
        });
      } else {
        logger.warn('Announcement not found', { announcementId: id });
      }

      return announcement;
    } catch (error) {
      logger.error('Failed to find announcement by ID', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncio por slug
   */
  static async findBySlug(slug, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding announcement by slug', { slug });

      let query = announcementModel.findOne({ slug });

      if (populate) {
        query = query
          .populate({ path: 'author', select: 'firstName lastName email' })
          .populate({ path: 'createdBy', select: 'firstName lastName email' })
          .populate({ path: 'updatedBy', select: 'firstName lastName email' });
      }

      const announcement = await query.exec();

      if (announcement) {
        logger.info('Announcement found by slug', {
          slug,
          announcementId: announcement._id,
          title: announcement.title
        });
      } else {
        logger.warn('Announcement not found by slug', { slug });
      }

      return announcement;
    } catch (error) {
      logger.error('Failed to find announcement by slug', {
        slug,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar anuncio
   */
  static async update(id, updateData) {
    try {
      logger.debug('Updating announcement', {
        announcementId: id,
        fields: Object.keys(updateData)
      });

      const announcement = await announcementModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (announcement) {
        logger.info('Announcement updated successfully', {
          announcementId: id,
          title: announcement.title
        });
      } else {
        logger.warn('Announcement not found for update', { announcementId: id });
      }

      return announcement;
    } catch (error) {
      logger.error('Failed to update announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Eliminar anuncio
   */
  static async delete(id) {
    try {
      logger.debug('Deleting announcement', { announcementId: id });

      const announcement = await announcementModel.findByIdAndDelete(id);

      if (announcement) {
        logger.info('Announcement deleted successfully', {
          announcementId: id,
          title: announcement.title
        });
      } else {
        logger.warn('Announcement not found for deletion', { announcementId: id });
      }

      return announcement;
    } catch (error) {
      logger.error('Failed to delete announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios publicados
   */
  static async findPublished(options = {}) {
    try {
      logger.debug('Finding published announcements');

      const announcements = await announcementModel.findPublished(options).exec();

      logger.info('Published announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find published announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios destacados
   */
  static async findFeatured(limit = 5) {
    try {
      logger.debug('Finding featured announcements', { limit });

      const announcements = await announcementModel.findFeatured(limit).exec();

      logger.info('Featured announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find featured announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios fijados
   */
  static async findPinned() {
    try {
      logger.debug('Finding pinned announcements');

      const announcements = await announcementModel.findPinned().exec();

      logger.info('Pinned announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find pinned announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios por categoría
   */
  static async findByCategory(category, options = {}) {
    try {
      logger.debug('Finding announcements by category', { category });

      const announcements = await announcementModel.findByCategory(category, options).exec();

      logger.info('Announcements by category found', {
        category,
        count: announcements.length
      });

      return announcements;
    } catch (error) {
      logger.error('Failed to find announcements by category', {
        category,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios recientes
   */
  static async findRecent(limit = 10) {
    try {
      logger.debug('Finding recent announcements', { limit });

      const announcements = await announcementModel.findRecent(limit).exec();

      logger.info('Recent announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find recent announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios urgentes
   */
  static async findUrgent() {
    try {
      logger.debug('Finding urgent announcements');

      const announcements = await announcementModel.findUrgent().exec();

      logger.info('Urgent announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find urgent announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios próximos a expirar
   */
  static async findExpiringSoon() {
    try {
      logger.debug('Finding announcements expiring soon');

      const announcements = await announcementModel.findExpiringSoon().exec();

      logger.info('Expiring announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find expiring announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios programados
   */
  static async findScheduled() {
    try {
      logger.debug('Finding scheduled announcements');

      const announcements = await announcementModel.findScheduled().exec();

      logger.info('Scheduled announcements found', { count: announcements.length });

      return announcements;
    } catch (error) {
      logger.error('Failed to find scheduled announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar anuncios por texto (search)
   */
  static async search(searchText, options = {}) {
    try {
      logger.debug('Searching announcements', { searchText });

      const regex = new RegExp(searchText, 'i');
      const filters = {
        status: 'published',
        $or: [
          { title: regex },
          { subtitle: regex },
          { content: regex },
          { excerpt: regex },
          { tags: regex }
        ]
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to search announcements', {
        searchText,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Publicar anuncio
   */
  static async publish(id) {
    try {
      logger.debug('Publishing announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.publish();

      logger.info('Announcement published successfully', {
        announcementId: id,
        title: announcement.title
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to publish announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Programar publicación
   */
  static async schedule(id, publishDate) {
    try {
      logger.debug('Scheduling announcement', {
        announcementId: id,
        publishDate
      });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.schedule(publishDate);

      logger.info('Announcement scheduled successfully', {
        announcementId: id,
        publishDate
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to schedule announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Archivar anuncio
   */
  static async archive(id) {
    try {
      logger.debug('Archiving announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.archive();

      logger.info('Announcement archived successfully', {
        announcementId: id,
        title: announcement.title
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to archive announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fijar anuncio
   */
  static async pin(id) {
    try {
      logger.debug('Pinning announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.pin();

      logger.info('Announcement pinned successfully', {
        announcementId: id
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to pin announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Desfijar anuncio
   */
  static async unpin(id) {
    try {
      logger.debug('Unpinning announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.unpin();

      logger.info('Announcement unpinned successfully', {
        announcementId: id
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to unpin announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Marcar como featured
   */
  static async feature(id) {
    try {
      logger.debug('Featuring announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.feature();

      logger.info('Announcement featured successfully', {
        announcementId: id
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to feature announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Quitar featured
   */
  static async unfeature(id) {
    try {
      logger.debug('Unfeaturing announcement', { announcementId: id });

      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.unfeature();

      logger.info('Announcement unfeatured successfully', {
        announcementId: id
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to unfeature announcement', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Incrementar vistas
   */
  static async incrementViews(id) {
    try {
      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.incrementViews();

      return announcement;
    } catch (error) {
      logger.error('Failed to increment views', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Incrementar shares
   */
  static async incrementShares(id) {
    try {
      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.incrementShares();

      logger.info('Announcement shares incremented', {
        announcementId: id,
        shares: announcement.metrics.shares
      });

      return announcement;
    } catch (error) {
      logger.error('Failed to increment shares', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Incrementar clicks
   */
  static async incrementClicks(id) {
    try {
      const announcement = await announcementModel.findById(id);
      if (!announcement) {
        return null;
      }

      await announcement.incrementClicks();

      return announcement;
    } catch (error) {
      logger.error('Failed to increment clicks', {
        announcementId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar anuncios expirados
   */
  static async updateExpired() {
    try {
      logger.debug('Updating expired announcements');

      const count = await announcementModel.updateExpired();

      logger.info('Expired announcements updated', { count });

      return count;
    } catch (error) {
      logger.error('Failed to update expired announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Publicar anuncios programados
   */
  static async publishScheduled() {
    try {
      logger.debug('Publishing scheduled announcements');

      const count = await announcementModel.publishScheduled();

      logger.info('Scheduled announcements published', { count });

      return count;
    } catch (error) {
      logger.error('Failed to publish scheduled announcements', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Contar anuncios por filtros
   */
  static async count(filters = {}) {
    try {
      const count = await announcementModel.countDocuments(filters);
      return count;
    } catch (error) {
      logger.error('Failed to count announcements', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verificar si existe un anuncio con un slug
   */
  static async existsBySlug(slug, excludeId = null) {
    try {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await announcementModel.countDocuments(query);
      return count > 0;
    } catch (error) {
      logger.error('Failed to check slug existence', {
        slug,
        error: error.message
      });
      throw error;
    }
  }
}

export default AnnouncementRepository;
