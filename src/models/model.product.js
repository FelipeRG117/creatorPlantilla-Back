/**
 * Product Model
 * Modelo de productos con soporte para variantes e inventario
 */

import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * Schema de Imagen de Producto
 */
const ProductImageSchema = new mongoose.Schema({
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
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

/**
 * Schema de Variante de Producto
 * Cada variante puede tener su propio SKU, precio, stock e imágenes
 */
const ProductVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  attributes: {
    size: {
      type: String,
      trim: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unitalla', 'N/A'],
      default: 'N/A'
    },
    color: {
      type: String,
      trim: true,
      maxlength: 50
    },
    material: {
      type: String,
      trim: true,
      maxlength: 100
    },
    custom: {
      type: Map,
      of: String
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function(value) {
          return !value || value < this.pricing.basePrice;
        },
        message: 'Sale price must be less than base price'
      }
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'MXN', 'EUR'],
      default: 'MXN'
    },
    costPrice: {
      type: Number,
      min: 0
    }
  },
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  images: [ProductImageSchema],
  weight: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'm', 'in', 'ft'],
      default: 'cm'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true, timestamps: true });

// Virtual: Precio efectivo (sale price si existe, sino base price)
ProductVariantSchema.virtual('effectivePrice').get(function() {
  return this.pricing.salePrice || this.pricing.basePrice;
});

// Virtual: Tiene descuento
ProductVariantSchema.virtual('hasDiscount').get(function() {
  return !!(this.pricing.salePrice && this.pricing.salePrice < this.pricing.basePrice);
});

// Virtual: Porcentaje de descuento
ProductVariantSchema.virtual('discountPercentage').get(function() {
  if (!this.hasDiscount) return 0;
  return Math.round(((this.pricing.basePrice - this.pricing.salePrice) / this.pricing.basePrice) * 100);
});

// Virtual: Stock bajo
ProductVariantSchema.virtual('isLowStock').get(function() {
  return this.inventory.trackInventory && this.inventory.stock <= this.inventory.lowStockThreshold;
});

// Virtual: En stock
ProductVariantSchema.virtual('inStock').get(function() {
  if (!this.inventory.trackInventory) return true;
  return this.inventory.stock > 0 || this.inventory.allowBackorder;
});

/**
 * Schema Principal de Producto
 */
const ProductSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },

  // Categorización
  category: {
    type: String,
    required: true,
    enum: ['apparel', 'accessories', 'music', 'instruments', 'collectibles', 'other'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.every(tag => tag.length <= 50);
      },
      message: 'Each tag must be 50 characters or less'
    }
  },

  // Variantes
  variants: {
    type: [ProductVariantSchema],
    validate: {
      validator: function(variants) {
        return variants && variants.length > 0;
      },
      message: 'Product must have at least one variant'
    }
  },

  // Imágenes generales del producto
  images: [ProductImageSchema],

  // Brand/Manufacturer
  brand: {
    type: String,
    trim: true,
    maxlength: 100
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

  // Features y especificaciones
  features: [String],
  specifications: {
    type: Map,
    of: String
  },

  // Estado y visibilidad
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'out_of_stock'],
    default: 'draft',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },

  // Shipping
  shipping: {
    isFreeShipping: {
      type: Boolean,
      default: false
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'heavy', 'fragile'],
      default: 'standard'
    },
    estimatedDeliveryDays: {
      min: Number,
      max: Number
    }
  },

  // Analytics y métricas
  metrics: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    sales: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      count: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },

  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// ÍNDICES COMPUESTOS
// ==========================================
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1, isFeatured: 1 });
ProductSchema.index({ 'variants.pricing.basePrice': 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'metrics.sales': -1 });

// ==========================================
// VIRTUALS
// ==========================================

// Precio mínimo entre todas las variantes
ProductSchema.virtual('minPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;

  return Math.min(...this.variants.map(v => v.effectivePrice));
});

// Precio máximo entre todas las variantes
ProductSchema.virtual('maxPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;

  return Math.max(...this.variants.map(v => v.effectivePrice));
});

// Rango de precios
ProductSchema.virtual('priceRange').get(function() {
  const min = this.minPrice;
  const max = this.maxPrice;

  if (min === max) {
    return `$${min.toFixed(2)}`;
  }

  return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
});

