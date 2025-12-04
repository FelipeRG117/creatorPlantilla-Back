/**
 * Announcement Model
 * Modelo de anuncios y noticias
 */

import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Schema de Imagen de Anuncio
 */
const AnnouncementImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  publicId: {
    type: String,
    required: true,
    trim: true
  },
  altText: {
    type: String,
    trim: true,
    maxlength: 200
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, { _id: true });

/**
 * Schema de Anuncio
 */
const AnnouncementSchema = new mongoose.Schema({
  // Información básica
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [300, 'Subtitle cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [20, 'Content must be at least 20 characters']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },

  // Categorización
  category: {
    type: String,
    required: true,
    enum: ['news', 'event', 'update', 'promotion', 'alert', 'general'],
    default: 'general',
    index: true
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.every(tag => tag.length <= 50);
      },
      message: 'Each tag must be 50 characters or less'
    },
    index: true
  },

  // Prioridad e importancia
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Imágenes
  coverImage: {
    type: AnnouncementImageSchema,
    required: false
  },
  images: [AnnouncementImageSchema],

  // Fechas de publicación
  publishedAt: {
    type: Date,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },

  // Estado
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived', 'expired'],
    default: 'draft',
    index: true
  },

  // SEO
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    keywords: [String]
  },

  // Engagement y analytics
  metrics: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    shares: {
      type: Number,
      default: 0,
      min: 0
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Call to Action
  cta: {
    enabled: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      trim: true,
      maxlength: 50
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['internal', 'external', 'download'],
      default: 'internal'
    }
  },

  // Notificaciones
  notification: {
    enabled: {
      type: Boolean,
      default: false
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    recipients: {
      type: Number,
      default: 0
    }
  },

  // Autor
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// ÍNDICES COMPUESTOS
// ==========================================
AnnouncementSchema.index({ status: 1, publishedAt: -1 });
AnnouncementSchema.index({ status: 1, category: 1 });
AnnouncementSchema.index({ isPinned: 1, publishedAt: -1 });
AnnouncementSchema.index({ isFeatured: 1, publishedAt: -1 });
AnnouncementSchema.index({ status: 1, expiresAt: 1 });
AnnouncementSchema.index({ createdAt: -1 });

// ==========================================
// VIRTUALS
// ==========================================

// Está publicado
AnnouncementSchema.virtual('isPublished').get(function() {
  return this.status === 'published' &&
         (!this.publishedAt || this.publishedAt <= new Date()) &&
         (!this.expiresAt || this.expiresAt > new Date());
});

// Está expirado
AnnouncementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Está programado
AnnouncementSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.publishedAt && this.publishedAt > new Date();
});

// Tiempo restante hasta expiración (en días)
AnnouncementSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expiresAt) return null;

  const now = new Date();
  const diff = this.expiresAt - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
});

// Es reciente (menos de 7 días)
AnnouncementSchema.virtual('isRecent').get(function() {
  if (!this.publishedAt) return false;

  const now = new Date();
  const diff = now - this.publishedAt;
  const days = diff / (1000 * 60 * 60 * 24);

  return days <= 7;
});

// Tiene engagement alto (más de 100 vistas)
AnnouncementSchema.virtual('hasHighEngagement').get(function() {
  return this.metrics.views >= 100;
});

// Tiempo de lectura estimado (minutos)
AnnouncementSchema.virtual('readingTime').get(function() {
  if (!this.content) return 0;

  const wordsPerMinute = 200;
  const words = this.content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return Math.max(1, minutes);
});

// ==========================================
// MIDDLEWARES
// ==========================================

// Pre-save: Generar slug automáticamente
AnnouncementSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  next();
});

// Pre-save: Generar excerpt si no existe
AnnouncementSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Tomar los primeros 150 caracteres del contenido
    const plainText = this.content.replace(/<[^>]*>/g, ''); // Remover HTML
    this.excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }

  next();
});

// Pre-save: Actualizar status según fechas
AnnouncementSchema.pre('save', function(next) {
  const now = new Date();

  // Si está expirado, cambiar status
  if (this.expiresAt && this.expiresAt < now && this.status === 'published') {
    this.status = 'expired';
  }

  // Si está programado y la fecha llegó, publicar
  if (this.status === 'scheduled' && this.publishedAt && this.publishedAt <= now) {
    this.status = 'published';
  }

  next();
});

