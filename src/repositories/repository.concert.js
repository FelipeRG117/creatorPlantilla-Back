/**
 * Concert Repository - Simplified
 * Capa de acceso a datos para conciertos
 */

import { concertModel } from '../models/model.concert.js';
import { logger } from '../config/logger.js';
import ConcertDTO from '../dto/concert.dto.js';

class ConcertRepository {
  /**
   * Crear un nuevo concierto
   */
  static async create(concertData) {
    try {
      logger.debug('Creating new concert', {
        venue: concertData.venue,
        date: concertData.date
      });

      const concert = new concertModel(concertData);
      await concert.save();

      logger.info('Concert created successfully', {
        concertId: concert._id,
        venue: concert.venue,
        date: concert.date
      });

      return new ConcertDTO(concert);
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
        limit = 40, //Harcoddo
        sortBy = 'date',
        sortOrder = 'asc'
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

       //const query = concertModel.find(filters).sort(sort).skip(skip).limit(limit);
      //Harcodeado para que ande
      const query = concertModel.find().sort(sort).skip(skip)

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
        data: concerts.map(concert => new ConcertDTO(concert)),
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
  static async findById(id) {
    try {
      logger.debug('Finding concert by ID', { concertId: id });

      const concert = await concertModel.findById(id).exec();

      if (concert) {
        logger.info('Concert found', {
          concertId: id,
          venue: concert.venue
        });
      } else {
        logger.warn('Concert not found', { concertId: id });
      }

      return concert ? new ConcertDTO(concert) : null;
    } catch (error) {
      logger.error('Failed to find concert by ID', {
        concertId: id,
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
          venue: concert.venue
        });
      } else {
        logger.warn('Concert not found for update', { concertId: id });
      }

      return concert ? new ConcertDTO(concert) : null;
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
          venue: concert.venue
        });
      } else {
        logger.warn('Concert not found for deletion', { concertId: id });
      }

      return concert ? { success: true } : null;
    } catch (error) {
      logger.error('Failed to delete concert', {
        concertId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar conciertos futuros (upcoming)
   */
  static async findUpcoming(limit = 10) {
    try {
      logger.debug('Finding upcoming concerts', { limit });

      const concerts = await concertModel.findUpcoming(limit).exec();

      logger.info('Upcoming concerts found', { count: concerts.length });

      return concerts.map(concert => new ConcertDTO(concert));
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

      return concerts.map(concert => new ConcertDTO(concert));
    } catch (error) {
      logger.error('Failed to find past concerts', {
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

      const concerts = await concertModel.findByCity(city).exec();

      logger.info('Concerts found by city', {
        city,
        count: concerts.length
      });

      return concerts.map(concert => new ConcertDTO(concert));
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

      const concerts = await concertModel.findByCountry(country).exec();

      logger.info('Concerts found by country', {
        country,
        count: concerts.length
      });

      return concerts.map(concert => new ConcertDTO(concert));
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
        date: {
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
        $or: [
          { venue: regex },
          { city: regex },
          { address: regex },
          { country: regex }
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
   * Contar conciertos
   */
  static async count(filters = {}) {
    try {
      logger.debug('Counting concerts', { filters });

      const count = await concertModel.countDocuments(filters);

      logger.info('Concerts counted', { count, filters });

      return count;
    } catch (error) {
      logger.error('Failed to count concerts', {
        filters,
        error: error.message
      });
      throw error;
    }
  }
}

export default ConcertRepository;
