/**
 * Concert Repository
 * Capa de acceso a datos para conciertos
 * Implementa el patrón Repository
 */

import { concertModel } from '../models/model.concert.js';
import { logger } from '../config/logger.js';

class ConcertRepository {
  /**
   * Crear un nuevo concierto
   */
  static async create(concertData) {
    try {
      logger.debug('Creating new concert', {
        title: concertData.title,
        eventDate: concertData.eventDate
      });

      const concert = new concertModel(concertData);
      await concert.save();

      logger.info('Concert created successfully', {
        concertId: concert._id,
        title: concert.title,
        eventDate: concert.eventDate
      });

      return concert;
    } catch (error) {
      logger.error('Failed to create concert', {
        error: error.message,
        data: concertData
      });
      throw error;
    }
  }

  /**
   * Buscar todos los conciertos con filtros y paginación
   */
  static async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'eventDate',
        sortOrder = 'asc',
        populate = false
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      logger.debug('Finding concerts', {
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      let query = concertModel.find(filters).sort(sort).skip(skip).limit(limit);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const [concerts, total] = await Promise.all([
        query.exec(),
        concertModel.countDocuments(filters)
      ]);

      logger.info('Concerts found', {
        count: concerts.length,
        total,
        page,
        limit
      });

      return {
        data: concerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to find concerts', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Buscar concierto por ID
   */
  static async findById(id, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding concert by ID', { concertId: id });

      let query = concertModel.findById(id);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const concert = await query.exec();

      if (concert) {
        logger.info('Concert found', {
          concertId: id,
          title: concert.title
        });
      } else {
        logger.warn('Concert not found', { concertId: id });
      }

      return concert;
    } catch (error) {
      logger.error('Failed to find concert by ID', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar concierto por slug
   */
  static async findBySlug(slug, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding concert by slug', { slug });

      let query = concertModel.findOne({ slug });

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const concert = await query.exec();

      if (concert) {
        logger.info('Concert found by slug', {
          slug,
          concertId: concert._id,
          title: concert.title
        });
      } else {
        logger.warn('Concert not found by slug', { slug });
      }

      return concert;
    } catch (error) {
      logger.error('Failed to find concert by slug', {
        slug,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar concierto
   */
  static async update(id, updateData) {
    try {
      logger.debug('Updating concert', {
        concertId: id,
        fields: Object.keys(updateData)
      });

      const concert = await concertModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (concert) {
        logger.info('Concert updated successfully', {
          concertId: id,
          title: concert.title
        });
      } else {
        logger.warn('Concert not found for update', { concertId: id });
      }

      return concert;
    } catch (error) {
      logger.error('Failed to update concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Eliminar concierto
   */
  static async delete(id) {
    try {
      logger.debug('Deleting concert', { concertId: id });

      const concert = await concertModel.findByIdAndDelete(id);

      if (concert) {
        logger.info('Concert deleted successfully', {
          concertId: id,
          title: concert.title
        });
      } else {
        logger.warn('Concert not found for deletion', { concertId: id });
      }

      return concert;
    } catch (error) {
      logger.error('Failed to delete concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos publicados
   */
  static async findPublished(options = {}) {
    return this.findAll({ status: 'published' }, options);
  }

  /**
   * Buscar conciertos futuros (upcoming)
   */
  static async findUpcoming(limit = 10) {
    try {
      const now = new Date();

      logger.debug('Finding upcoming concerts', { limit });

      const concerts = await concertModel.findUpcoming(limit).exec();

      logger.info('Upcoming concerts found', { count: concerts.length });

      return concerts;
    } catch (error) {
      logger.error('Failed to find upcoming concerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos pasados
   */
  static async findPast(limit = 10) {
    try {
      logger.debug('Finding past concerts', { limit });

      const concerts = await concertModel.findPast(limit).exec();

      logger.info('Past concerts found', { count: concerts.length });

      return concerts;
    } catch (error) {
      logger.error('Failed to find past concerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos destacados
   */
  static async findFeatured(limit = 6) {
    try {
      logger.debug('Finding featured concerts', { limit });

      const concerts = await concertModel.findFeatured().limit(limit).exec();

      logger.info('Featured concerts found', { count: concerts.length });

      return concerts;
    } catch (error) {
      logger.error('Failed to find featured concerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos por ciudad
   */
  static async findByCity(city, options = {}) {
    try {
      logger.debug('Finding concerts by city', { city });

      const now = new Date();
      const filters = {
        status: 'published',
        'location.city': new RegExp(city, 'i'),
        eventDate: { $gte: now }
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to find concerts by city', {
        city,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos por país
   */
  static async findByCountry(country, options = {}) {
    try {
      logger.debug('Finding concerts by country', { country });

      const now = new Date();
      const filters = {
        status: 'published',
        'location.country': new RegExp(country, 'i'),
        eventDate: { $gte: now }
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to find concerts by country', {
        country,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos por rango de fechas
   */
  static async findByDateRange(startDate, endDate, options = {}) {
    try {
      logger.debug('Finding concerts by date range', { startDate, endDate });

      const filters = {
        status: 'published',
        eventDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to find concerts by date range', {
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos por texto
   */
  static async search(searchText, options = {}) {
    try {
      logger.debug('Searching concerts', { searchText });

      const regex = new RegExp(searchText, 'i');
      const filters = {
        status: 'published',
        $or: [
          { title: regex },
          { description: regex },
          { 'location.venueName': regex },
          { 'location.city': regex }
        ]
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to search concerts', {
        searchText,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Contar conciertos por filtros
   */
  static async count(filters = {}) {
    try {
      const count = await concertModel.countDocuments(filters);
      return count;
    } catch (error) {
      logger.error('Failed to count concerts', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verificar si existe un concierto con un slug
   */
  static async existsBySlug(slug, excludeId = null) {
    try {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await concertModel.countDocuments(query);
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
   * Publicar concierto
   */
  static async publish(id) {
    try {
      logger.debug('Publishing concert', { concertId: id });

      const concert = await concertModel.findById(id);
      if (!concert) {
        return null;
      }

      await concert.publish();

      logger.info('Concert published successfully', {
        concertId: id,
        title: concert.title
      });

      return concert;
    } catch (error) {
      logger.error('Failed to publish concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Marcar concierto como sold out
   */
  static async markAsSoldOut(id) {
    try {
      logger.debug('Marking concert as sold out', { concertId: id });

      const concert = await concertModel.findById(id);
      if (!concert) {
        return null;
      }

      await concert.markAsSoldOut();

      logger.info('Concert marked as sold out', {
        concertId: id,
        title: concert.title
      });

      return concert;
    } catch (error) {
      logger.error('Failed to mark concert as sold out', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancelar concierto
   */
  static async cancel(id, reason) {
    try {
      logger.debug('Cancelling concert', { concertId: id, reason });

      const concert = await concertModel.findById(id);
      if (!concert) {
        return null;
      }

      await concert.cancel(reason);

      logger.info('Concert cancelled successfully', {
        concertId: id,
        title: concert.title,
        reason
      });

      return concert;
    } catch (error) {
      logger.error('Failed to cancel concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Marcar concierto como completado
   */
  static async complete(id) {
    try {
      logger.debug('Completing concert', { concertId: id });

      const concert = await concertModel.findById(id);
      if (!concert) {
        return null;
      }

      await concert.complete();

      logger.info('Concert completed successfully', {
        concertId: id,
        title: concert.title
      });

      return concert;
    } catch (error) {
      logger.error('Failed to complete concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }
}

export default ConcertRepository;
