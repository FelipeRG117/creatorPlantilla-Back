/**
 * Album Model
 * Schema de Mongoose para álbumes musicales
 *
 * Incluye:
 * - Información básica del álbum
 * - Tracklist completo
 * - Múltiples imágenes (cover, galería)
 * - Links de streaming/compra
 * - Metadata (fecha de lanzamiento, género, etc.)
 * - Timestamps automáticos
 */

import mongoose from 'mongoose';

/**
 * Sub-schema para tracks individuales
 */
const TrackSchema = new mongoose.Schema(
  {
    trackNumber: {
      type: Number,
      required: [true, 'Track number is required'],
      min: [1, 'Track number must be at least 1']
    },
    title: {
      type: String,
      required: [true, 'Track title is required'],
      trim: true,
      maxlength: [200, 'Track title cannot exceed 200 characters']
    },
    duration: {
      type: String,
      trim: true,
      match: [
        /^(\d+:)?[0-5]?\d:[0-5]\d$/,
        'Duration must be in format MM:SS or HH:MM:SS'
      ]
    },
    previewUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Preview URL must be a valid HTTP/HTTPS URL'
      }
    },
    lyrics: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

/**
 * Sub-schema para links de streaming/compra
 */
const LinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true,
      enum: {
        values: [
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
        message: '{VALUE} is not a supported platform'
      }
    },
    url: {
      type: String,
      required: [true, 'Platform URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    type: {
      type: String,
      enum: ['streaming', 'purchase', 'both'],
      default: 'streaming'
    }
  },
  { _id: true }
);

/**
 * Sub-schema para imágenes del álbum
 */
const ImageSchema = new mongoose.Schema(
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
      enum: ['cover', 'back', 'booklet', 'promo', 'other'],
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
 * Main Album Schema
 */
const AlbumSchema = new mongoose.Schema(
  {
    // ===== INFORMACIÓN BÁSICA =====
    title: {
      type: String,
      required: [true, 'Album title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true
    },

    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
      default: 'Mariachi Gago',
      maxlength: [200, 'Artist name cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    // ===== FECHAS Y METADATA =====
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
      index: true
    },

    releaseYear: {
      type: Number,
      index: true
    },

    recordLabel: {
      type: String,
      trim: true,
      maxlength: [200, 'Record label cannot exceed 200 characters']
    },

    // ===== CLASIFICACIÓN =====
    genre: {
      type: [String],
      default: ['Mariachi', 'Regional Mexican'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one genre is required'
      }
    },

    type: {
      type: String,
      enum: {
        values: ['LP', 'EP', 'Single', 'Live', 'Compilation', 'Remaster'],
        message: '{VALUE} is not a valid album type'
      },
      default: 'LP'
    },

    // ===== IMÁGENES =====
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
      trim: true
    },

    coverImagePublicId: {
      type: String,
      trim: true
    },

    images: {
      type: [ImageSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 20;
        },
        message: 'Cannot have more than 20 images'
      }
    },

    // ===== TRACKLIST =====
    tracks: {
      type: [TrackSchema],
      required: [true, 'At least one track is required'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Album must have at least one track'
      }
    },

    totalTracks: {
      type: Number,
      min: [1, 'Total tracks must be at least 1']
    },

    // ===== LINKS DE STREAMING/COMPRA =====
    streamingLinks: {
      type: [LinkSchema],
      default: []
    },

    purchaseLinks: {
      type: [LinkSchema],
      default: []
    },

    // ===== CARACTERÍSTICAS =====
    featured: {
      type: Boolean,
      default: false,
      index: true
    },

    // Destacar como "Nuevo Lanzamiento"
    isNewRelease: {
      type: Boolean,
      default: false,
      index: true
    },

    // Disponibilidad para compra física
    physicalAvailable: {
      type: Boolean,
      default: false
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

    // ===== ESTADO =====
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft',
      index: true
    },

    publishedAt: {
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
AlbumSchema.index({ status: 1, releaseDate: -1 });
AlbumSchema.index({ status: 1, featured: 1 });
AlbumSchema.index({ status: 1, isNewRelease: 1 });
AlbumSchema.index({ artist: 1, releaseDate: -1 });

// ===== VIRTUALS =====

// URL amigable del álbum
AlbumSchema.virtual('url').get(function () {
  return `/albums/${this.slug || this._id}`;
});

// Duración total calculada (si todos los tracks tienen duración)
AlbumSchema.virtual('totalDuration').get(function () {
  if (!this.tracks || this.tracks.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  let hasAllDurations = true;

  for (const track of this.tracks) {
    if (!track.duration) {
      hasAllDurations = false;
      break;
    }

    const parts = track.duration.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS
      totalSeconds += parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  if (!hasAllDurations) {
    return null;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// ===== MIDDLEWARES =====

// Auto-calcular totalTracks y releaseYear antes de guardar
AlbumSchema.pre('save', function (next) {
  // Calcular totalTracks
  if (this.tracks && this.tracks.length > 0) {
    this.totalTracks = this.tracks.length;
  }

  // Calcular releaseYear desde releaseDate
  if (this.releaseDate && !this.releaseYear) {
    this.releaseYear = new Date(this.releaseDate).getFullYear();
  }

  // Auto-generar slug si no existe
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Establecer publishedAt cuando se publica por primera vez
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// ===== MÉTODOS ESTÁTICOS =====

/**
 * Buscar álbumes publicados
 */
AlbumSchema.statics.findPublished = function () {
  return this.find({ status: 'published' }).sort({ releaseDate: -1 });
};

/**
 * Buscar álbumes destacados
 */
AlbumSchema.statics.findFeatured = function () {
  return this.find({ status: 'published', featured: true }).sort({
    releaseDate: -1
  });
};

/**
 * Buscar nuevos lanzamientos
 */
AlbumSchema.statics.findNewReleases = function () {
  return this.find({ status: 'published', isNewRelease: true }).sort({
    releaseDate: -1
  });
};

/**
 * Buscar por año
 */
AlbumSchema.statics.findByYear = function (year) {
  return this.find({ status: 'published', releaseYear: year }).sort({
    releaseDate: -1
  });
};

// ===== MÉTODOS DE INSTANCIA =====

/**
 * Marcar como publicado
 */
AlbumSchema.methods.publish = function () {
  this.status = 'published';
  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }
  return this.save();
};

/**
 * Marcar como borrador
 */
AlbumSchema.methods.unpublish = function () {
  this.status = 'draft';
  return this.save();
};

/**
 * Archivar
 */
AlbumSchema.methods.archive = function () {
  this.status = 'archived';
  return this.save();
};

export const albumModel = mongoose.model('Album', AlbumSchema);
export default albumModel;