// Pre-save: Validar fechas
AnnouncementSchema.pre('save', function(next) {
  if (this.publishedAt && this.expiresAt && this.publishedAt >= this.expiresAt) {
    return next(new Error('Expiration date must be after publication date'));
  }

  next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Publicar anuncio
 */
AnnouncementSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishedAt = this.publishedAt || new Date();
  return this.save();
};

/**
 * Programar publicación
 */
AnnouncementSchema.methods.schedule = async function(publishDate) {
  if (publishDate <= new Date()) {
    throw new Error('Schedule date must be in the future');
  }

  this.status = 'scheduled';
  this.publishedAt = publishDate;
  return this.save();
};

/**
 * Archivar anuncio
 */
AnnouncementSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

/**
 * Incrementar vistas
 */
AnnouncementSchema.methods.incrementViews = async function() {
  this.metrics.views += 1;
  return this.save();
};

/**
 * Incrementar shares
 */
AnnouncementSchema.methods.incrementShares = async function() {
  this.metrics.shares += 1;
  return this.save();
};

/**
 * Incrementar clicks
 */
AnnouncementSchema.methods.incrementClicks = async function() {
  this.metrics.clicks += 1;
  return this.save();
};

/**
 * Fijar anuncio
 */
AnnouncementSchema.methods.pin = async function() {
  this.isPinned = true;
  return this.save();
};

/**
 * Desfijar anuncio
 */
AnnouncementSchema.methods.unpin = async function() {
  this.isPinned = false;
  return this.save();
};

/**
 * Marcar como featured
 */
AnnouncementSchema.methods.feature = async function() {
  this.isFeatured = true;
  return this.save();
};

/**
 * Quitar featured
 */
AnnouncementSchema.methods.unfeature = async function() {
  this.isFeatured = false;
  return this.save();
};

// ==========================================
// MÉTODOS ESTÁTICOS (QUERY HELPERS)
// ==========================================

/**
 * Buscar anuncios publicados
 */
AnnouncementSchema.statics.findPublished = function(options = {}) {
  const now = new Date();
  const query = {
    status: 'published',
    $or: [
      { publishedAt: { $lte: now } },
      { publishedAt: null }
    ],
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }
    ]
  };

  return this.find(query)
    .sort({ isPinned: -1, publishedAt: -1 })
    .limit(options.limit || 20);
};

/**
 * Buscar anuncios destacados
 */
AnnouncementSchema.statics.findFeatured = function(limit = 5) {
  const now = new Date();
  return this.find({
    status: 'published',
    isFeatured: true,
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }
    ]
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

/**
 * Buscar anuncios fijados
 */
AnnouncementSchema.statics.findPinned = function() {
  return this.find({
    status: 'published',
    isPinned: true
  })
  .sort({ publishedAt: -1 });
};

/**
 * Buscar anuncios por categoría
 */
AnnouncementSchema.statics.findByCategory = function(category, options = {}) {
  return this.findPublished({ ...options })
    .where('category', category);
};

/**
 * Buscar anuncios recientes
 */
AnnouncementSchema.statics.findRecent = function(limit = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return this.find({
    status: 'published',
    publishedAt: { $gte: sevenDaysAgo }
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

/**
 * Buscar anuncios urgentes
 */
AnnouncementSchema.statics.findUrgent = function() {
  return this.find({
    status: 'published',
    priority: 'urgent'
  })
  .sort({ publishedAt: -1 });
};

/**
 * Buscar anuncios próximos a expirar (menos de 3 días)
 */
AnnouncementSchema.statics.findExpiringSoon = function() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return this.find({
    status: 'published',
    expiresAt: {
      $gte: now,
      $lte: threeDaysFromNow
    }
  })
  .sort({ expiresAt: 1 });
};

/**
 * Buscar anuncios programados
 */
AnnouncementSchema.statics.findScheduled = function() {
  return this.find({
    status: 'scheduled'
  })
  .sort({ publishedAt: 1 });
};

/**
 * Actualizar anuncios expirados
 */
AnnouncementSchema.statics.updateExpired = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: 'published',
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );

  return result.modifiedCount;
};

/**
 * Publicar anuncios programados
 */
AnnouncementSchema.statics.publishScheduled = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: 'scheduled',
      publishedAt: { $lte: now }
    },
    {
      $set: { status: 'published' }
    }
  );

  return result.modifiedCount;
};

// Modelo
export const announcementModel = mongoose.model('Announcement', AnnouncementSchema);
export default announcementModel;
