/**
 * Product Routes
 * Rutas para la gestión de productos
 */

import { Router } from 'express';
import ProductController from '../controllers/controller.product.js';
import { validateRequest as validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productSlugSchema,
  productQuerySchema,
  categorySchema,
  skuSchema,
  limitSchema
} from '../validators/validator.product.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();

// ==========================================
// RUTAS PÚBLICAS (READ-ONLY)
// ==========================================

/**
 * GET /api/products/featured
 * Obtener productos destacados
 */
router.get('/featured', validateQuery(limitSchema), ProductController.getFeatured);

/**
 * GET /api/products/new-arrivals
 * Obtener productos nuevos
 */
router.get('/new-arrivals', validateQuery(limitSchema), ProductController.getNewArrivals);

/**
 * GET /api/products/bestsellers
 * Obtener bestsellers
 */
router.get('/bestsellers', validateQuery(limitSchema), ProductController.getBestsellers);

/**
 * GET /api/products/low-stock
 * Obtener productos con stock bajo (admin)
 */
router.get('/low-stock', ProductController.getLowStock);

/**
 * GET /api/products/category/:category
 * Obtener productos por categoría
 */
router.get(
  '/category/:category',
  validateParams(categorySchema),
  validateQuery(productQuerySchema),
  ProductController.getByCategory
);

/**
 * GET /api/products/sku/:sku
 * Buscar producto por SKU
 */
router.get('/sku/:sku', validateParams(skuSchema), ProductController.getBySKU);

/**
 * GET /api/products/slug/:slug
 * Obtener producto por slug
 */
router.get('/slug/:slug', validateParams(productSlugSchema), ProductController.getBySlug);

/**
 * GET /api/products/:id
 * Obtener producto por ID
 */
router.get('/:id', validateParams(productIdSchema), ProductController.getById);

/**
 * GET /api/products
 * Obtener todos los productos con filtros
 */
router.get('/', validateQuery(productQuerySchema), ProductController.getAll);

// ==========================================
// RUTAS PROTEGIDAS (ADMIN/AUTH)
// ==========================================

/**
 * POST /api/products
 * Crear un nuevo producto
 */
router.post('/', validateBody(createProductSchema), ProductController.create);

/**
 * PUT /api/products/:id
 * Actualizar un producto
 */
router.put(
  '/:id',
  validateParams(productIdSchema),
  validateBody(updateProductSchema),
  ProductController.update
);

/**
 * DELETE /api/products/:id
 * Eliminar un producto
 */
router.delete('/:id', validateParams(productIdSchema), ProductController.delete);

/**
 * POST /api/products/:id/publish
 * Publicar un producto
 */
router.post('/:id/publish', validateParams(productIdSchema), ProductController.publish);

/**
 * POST /api/products/:id/archive
 * Archivar un producto
 */
router.post('/:id/archive', validateParams(productIdSchema), ProductController.archive);

/**
 * PUT /api/products/:productId/variants/:variantId/stock
 * Actualizar stock de una variante
 */
router.put(
  '/:productId/variants/:variantId/stock',
  ProductController.updateStock
);

/**
 * POST /api/products/:id/upload-image
 * Subir imagen de producto
 */
router.post(
  '/:id/upload-image',
  validateParams(productIdSchema),
  uploadSingle,
  ProductController.uploadImage
);

export { router as routesProducts };
export default router;
