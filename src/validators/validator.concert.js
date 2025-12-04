/**
 * Concert Validators
 * Esquemas de validación con Zod para conciertos
 */

import { z } from 'zod';

/**
 * Schema para validar ubicación
 */
const locationSchema = z.object({
  venueName: z.string().trim().min(1, 'Venue name is required').max(200),
  address: z.string().trim().min(1, 'Address is required').max(300),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().optional(),
  country: z.string().trim().default('México'),
  zipCode: z.string().trim().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    })
    .optional(),
  mapsUrl: z.string().url().optional().or(z.literal(''))
});

/**
 * Schema para validar tickets
 */
const ticketSchema = z.object({
  type: z.enum(['General', 'VIP', 'Preferente', 'Palco', 'Mesa', 'Other']),
  price: z.number().min(0, 'Price cannot be negative'),
  currency: z.enum(['MXN', 'USD', 'EUR']).default('MXN'),
  available: z.boolean().default(true),
  quantity: z.number().min(0).optional(),
  description: z.string().max(500).optional()
});

/**
 * Schema para validar setlist
 */
const setlistItemSchema = z.object({
  order: z.number().int().min(1),
  songTitle: z.string().trim().min(1).max(200),
  duration: z.string().regex(/^[0-5]?\d:[0-5]\d$/).optional(),
  notes: z.string().max(200).optional()
});

/**
 * Schema para validar imágenes
 */
const concertImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  type: z
    .enum(['poster', 'venue', 'promotional', 'gallery', 'other'])
    .default('other'),
  caption: z.string().max(200).optional(),
  order: z.number().int().default(0)
});

/**
 * Schema para crear un concierto
 */
export const createConcertSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(3000).optional(),

  // Fecha y hora
  eventDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(0).default(120),

  // Ubicación
  location: locationSchema,

  // Tickets
  tickets: z.array(ticketSchema).min(1, 'At least one ticket type is required'),
  ticketSalesUrl: z.string().url().optional().or(z.literal('')),

  // Imágenes
  posterImage: z.string().url(),
  posterImagePublicId: z.string().optional(),
  images: z.array(concertImageSchema).max(30).default([]),

  // Setlist
  setlist: z.array(setlistItemSchema).default([]),

  // Características
  featured: z.boolean().default(false),
  eventType: z
    .enum([
      'Concert',
      'Festival',
      'Private Event',
      'Wedding',
      'Corporate',
      'Tour',
      'Other'
    ])
    .default('Concert'),
  capacity: z.number().min(0).optional(),

  // Estado
  status: z
    .enum(['draft', 'published', 'sold_out', 'cancelled', 'completed'])
    .default('draft'),
  availabilityStatus: z
    .enum(['available', 'few_seats', 'sold_out', 'cancelled'])
    .default('available'),

  // SEO
  slug: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  tags: z.array(z.string()).default([]),

  // Información adicional
  organizerName: z.string().max(200).optional(),
  organizerContact: z.string().optional(),
  specialNotes: z.string().max(1000).optional()
});

/**
 * Schema para actualizar un concierto
 */
export const updateConcertSchema = createConcertSchema.partial();

/**
 * Schema para query params
 */
export const concertQuerySchema = z.object({
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
  sortBy: z
    .enum(['eventDate', 'title', 'createdAt', 'updatedAt', 'status'])
    .default('eventDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Filtros
  status: z
    .enum(['draft', 'published', 'sold_out', 'cancelled', 'completed'])
    .optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  city: z.string().optional(),
  country: z.string().optional(),
  eventType: z
    .enum([
      'Concert',
      'Festival',
      'Private Event',
      'Wedding',
      'Corporate',
      'Tour',
      'Other'
    ])
    .optional(),
  availabilityStatus: z
    .enum(['available', 'few_seats', 'sold_out', 'cancelled'])
    .optional(),

  // Búsqueda
  search: z.string().optional(),
  populate: z
    .string()
    .optional()
    .transform((val) => val === 'true')
});

/**
 * Schema para ID en params
 */
export const concertIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid concert ID format')
});

/**
 * Schema para slug en params
 */
export const concertSlugSchema = z.object({
  slug: z.string().min(1)
});

/**
 * Schema para cancelación
 */
export const cancelConcertSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500)
});

/**
 * Reutilizar middlewares de validación de albums
 */
export { validateBody, validateQuery, validateParams } from './validator.album.js';

export default {
  createConcertSchema,
  updateConcertSchema,
  concertQuerySchema,
  concertIdSchema,
  concertSlugSchema,
  cancelConcertSchema
};
