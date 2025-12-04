/**
 * Album Validators
 * Esquemas de validación con Zod para álbumes
 */

import { z } from 'zod';

/**
 * Schema para validar un track individual
 */
const trackSchema = z.object({
  trackNumber: z
    .number()
    .int()
    .min(1, 'Track number must be at least 1'),
  title: z
    .string()
    .trim()
    .min(1, 'Track title is required')
    .max(200, 'Track title cannot exceed 200 characters'),
  duration: z
    .string()
    .regex(
      /^(\d+:)?[0-5]?\d:[0-5]\d$/,
      'Duration must be in format MM:SS or HH:MM:SS'
    )
    .optional(),
  previewUrl: z
    .string()
    .url('Preview URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  lyrics: z.string().optional()
});

/**
 * Schema para validar un link de streaming/compra
 */
const linkSchema = z.object({
  platform: z.enum(
    [
      'Spotify',
      'Apple Music',
      'YouTube Music',
      'Amazon Music',
      'Deezer',
      'Tidal',
      'SoundCloud',
      'Bandcamp',
      'iTunes',
      'Google Play',
      'Other'
    ],
    { errorMap: () => ({ message: 'Invalid platform' }) }
  ),
  url: z.string().url('URL must be a valid URL'),
  type: z.enum(['streaming', 'purchase', 'both']).default('streaming')
});

/**
 * Schema para validar una imagen
 */
const imageSchema = z.object({
  url: z.string().url('Image URL must be a valid URL'),
  publicId: z.string().optional(),
  type: z
    .enum(['cover', 'back', 'booklet', 'promo', 'other'])
    .default('other'),
  caption: z
    .string()
    .max(200, 'Caption cannot exceed 200 characters')
    .optional(),
  order: z.number().int().default(0)
});

/**
 * Schema para crear un álbum
 */
export const createAlbumSchema = z.object({
  // Información básica
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),

  artist: z
    .string()
    .trim()
    .max(200, 'Artist name cannot exceed 200 characters')
    .default('Mariachi Gago'),

  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),

  // Fechas
  releaseDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),

  recordLabel: z
    .string()
    .max(200, 'Record label cannot exceed 200 characters')
    .optional(),

  // Clasificación
  genre: z
    .array(z.string())
    .min(1, 'At least one genre is required')
    .default(['Mariachi', 'Regional Mexican']),

  type: z
    .enum(['LP', 'EP', 'Single', 'Live', 'Compilation', 'Remaster'])
    .default('LP'),

  // Imágenes
  coverImage: z.string().url('Cover image must be a valid URL'),

  coverImagePublicId: z.string().optional(),

  images: z
    .array(imageSchema)
    .max(20, 'Cannot have more than 20 images')
    .default([]),

  // Tracklist
  tracks: z
    .array(trackSchema)
    .min(1, 'At least one track is required'),

  // Links
  streamingLinks: z.array(linkSchema).default([]),

  purchaseLinks: z.array(linkSchema).default([]),

  // Características
  featured: z.boolean().default(false),

  isNewRelease: z.boolean().default(false),

  physicalAvailable: z.boolean().default(false),

  // SEO
  slug: z
    .string()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers and hyphens'
    )
    .optional(),

  tags: z.array(z.string()).default([]),

  // Estado
  status: z.enum(['draft', 'published', 'archived']).default('draft')
});

/**
 * Schema para actualizar un álbum
 * Todos los campos son opcionales
 */
export const updateAlbumSchema = createAlbumSchema.partial();

/**
 * Schema para parámetros de query en listado de álbumes
 */
export const albumQuerySchema = z.object({
  // Paginación
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100).default(10)),

  // Ordenamiento
  sortBy: z
    .enum([
      'releaseDate',
      'title',
      'artist',
      'createdAt',
      'updatedAt',
      'releaseYear'
    ])
    .default('releaseDate'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Filtros
  status: z.enum(['draft', 'published', 'archived']).optional(),

  featured: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  isNewRelease: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  releaseYear: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1900).max(2100).optional()),

  genre: z.string().optional(),

  type: z
    .enum(['LP', 'EP', 'Single', 'Live', 'Compilation', 'Remaster'])
    .optional(),

  // Búsqueda
  search: z.string().optional(),

  // Populate
  populate: z
    .string()
    .optional()
    .transform((val) => val === 'true')
});

/**
 * Schema para validar ID de álbum en params
 */
export const albumIdSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid album ID format')
});

/**
 * Schema para validar slug en params
 */
export const albumSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers and hyphens'
    )
});

/**
 * Schema para búsqueda de álbumes
 */
export const albumSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100).default(10))
});

/**
 * Middleware para validar request body
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar query params
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar URL params
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL parameters',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      next(error);
    }
  };
};

export default {
  createAlbumSchema,
  updateAlbumSchema,
  albumQuerySchema,
  albumIdSchema,
  albumSlugSchema,
  albumSearchSchema,
  validateBody,
  validateQuery,
  validateParams
};
