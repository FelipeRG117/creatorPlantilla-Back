/**
 * Product Controller
 * Controlador para gestión de productos
 */

import ProductRepository from '../repositories/repository.product.js';
import { logger } from '../config/logger.js';
import CloudinaryService from '../services/service.cloudinary.js';

class ProductController {
  /**
   * Obtener todos los productos con filtros y paginación
   * GET /api/products
   */
  static async getAll(req, res, next) {
    try {
      logger.http('Getting all products', {
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
        subcategory,
        isFeatured,
        isNewArrival,
        minPrice,
        maxPrice,
        search,
        brand,
        inStock
      } = req.query;

      // Construir filtros
      const filters = {};

      if (status) filters.status = status;
      if (category) filters.category = category;
      if (subcategory) filters.subcategory = subcategory;
      if (isFeatured !== undefined) filters.isFeatured = isFeatured;
      if (isNewArrival !== undefined) filters.isNewArrival = isNewArrival;
      if (brand) filters.brand = brand;

      // Filtro de precio
      if (minPrice || maxPrice) {
        filters['variants.pricing.basePrice'] = {};
        if (minPrice) filters['variants.pricing.basePrice'].$gte = minPrice;
        if (maxPrice) filters['variants.pricing.basePrice'].$lte = maxPrice;
      }

      // Opciones
      const options = {
        page: page || 1,
        limit: limit || 12,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      };

      let result;

      // Si hay búsqueda, usar el método search
      if (search) {
        result = await ProductRepository.search(search, options);
      } else {
        result = await ProductRepository.findAll(filters, options);
      }

      logger.info('Products retrieved successfully', {
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
      logger.error('Failed to get products', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener un producto por ID
   * GET /api/products/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Getting product by ID', {
        correlationId: req.correlationId,
        productId: id
      });

      const product = await ProductRepository.findById(id, { populate: true });

      if (!product) {
        logger.warn('Product not found', {
          correlationId: req.correlationId,
          productId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      // Incrementar vistas
      await ProductRepository.incrementViews(id);

      logger.info('Product retrieved successfully', {
        correlationId: req.correlationId,
        productId: id,
        name: product.name
      });

      res.status(200).json({
        success: true,
        data: product,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get product', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener un producto por slug
   * GET /api/products/slug/:slug
   */
  static async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      logger.http('Getting product by slug', {
        correlationId: req.correlationId,
        slug
      });

      const product = await ProductRepository.findBySlug(slug, { populate: true });

      if (!product) {
        logger.warn('Product not found by slug', {
          correlationId: req.correlationId,
          slug
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      // Incrementar vistas
      await ProductRepository.incrementViews(product._id);

      logger.info('Product retrieved by slug successfully', {
        correlationId: req.correlationId,
        slug,
        productId: product._id
      });

      res.status(200).json({
        success: true,
        data: product,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get product by slug', {
        correlationId: req.correlationId,
        slug: req.params.slug,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Crear un nuevo producto
   * POST /api/products
   */
  static async create(req, res, next) {
    try {
      logger.http('Creating product', {
        correlationId: req.correlationId,
        name: req.body.name
      });

      const product = await ProductRepository.create(req.body);

      logger.info('Product created successfully', {
        correlationId: req.correlationId,
        productId: product._id,
        name: product.name
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to create product', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Actualizar un producto
   * PUT /api/products/:id
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Updating product', {
        correlationId: req.correlationId,
        productId: id
      });

      const product = await ProductRepository.update(id, req.body);

      if (!product) {
        logger.warn('Product not found for update', {
          correlationId: req.correlationId,
          productId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Product updated successfully', {
        correlationId: req.correlationId,
        productId: id,
        name: product.name
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to update product', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Eliminar un producto
   * DELETE /api/products/:id
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Deleting product', {
        correlationId: req.correlationId,
        productId: id
      });

      const product = await ProductRepository.delete(id);

      if (!product) {
        logger.warn('Product not found for deletion', {
          correlationId: req.correlationId,
          productId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Product deleted successfully', {
        correlationId: req.correlationId,
        productId: id,
        name: product.name
      });

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to delete product', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener productos destacados
   * GET /api/products/featured
   */
  static async getFeatured(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;

      logger.http('Getting featured products', {
        correlationId: req.correlationId,
        limit
      });

      const products = await ProductRepository.findFeatured(limit);

      logger.info('Featured products retrieved successfully', {
        correlationId: req.correlationId,
        count: products.length
      });

      res.status(200).json({
        success: true,
        data: products,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get featured products', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener productos nuevos
   * GET /api/products/new-arrivals
   */
  static async getNewArrivals(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 12;

      logger.http('Getting new arrivals', {
        correlationId: req.correlationId,
        limit
      });

      const products = await ProductRepository.findNewArrivals(limit);

      logger.info('New arrivals retrieved successfully', {
        correlationId: req.correlationId,
        count: products.length
      });

      res.status(200).json({
        success: true,
        data: products,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get new arrivals', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener bestsellers
   * GET /api/products/bestsellers
   */
  static async getBestsellers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      logger.http('Getting bestsellers', {
        correlationId: req.correlationId,
        limit
      });

      const products = await ProductRepository.findBestsellers(limit);

      logger.info('Bestsellers retrieved successfully', {
        correlationId: req.correlationId,
        count: products.length
      });

      res.status(200).json({
        success: true,
        data: products,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get bestsellers', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener productos por categoría
   * GET /api/products/category/:category
   */
  static async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query;

      logger.http('Getting products by category', {
        correlationId: req.correlationId,
        category
      });

      const options = {
        page: page || 1,
        limit: limit || 12,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      };

      const result = await ProductRepository.findByCategory(category, options);

      logger.info('Products by category retrieved successfully', {
        correlationId: req.correlationId,
        category,
        count: result.data.length
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get products by category', {
        correlationId: req.correlationId,
        category: req.params.category,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtener productos con stock bajo
   * GET /api/products/low-stock
   */
  static async getLowStock(req, res, next) {
    try {
      logger.http('Getting low stock products', {
        correlationId: req.correlationId
      });

      const products = await ProductRepository.findLowStock();

      logger.info('Low stock products retrieved successfully', {
        correlationId: req.correlationId,
        count: products.length
      });

      res.status(200).json({
        success: true,
        data: products,
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get low stock products', {
        correlationId: req.correlationId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Publicar producto
   * POST /api/products/:id/publish
   */
  static async publish(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Publishing product', {
        correlationId: req.correlationId,
        productId: id
      });

      const product = await ProductRepository.publish(id);

      if (!product) {
        logger.warn('Product not found for publishing', {
          correlationId: req.correlationId,
          productId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Product published successfully', {
        correlationId: req.correlationId,
        productId: id,
        name: product.name
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product published successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to publish product', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Archivar producto
   * POST /api/products/:id/archive
   */
  static async archive(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Archiving product', {
        correlationId: req.correlationId,
        productId: id
      });

      const product = await ProductRepository.archive(id);

      if (!product) {
        logger.warn('Product not found for archiving', {
          correlationId: req.correlationId,
          productId: id
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Product archived successfully', {
        correlationId: req.correlationId,
        productId: id,
        name: product.name
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product archived successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to archive product', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Actualizar stock de variante
   * PUT /api/products/:productId/variants/:variantId/stock
   */
  static async updateStock(req, res, next) {
    try {
      const { productId, variantId } = req.params;
      const { quantity } = req.body;

      logger.http('Updating variant stock', {
        correlationId: req.correlationId,
        productId,
        variantId,
        quantity
      });

      const product = await ProductRepository.updateVariantStock(
        productId,
        variantId,
        quantity
      );

      if (!product) {
        logger.warn('Product or variant not found for stock update', {
          correlationId: req.correlationId,
          productId,
          variantId
        });
        return res.status(404).json({
          success: false,
          message: 'Product or variant not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Variant stock updated successfully', {
        correlationId: req.correlationId,
        productId,
        variantId,
        newQuantity: quantity
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Stock updated successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to update stock', {
        correlationId: req.correlationId,
        productId: req.params.productId,
        variantId: req.params.variantId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Buscar producto por SKU
   * GET /api/products/sku/:sku
   */
  static async getBySKU(req, res, next) {
    try {
      const { sku } = req.params;

      logger.http('Getting product by SKU', {
        correlationId: req.correlationId,
        sku
      });

      const result = await ProductRepository.findBySKU(sku);

      if (!result) {
        logger.warn('Product not found by SKU', {
          correlationId: req.correlationId,
          sku
        });
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      logger.info('Product found by SKU', {
        correlationId: req.correlationId,
        sku,
        productId: result.product._id
      });

      res.status(200).json({
        success: true,
        data: {
          product: result.product,
          variant: result.variant
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to get product by SKU', {
        correlationId: req.correlationId,
        sku: req.params.sku,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Subir imagen de producto
   * POST /api/products/:id/upload-image
   */
  static async uploadImage(req, res, next) {
    try {
      const { id } = req.params;

      logger.http('Uploading product image', {
        correlationId: req.correlationId,
        productId: id
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
        'products',
        {
          correlationId: req.correlationId
        }
      );

      // Actualizar producto con la nueva imagen
      const product = await ProductRepository.findById(id);

      if (!product) {
        // Si el producto no existe, eliminar la imagen de Cloudinary
        await CloudinaryService.deleteImage(uploadResult.public_id);

        return res.status(404).json({
          success: false,
          message: 'Product not found',
          correlationId: req.correlationId
        });
      }

      // Agregar la imagen al producto
      product.images.push({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        altText: req.body.altText || product.name,
        isPrimary: product.images.length === 0 // Primera imagen es primary
      });

      await product.save();

      logger.info('Product image uploaded successfully', {
        correlationId: req.correlationId,
        productId: id,
        imageUrl: uploadResult.secure_url
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Image uploaded successfully',
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Failed to upload product image', {
        correlationId: req.correlationId,
        productId: req.params.id,
        error: error.message
      });
      next(error);
    }
  }
}

export default ProductController;
