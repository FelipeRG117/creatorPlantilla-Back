/**
 * Product Validators
 * Esquemas de validación con Zod para productos
 */

import { z } from 'zod';

/**
 * Schema de Imagen de Producto
 */
const productImageSchema = z.object({
  url: z.string().url().trim(),
  publicId: z.string().trim().min(1),
  altText: z.string().trim().max(200).optional(),
  isPrimary: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional().default(0)
});

/**
 * Schema de Peso
 */
const weightSchema = z.object({
  value: z.number().min(0),
  unit: z.enum(['g', 'kg', 'lb', 'oz']).default('kg')
}).optional();

/**
 * Schema de Dimensiones
 */
const dimensionsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm')
}).optional();

/**
 * Schema de Atributos de Variante
 */
const variantAttributesSchema = z.object({
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unitalla', 'N/A']).default('N/A'),
  color: z.string().trim().max(50).optional(),
  material: z.string().trim().max(100).optional(),
  custom: z.record(z.string()).optional()
});

/**
 * Schema de Pricing de Variante
 */
const variantPricingSchema = z.object({
  basePrice: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  currency: z.enum(['USD', 'MXN', 'EUR']).default('MXN'),
  costPrice: z.number().min(0).optional()
}).refine(
  (data) => {
    if (data.salePrice !== undefined && data.salePrice !== null) {
      return data.salePrice < data.basePrice;
    }
    return true;
  },
  {
    message: 'Sale price must be less than base price',
    path: ['salePrice']
  }
);

/**
 * Schema de Inventario de Variante
 */
const variantInventorySchema = z.object({
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false)
});

/**
 * Schema de Variante de Producto
 */
const productVariantSchema = z.object({
  sku: z.string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-_]+$/, 'SKU must contain only uppercase letters, numbers, hyphens and underscores'),
  name: z.string().trim().min(1).max(100),
  attributes: variantAttributesSchema.optional().default({}),
  pricing: variantPricingSchema,
  inventory: variantInventorySchema.optional().default({}),
  images: z.array(productImageSchema).optional().default([]),
  weight: weightSchema,
  dimensions: dimensionsSchema,
  isActive: z.boolean().optional().default(true)
});

/**
 * Schema de SEO
 */
const seoSchema = z.object({
  metaTitle: z.string().trim().max(60).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  keywords: z.array(z.string().trim().max(50)).optional()
});

/**
 * Schema de Shipping
 */
const shippingSchema = z.object({
  isFreeShipping: z.boolean().default(false),
  shippingClass: z.enum(['standard', 'express', 'heavy', 'fragile']).default('standard'),
  estimatedDeliveryDays: z.object({
    min: z.number().int().min(1).optional(),
    max: z.number().int().min(1).optional()
  }).optional()
}).optional();

/**
 * Schema para crear un producto
 */
export const createProductSchema = z.object({
  // Información básica
  name: z.string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name cannot exceed 200 characters'),

  slug: z.string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens')
    .optional(),

  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),

  shortDescription: z.string()
    .trim()
    .max(300, 'Short description cannot exceed 300 characters')
    .optional(),

  // Categorización
  category: z.enum(['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other']),

  subcategory: z.string().trim().max(100).optional(),

  tags: z.array(z.string().trim().max(50)).optional().default([]),

  // Variantes (al menos una)
  variants: z.array(productVariantSchema)
    .min(1, 'Product must have at least one variant'),

  // Imágenes generales
  images: z.array(productImageSchema).optional().default([]),

  // Brand
  brand: z.string().trim().max(100).optional(),

  // SEO
  seo: seoSchema.optional(),

  // Features y especificaciones
  features: z.array(z.string().trim().max(200)).optional().default([]),

  specifications: z.record(z.string().trim()).optional(),

  // Estado
  status: z.enum(['draft', 'published', 'archived', 'out_of_stock']).default('draft'),

  isFeatured: z.boolean().default(false),

  isNewArrival: z.boolean().default(false),

  // Shipping
  shipping: shippingSchema,

  // Auditoría
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional()
});

/**
 * Schema para actualizar un producto
 */
export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Schema para ID de producto
 */
export const productIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID')
});

/**
 * Schema para slug de producto
 */
export const productSlugSchema = z.object({
  slug: z.string().trim().min(1)
});

/**
 * Schema para query de productos
 */
export const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12'),
  sortBy: z.enum(['createdAt', 'name', 'metrics.sales', 'variants.pricing.basePrice']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['draft', 'published', 'archived', 'out_of_stock']).optional(),
  category: z.enum(['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other']).optional(),
  subcategory: z.string().trim().optional(),
  isFeatured: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  isNewArrival: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  inStock: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional()
});

/**
 * Schema para búsqueda
 */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12'),
  category: z.enum(['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other']).optional()
});

/**
 * Schema para filtro de precio
 */
export const priceRangeSchema = z.object({
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12')
}).refine(
  (data) => data.minPrice <= data.maxPrice,
  {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice']
  }
);

/**
 * Schema para publicar producto
 */
export const publishProductSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID')
});

/**
 * Schema para actualizar stock de variante
 */
export const updateStockSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID'),
  quantity: z.number().int().min(0, 'Quantity must be a positive integer')
});

/**
 * Schema para decrementar stock (compras)
 */
export const decrementStockSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1)
});

/**
 * Schema para actualizar rating
 */
export const updateRatingSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5')
});

/**
 * Schema para buscar variante por SKU
 */
export const skuSchema = z.object({
  sku: z.string()
    .trim()
    .toUpperCase()
    .min(1)
    .regex(/^[A-Z0-9-_]+$/, 'SKU must contain only uppercase letters, numbers, hyphens and underscores')
});

/**
 * Schema para ID de variante
 */
export const variantIdSchema = z.object({
  variantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID')
});

/**
 * Schema para límite de resultados
 */
export const limitSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12')
});

/**
 * Schema para categoría
 */
export const categorySchema = z.object({
  category: z.enum(['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other'])
});
