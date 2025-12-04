/**
 * Product Repository
 * Capa de acceso a datos para productos
 * Implementa el patrón Repository
 */

import { productModel } from '../models/model.product.js';
import { logger } from '../config/logger.js';

class ProductRepository {
  /**
   * Crear un nuevo producto
   */
  static async create(productData) {
    try {
      logger.debug('Creating new product', {
        name: productData.name,
        category: productData.category,
        variantsCount: productData.variants?.length
      });

      const product = new productModel(productData);
      await product.save();

      logger.info('Product created successfully', {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        variantsCount: product.variants.length
      });

      return product;
    } catch (error) {
      logger.error('Failed to create product', {
        error: error.message,
        data: productData
      });
      throw error;
    }
  }

  /**
   * Buscar todos los productos con filtros y paginación
   */
  static async findAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        populate = false
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      logger.debug('Finding products', {
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      let query = productModel.find(filters).sort(sort).skip(skip).limit(limit);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const [products, total] = await Promise.all([
        query.exec(),
        productModel.countDocuments(filters)
      ]);

      logger.info('Products found', {
        count: products.length,
        total,
        page,
        limit
      });

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to find products', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Buscar producto por ID
   */
  static async findById(id, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding product by ID', { productId: id });

      let query = productModel.findById(id);

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const product = await query.exec();

      if (product) {
        logger.info('Product found', {
          productId: id,
          name: product.name
        });
      } else {
        logger.warn('Product not found', { productId: id });
      }

      return product;
    } catch (error) {
      logger.error('Failed to find product by ID', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar producto por slug
   */
  static async findBySlug(slug, options = {}) {
    try {
      const { populate = false } = options;

      logger.debug('Finding product by slug', { slug });

      let query = productModel.findOne({ slug });

      if (populate) {
        query = query.populate('createdBy updatedBy', 'name email');
      }

      const product = await query.exec();

      if (product) {
        logger.info('Product found by slug', {
          slug,
          productId: product._id,
          name: product.name
        });
      } else {
        logger.warn('Product not found by slug', { slug });
      }

      return product;
    } catch (error) {
      logger.error('Failed to find product by slug', {
        slug,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  static async update(id, updateData) {
    try {
      logger.debug('Updating product', {
        productId: id,
        fields: Object.keys(updateData)
      });

      const product = await productModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (product) {
        logger.info('Product updated successfully', {
          productId: id,
          name: product.name
        });
      } else {
        logger.warn('Product not found for update', { productId: id });
      }

      return product;
    } catch (error) {
      logger.error('Failed to update product', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  static async delete(id) {
    try {
      logger.debug('Deleting product', { productId: id });

      const product = await productModel.findByIdAndDelete(id);

      if (product) {
        logger.info('Product deleted successfully', {
          productId: id,
          name: product.name
        });
      } else {
        logger.warn('Product not found for deletion', { productId: id });
      }

      return product;
    } catch (error) {
      logger.error('Failed to delete product', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos publicados
   */
  static async findPublished(options = {}) {
    return this.findAll({ status: 'published' }, options);
  }

  /**
   * Buscar productos destacados
   */
  static async findFeatured(limit = 6) {
    try {
      logger.debug('Finding featured products', { limit });

      const products = await productModel.findFeatured(limit).exec();

      logger.info('Featured products found', { count: products.length });

      return products;
    } catch (error) {
      logger.error('Failed to find featured products', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos nuevos
   */
  static async findNewArrivals(limit = 12) {
    try {
      logger.debug('Finding new arrivals', { limit });

      const products = await productModel.findNewArrivals(limit).exec();

      logger.info('New arrivals found', { count: products.length });

      return products;
    } catch (error) {
      logger.error('Failed to find new arrivals', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar bestsellers
   */
  static async findBestsellers(limit = 10) {
    try {
      logger.debug('Finding bestsellers', { limit });

      const products = await productModel.findBestsellers(limit).exec();

      logger.info('Bestsellers found', { count: products.length });

      return products;
    } catch (error) {
      logger.error('Failed to find bestsellers', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos por categoría
   */
  static async findByCategory(category, options = {}) {
    try {
      logger.debug('Finding products by category', { category });

      const filters = {
        status: 'published',
        category
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to find products by category', {
        category,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos con stock bajo
   */
  static async findLowStock() {
    try {
      logger.debug('Finding low stock products');

      const products = await productModel.findLowStock().exec();

      logger.info('Low stock products found', { count: products.length });

      return products;
    } catch (error) {
      logger.error('Failed to find low stock products', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos por rango de precio
   */
  static async findByPriceRange(minPrice, maxPrice, options = {}) {
    try {
      logger.debug('Finding products by price range', { minPrice, maxPrice });

      const filters = {
        status: 'published',
        'variants.pricing.basePrice': {
          $gte: minPrice,
          $lte: maxPrice
        }
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to find products by price range', {
        minPrice,
        maxPrice,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar productos por texto (search)
   */
  static async search(searchText, options = {}) {
    try {
      logger.debug('Searching products', { searchText });

      const regex = new RegExp(searchText, 'i');
      const filters = {
        status: 'published',
        $or: [
          { name: regex },
          { description: regex },
          { shortDescription: regex },
          { brand: regex },
          { tags: regex }
        ]
      };

      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Failed to search products', {
        searchText,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Contar productos por filtros
   */
  static async count(filters = {}) {
    try {
      const count = await productModel.countDocuments(filters);
      return count;
    } catch (error) {
      logger.error('Failed to count products', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verificar si existe un producto con un slug
   */
  static async existsBySlug(slug, excludeId = null) {
    try {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await productModel.countDocuments(query);
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
   * Publicar producto
   */
  static async publish(id) {
    try {
      logger.debug('Publishing product', { productId: id });

      const product = await productModel.findById(id);
      if (!product) {
        return null;
      }

      await product.publish();

      logger.info('Product published successfully', {
        productId: id,
        name: product.name
      });

      return product;
    } catch (error) {
      logger.error('Failed to publish product', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Archivar producto
   */
  static async archive(id) {
    try {
      logger.debug('Archiving product', { productId: id });

      const product = await productModel.findById(id);
      if (!product) {
        return null;
      }

      await product.archive();

      logger.info('Product archived successfully', {
        productId: id,
        name: product.name
      });

      return product;
    } catch (error) {
      logger.error('Failed to archive product', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar stock de una variante
   */
  static async updateVariantStock(productId, variantId, quantity) {
    try {
      logger.debug('Updating variant stock', {
        productId,
        variantId,
        quantity
      });

      const product = await productModel.findById(productId);
      if (!product) {
        return null;
      }

      await product.updateVariantStock(variantId, quantity);

      logger.info('Variant stock updated successfully', {
        productId,
        variantId,
        newQuantity: quantity
      });

      return product;
    } catch (error) {
      logger.error('Failed to update variant stock', {
        productId,
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Decrementar stock (para compras)
   */
  static async decrementStock(productId, variantId, quantity = 1) {
    try {
      logger.debug('Decrementing variant stock', {
        productId,
        variantId,
        quantity
      });

      const product = await productModel.findById(productId);
      if (!product) {
        return null;
      }

      await product.decrementStock(variantId, quantity);

      logger.info('Stock decremented successfully', {
        productId,
        variantId,
        quantity
      });

      return product;
    } catch (error) {
      logger.error('Failed to decrement stock', {
        productId,
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Incrementar vistas del producto
   */
  static async incrementViews(id) {
    try {
      const product = await productModel.findById(id);
      if (!product) {
        return null;
      }

      await product.incrementViews();

      return product;
    } catch (error) {
      logger.error('Failed to increment views', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Actualizar rating del producto
   */
  static async updateRating(id, rating) {
    try {
      logger.debug('Updating product rating', {
        productId: id,
        rating
      });

      const product = await productModel.findById(id);
      if (!product) {
        return null;
      }

      await product.updateRating(rating);

      logger.info('Product rating updated', {
        productId: id,
        newAverage: product.metrics.rating.average,
        totalRatings: product.metrics.rating.count
      });

      return product;
    } catch (error) {
      logger.error('Failed to update rating', {
        productId: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar variante específica de un producto
   */
  static async findVariant(productId, variantId) {
    try {
      logger.debug('Finding variant', { productId, variantId });

      const product = await productModel.findById(productId);
      if (!product) {
        return null;
      }

      const variant = product.variants.id(variantId);

      if (variant) {
        logger.info('Variant found', {
          productId,
          variantId,
          sku: variant.sku
        });
      } else {
        logger.warn('Variant not found', { productId, variantId });
      }

      return variant;
    } catch (error) {
      logger.error('Failed to find variant', {
        productId,
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Buscar producto por SKU de variante
   */
  static async findBySKU(sku) {
    try {
      logger.debug('Finding product by SKU', { sku });

      const product = await productModel.findOne({
        'variants.sku': sku.toUpperCase()
      });

      if (product) {
        const variant = product.variants.find(v => v.sku === sku.toUpperCase());
        logger.info('Product found by SKU', {
          sku,
          productId: product._id,
          variantId: variant._id
        });

        return { product, variant };
      } else {
        logger.warn('Product not found by SKU', { sku });
        return null;
      }
    } catch (error) {
      logger.error('Failed to find product by SKU', {
        sku,
        error: error.message
      });
      throw error;
    }
  }
}

export default ProductRepository;
