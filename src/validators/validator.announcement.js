/**
 * Announcement Validators
 * Esquemas de validación con Zod para anuncios
 */

import { z } from 'zod';

/**
 * Schema de Imagen de Anuncio
 */
const announcementImageSchema = z.object({
  url: z.string().url().trim(),
  publicId: z.string().trim().min(1),
  altText: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(300).optional()
});

/**
 * Schema de Call to Action
 */
const ctaSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().trim().max(50).optional(),
  url: z.string().trim().max(500).optional(),
  type: z.enum(['internal', 'external', 'download']).default('internal')
});

/**
 * Schema de Notificación
 */
const notificationSchema = z.object({
  enabled: z.boolean().default(false),
  sent: z.boolean().default(false),
  sentAt: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  recipients: z.number().int().min(0).default(0)
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
 * Schema para crear un anuncio
 */
export const createAnnouncementSchema = z.object({
  // Información básica
  title: z.string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),

  slug: z.string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens')
    .optional(),

  subtitle: z.string()
    .trim()
    .max(300, 'Subtitle cannot exceed 300 characters')
    .optional(),

  content: z.string()
    .trim()
    .min(20, 'Content must be at least 20 characters'),

  excerpt: z.string()
    .trim()
    .max(500, 'Excerpt cannot exceed 500 characters')
    .optional(),

  // Categorización
  category: z.enum(['news', 'event', 'update', 'promotion', 'alert', 'general']).default('general'),

  tags: z.array(z.string().trim().max(50)).optional().default([]),

  // Prioridad
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),

  isPinned: z.boolean().default(false),

  isFeatured: z.boolean().default(false),

  // Imágenes
  coverImage: announcementImageSchema.optional(),

  images: z.array(announcementImageSchema).optional().default([]),

  // Fechas
  publishedAt: z.string().or(z.date()).transform(val => new Date(val)).optional(),

  expiresAt: z.string().or(z.date()).transform(val => new Date(val)).optional(),

  // Estado
  status: z.enum(['draft', 'scheduled', 'published', 'archived', 'expired']).default('draft'),

  // SEO
  seo: seoSchema.optional(),

  // CTA
  cta: ctaSchema.optional(),

  // Notificación
  notification: notificationSchema.optional(),

  // Autor
  author: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid author ID'),

  // Auditoría
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional()
}).refine(
  (data) => {
    // Si tiene expiresAt, debe tener publishedAt
    if (data.expiresAt && !data.publishedAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Expiration date requires a publication date',
    path: ['expiresAt']
  }
).refine(
  (data) => {
    // publishedAt debe ser menor que expiresAt
    if (data.publishedAt && data.expiresAt) {
      return new Date(data.publishedAt) < new Date(data.expiresAt);
    }
    return true;
  },
  {
    message: 'Expiration date must be after publication date',
    path: ['expiresAt']
  }
);

/**
 * Schema para actualizar un anuncio
 */
export const updateAnnouncementSchema = createAnnouncementSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Schema para ID de anuncio
 */
export const announcementIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid announcement ID')
});

/**
 * Schema para slug de anuncio
 */
export const announcementSlugSchema = z.object({
  slug: z.string().trim().min(1)
});

/**
 * Schema para query de anuncios
 */
export const announcementQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title', 'priority', 'metrics.views']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived', 'expired']).optional(),
  category: z.enum(['news', 'event', 'update', 'promotion', 'alert', 'general']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  isPinned: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  isFeatured: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  search: z.string().trim().optional()
});

/**
 * Schema para búsqueda
 */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  category: z.enum(['news', 'event', 'update', 'promotion', 'alert', 'general']).optional()
});

/**
 * Schema para publicar anuncio
 */
export const publishAnnouncementSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid announcement ID')
});

/**
 * Schema para programar publicación
 */
export const scheduleAnnouncementSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid announcement ID'),
  publishDate: z.string().or(z.date()).transform(val => new Date(val))
}).refine(
  (data) => {
    const now = new Date();
    const publishDate = new Date(data.publishDate);
    return publishDate > now;
  },
  {
    message: 'Schedule date must be in the future',
    path: ['publishDate']
  }
);

/**
 * Schema para límite de resultados
 */
export const limitSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20')
});

/**
 * Schema para categoría
 */
export const categorySchema = z.object({
  category: z.enum(['news', 'event', 'update', 'promotion', 'alert', 'general'])
});

/**
 * Schema para incrementar métricas
 */
export const incrementMetricSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid announcement ID'),
  metric: z.enum(['views', 'shares', 'clicks'])
});
