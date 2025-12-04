/**
 * Concert Model
 * Schema de Mongoose para conciertos y presentaciones
 *
 * Incluye:
 * - Información del evento (fecha, hora, venue)
 * - Ubicación geográfica
 * - Precios y tickets
 * - Imágenes del evento
 * - Setlist/programa musical
 * - Estado y disponibilidad
 */

import mongoose from 'mongoose';

/**
 * Sub-schema para ubicación del venue
 */
const LocationSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'México',
      index: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    // Coordenadas geográficas para mapas
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    // Google Maps URL
    mapsUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Maps URL must be a valid HTTP/HTTPS URL'
      }
    }
  },
  { _id: false }
);

/**
 * Sub-schema para información de tickets
 */
const TicketSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Ticket type is required'],
      trim: true,
      enum: {
        values: ['General', 'VIP', 'Preferente', 'Palco', 'Mesa', 'Other'],
        message: '{VALUE} is not a valid ticket type'
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'MXN',
      enum: ['MXN', 'USD', 'EUR']
    },
    available: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  { _id: true }
);

/**
 * Sub-schema para canciones del setlist
 */
const SetlistItemSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: [true, 'Song order is required'],
      min: [1, 'Order must be at least 1']
    },
    songTitle: {
      type: String,
      required: [true, 'Song title is required'],
      trim: true,
      maxlength: [200, 'Song title cannot exceed 200 characters']
    },
    duration: {
      type: String,
      trim: true,
      match: [
        /^[0-5]?\d:[0-5]\d$/,
        'Duration must be in format MM:SS'
      ]
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  },
  { _id: true }
);

/**
 * Sub-schema para imágenes del concierto
 */
const ConcertImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    publicId: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['poster', 'venue', 'promotional', 'gallery', 'other'],
      default: 'other'
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [200, 'Caption cannot exceed 200 characters']
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

/**
 * Main Concert Schema
 */
const ConcertSchema = new mongoose.Schema(
  {
    // ===== INFORMACIÓN BÁSICA =====
    title: {
      type: String,
      required: [true, 'Concert title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },

    // ===== FECHA Y HORA =====
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true
    },

    eventTime: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Time must be in format HH:MM (24h)'
      ]
    },

    // Duración estimada del evento
    duration: {
      type: Number, // en minutos
      min: [0, 'Duration cannot be negative'],
      default: 120 // 2 horas por defecto
    },

    // ===== UBICACIÓN =====
    location: {
      type: LocationSchema,
      required: [true, 'Location information is required']
    },

    // ===== TICKETS Y PRECIOS =====
    tickets: {
      type: [TicketSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one ticket type is required'
      }
    },

    // URL de venta de tickets
    ticketSalesUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Ticket sales URL must be a valid HTTP/HTTPS URL'
      }
    },

    // ===== IMÁGENES =====
    posterImage: {
      type: String,
      required: [true, 'Poster image is required'],
      trim: true
    },

    posterImagePublicId: {
      type: String,
      trim: true
    },

    images: {
      type: [ConcertImageSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 30;
        },
        message: 'Cannot have more than 30 images'
      }
    },

    // ===== SETLIST/PROGRAMA =====
    setlist: {
      type: [SetlistItemSchema],
      default: []
    },

    // ===== CARACTERÍSTICAS =====
    featured: {
      type: Boolean,
      default: false,
      index: true
    },

    // Tipo de evento
    eventType: {
      type: String,
      enum: {
        values: [
          'Concert',
          'Festival',
          'Private Event',
          'Wedding',
          'Corporate',
          'Tour',
          'Other'
        ],
        message: '{VALUE} is not a valid event type'
      },
      default: 'Concert'
    },

    // Capacidad del venue
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative']
    },

    // ===== ESTADO Y DISPONIBILIDAD =====
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'sold_out', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft',
      index: true
    },

    // Estado de disponibilidad
    availabilityStatus: {
      type: String,
      enum: {
        values: ['available', 'few_seats', 'sold_out', 'cancelled'],
        message: '{VALUE} is not a valid availability status'
      },
      default: 'available',
      index: true
    },

    // ===== SEO & METADATA =====
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    tags: {
      type: [String],
      default: []
    },

    // ===== INFORMACIÓN ADICIONAL =====
    organizerName: {
      type: String,
      trim: true,
      maxlength: [200, 'Organizer name cannot exceed 200 characters']
    },

    organizerContact: {
      type: String,
      trim: true
    },

    specialNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Special notes cannot exceed 1000 characters']
    },

    // ===== TIMESTAMPS =====
    publishedAt: {
      type: Date
    },

    cancelledAt: {
      type: Date
    },

    // ===== AUDITORÍA =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== ÍNDICES COMPUESTOS =====