// Stock total
ProductSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;

  return this.variants.reduce((total, variant) => {
    return total + (variant.inventory.trackInventory ? variant.inventory.stock : 0);
  }, 0);
});

// Tiene stock disponible
ProductSchema.virtual('hasStock').get(function() {
  if (!this.variants || this.variants.length === 0) return false;

  return this.variants.some(variant => variant.inStock);
});

// Es bestseller (más de 50 ventas)
ProductSchema.virtual('isBestseller').get(function() {
  return this.metrics.sales >= 50;
});

// Imagen principal
ProductSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) return null;

  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// ==========================================
// MIDDLEWARES
// ==========================================

// Pre-save: Generar slug automáticamente
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  next();
});

// Pre-save: Actualizar status según stock
ProductSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.hasStock) {
    this.status = 'out_of_stock';
  }

  next();
});

// Pre-save: Asegurar que solo una imagen sea primary
ProductSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    let hasPrimary = false;

    this.images.forEach((img, index) => {
      if (img.isPrimary && !hasPrimary) {
        hasPrimary = true;
      } else if (img.isPrimary && hasPrimary) {
        img.isPrimary = false;
      }
    });

    // Si no hay primary, asignar la primera
    if (!hasPrimary && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
  }

  next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Publicar producto
 */
ProductSchema.methods.publish = async function() {
  if (!this.hasStock) {
    throw new Error('Cannot publish product without stock');
  }

  this.status = 'published';
  return this.save();
};

/**
 * Archivar producto
 */
ProductSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

/**
 * Actualizar stock de una variante
 */
ProductSchema.methods.updateVariantStock = async function(variantId, quantity) {
  const variant = this.variants.id(variantId);

  if (!variant) {
    throw new Error('Variant not found');
  }

  if (!variant.inventory.trackInventory) {
    throw new Error('Inventory tracking is disabled for this variant');
  }

  variant.inventory.stock = quantity;
  return this.save();
};

/**
 * Decrementar stock (para ventas)
 */
ProductSchema.methods.decrementStock = async function(variantId, quantity = 1) {
  const variant = this.variants.id(variantId);

  if (!variant) {
    throw new Error('Variant not found');
  }

  if (!variant.inventory.trackInventory) {
    return this; // No hacer nada si no se trackea
  }

  if (variant.inventory.stock < quantity && !variant.inventory.allowBackorder) {
    throw new Error('Insufficient stock');
  }

  variant.inventory.stock = Math.max(0, variant.inventory.stock - quantity);
  this.metrics.sales += quantity;

  return this.save();
};

/**
 * Incrementar vistas
 */
ProductSchema.methods.incrementViews = async function() {
  this.metrics.views += 1;
  return this.save();
};

/**
 * Actualizar rating
 */
ProductSchema.methods.updateRating = async function(newRating) {
  const currentTotal = this.metrics.rating.average * this.metrics.rating.count;
  this.metrics.rating.count += 1;
  this.metrics.rating.average = (currentTotal + newRating) / this.metrics.rating.count;

  return this.save();
};

// ==========================================
// MÉTODOS ESTÁTICOS (QUERY HELPERS)
// ==========================================

/**
 * Buscar productos publicados
 */
ProductSchema.statics.findPublished = function() {
  return this.find({ status: 'published' });
};

/**
 * Buscar productos destacados
 */
ProductSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ status: 'published', isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Buscar productos nuevos
 */
ProductSchema.statics.findNewArrivals = function(limit = 12) {
  return this.find({ status: 'published', isNewArrival: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Buscar bestsellers
 */
ProductSchema.statics.findBestsellers = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort({ 'metrics.sales': -1 })
    .limit(limit);
};

/**
 * Buscar por categoría
 */
ProductSchema.statics.findByCategory = function(category, options = {}) {
  const query = { status: 'published', category };
  return this.find(query).sort(options.sort || { createdAt: -1 });
};

/**
 * Buscar productos con stock bajo
 */
ProductSchema.statics.findLowStock = function() {
  return this.find({
    status: 'published',
    'variants.inventory.trackInventory': true,
    $expr: {
      $lte: ['$variants.inventory.stock', '$variants.inventory.lowStockThreshold']
    }
  });
};

// Modelo
export const productModel = mongoose.model('Product', ProductSchema);
export default productModel;