ConcertSchema.index({ status: 1, eventDate: 1 });
ConcertSchema.index({ status: 1, featured: 1 });
ConcertSchema.index({ 'location.city': 1, eventDate: 1 });
ConcertSchema.index({ 'location.country': 1, eventDate: 1 });
ConcertSchema.index({ eventDate: 1, availabilityStatus: 1 });

// ===== VIRTUALS =====

// URL amigable del concierto
ConcertSchema.virtual('url').get(function () {
  return `/concerts/${this.slug || this._id}`;
});

// Verificar si el concierto ya pasó
ConcertSchema.virtual('isPast').get(function () {
  return new Date() > this.eventDate;
});

// Verificar si el concierto es próximo (en los próximos 7 días)
ConcertSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return this.eventDate > now && this.eventDate <= sevenDaysFromNow;
});

// Fecha y hora formateada
ConcertSchema.virtual('fullDateTime').get(function () {
  const date = this.eventDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `${date} - ${this.eventTime}`;
});

// Precio mínimo
ConcertSchema.virtual('minPrice').get(function () {
  if (!this.tickets || this.tickets.length === 0) return null;
  return Math.min(...this.tickets.map((t) => t.price));
});

// Precio máximo
ConcertSchema.virtual('maxPrice').get(function () {
  if (!this.tickets || this.tickets.length === 0) return null;
  return Math.max(...this.tickets.map((t) => t.price));
});

// ===== MIDDLEWARES =====

// Auto-generar slug antes de guardar
ConcertSchema.pre('save', function (next) {
  if (!this.slug && this.title && this.eventDate) {
    const dateStr = this.eventDate.toISOString().split('T')[0];
    const citySlug = this.location?.city
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') || 'concert';

    this.slug = `${this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${citySlug}-${dateStr}`;
  }

  // Establecer publishedAt cuando se publica por primera vez
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Establecer cancelledAt cuando se cancela
  if (this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  // Auto-actualizar availabilityStatus basado en status
  if (this.status === 'cancelled') {
    this.availabilityStatus = 'cancelled';
  } else if (this.status === 'sold_out') {
    this.availabilityStatus = 'sold_out';
  }

  next();
});

// ===== MÉTODOS ESTÁTICOS =====

/**
 * Buscar conciertos publicados
 */
ConcertSchema.statics.findPublished = function () {
  return this.find({ status: 'published' }).sort({ eventDate: 1 });
};

/**
 * Buscar conciertos futuros (upcoming)
 */
ConcertSchema.statics.findUpcoming = function (limit = 10) {
  const now = new Date();
  return this.find({
    status: 'published',
    eventDate: { $gte: now }
  })
    .sort({ eventDate: 1 })
    .limit(limit);
};

/**
 * Buscar conciertos pasados
 */
ConcertSchema.statics.findPast = function (limit = 10) {
  const now = new Date();
  return this.find({
    status: { $in: ['published', 'completed'] },
    eventDate: { $lt: now }
  })
    .sort({ eventDate: -1 })
    .limit(limit);
};

/**
 * Buscar conciertos por ciudad
 */
ConcertSchema.statics.findByCity = function (city) {
  return this.find({
    status: 'published',
    'location.city': new RegExp(city, 'i')
  }).sort({ eventDate: 1 });
};

/**
 * Buscar conciertos por país
 */
ConcertSchema.statics.findByCountry = function (country) {
  return this.find({
    status: 'published',
    'location.country': new RegExp(country, 'i')
  }).sort({ eventDate: 1 });
};

/**
 * Buscar conciertos destacados
 */
ConcertSchema.statics.findFeatured = function () {
  const now = new Date();
  return this.find({
    status: 'published',
    featured: true,
    eventDate: { $gte: now }
  }).sort({ eventDate: 1 });
};

// ===== MÉTODOS DE INSTANCIA =====

/**
 * Publicar concierto
 */
ConcertSchema.methods.publish = function () {
  this.status = 'published';
  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }
  return this.save();
};

/**
 * Marcar como sold out
 */
ConcertSchema.methods.markAsSoldOut = function () {
  this.status = 'sold_out';
  this.availabilityStatus = 'sold_out';
  return this.save();
};

/**
 * Cancelar concierto
 */
ConcertSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.availabilityStatus = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) {
    this.specialNotes = `CANCELADO: ${reason}\n\n${this.specialNotes || ''}`;
  }
  return this.save();
};

/**
 * Marcar como completado
 */
ConcertSchema.methods.complete = function () {
  this.status = 'completed';
  return this.save();
};

export const concertModel = mongoose.model('Concert', ConcertSchema);
export default concertModel;
