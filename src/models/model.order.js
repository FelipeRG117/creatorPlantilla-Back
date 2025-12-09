/**
 * Order Model (Enterprise)
 *
 * Modelo de pedidos con todas las características enterprise:
 * - Información completa del cliente
 * - Items con variantes de productos
 * - Cálculos de totales (subtotal, tax, shipping)
 * - Estado del pedido (pending, paid, shipped, delivered, cancelled)
 * - Integración con Stripe (sessionId, paymentIntentId)
 * - Timestamps automáticos
 * - Soft delete
 */

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  productSnapshot: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category: { type: String, required: true },
    images: [{
      url: String,
      altText: String,
    }],
  },
  variant: {
    variantId: String,
    sku: String,
    name: String,
    attributes: {
      size: String,
      color: String,
      material: String,
    },
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  address: { type: String, required: true, trim: true },
  apartment: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'Mexico', trim: true },
  phone: { type: String, required: true, trim: true },
}, { _id: false });

const billingAddressSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  address: { type: String, trim: true },
  apartment: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, default: 'Mexico', trim: true },
  sameAsShipping: { type: Boolean, default: true },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    // Order Number (auto-generated, human-readable)
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Customer Information
    customer: {
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Optional - puede ser null para guest checkout
      },
    },

    // Order Items
    items: {
      type: [orderItemSchema],
      required: [true, 'Order must have at least one item'],
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },

    // Pricing
    pricing: {
      subtotal: {
        type: Number,
        required: [true, 'Subtotal is required'],
        min: [0, 'Subtotal cannot be negative'],
      },
      tax: {
        type: Number,
        required: [true, 'Tax is required'],
        min: [0, 'Tax cannot be negative'],
      },
      taxRate: {
        type: Number,
        default: 0.16, // 16% IVA Mexico
      },
      shipping: {
        type: Number,
        required: [true, 'Shipping cost is required'],
        min: [0, 'Shipping cannot be negative'],
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
      },
      total: {
        type: Number,
        required: [true, 'Total is required'],
        min: [0, 'Total cannot be negative'],
      },
      currency: {
        type: String,
        default: 'MXN',
        uppercase: true,
      },
    },

    // Shipping Information
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },

    billingAddress: billingAddressSchema,

    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'pickup'],
      default: 'standard',
    },

    // Payment Information
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'paypal', 'mercado_pago', 'cash_on_delivery'],
        default: 'stripe',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
      },
      paidAt: Date,

      // Stripe Integration
      stripeSessionId: String,
      stripePaymentIntentId: String,
      stripeChargeId: String,

      // Payment metadata
      metadata: {
        type: Map,
        of: String,
      },
    },

    // Order Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    // Tracking
    tracking: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      shippedAt: Date,
      deliveredAt: Date,
    },

    // Notes
    notes: {
      customer: String, // Customer notes (visible to customer)
      internal: String, // Internal admin notes (not visible to customer)
    },

    // Cancellation
    cancellation: {
      cancelledAt: Date,
      reason: String,
      cancelledBy: {
        type: String,
        enum: ['customer', 'admin', 'system'],
      },
    },

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================================
// INDEXES (Para mejorar performance)
// ==========================================
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.userId': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.stripeSessionId': 1 });
orderSchema.index({ createdAt: -1 }); // Para ordenar por fecha
orderSchema.index({ isDeleted: 1 }); // Para soft delete queries

// Compound index para queries comunes
orderSchema.index({ 'customer.email': 1, status: 1 });
orderSchema.index({ 'customer.userId': 1, status: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Total de items en el pedido
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// URL para ver el pedido
orderSchema.virtual('url').get(function() {
  return `/orders/${this.orderNumber}`;
});

// ==========================================
// METHODS
// ==========================================

/**
 * Marcar pedido como pagado
 */
orderSchema.methods.markAsPaid = function(paymentDetails = {}) {
  this.payment.status = 'paid';
  this.payment.paidAt = new Date();
  this.status = 'processing'; // Cambiar de pending a processing

  if (paymentDetails.paymentIntentId) {
    this.payment.stripePaymentIntentId = paymentDetails.paymentIntentId;
  }
  if (paymentDetails.chargeId) {
    this.payment.stripeChargeId = paymentDetails.chargeId;
  }

  return this.save();
};

/**
 * Marcar pedido como enviado
 */
orderSchema.methods.markAsShipped = function(trackingInfo = {}) {
  this.status = 'shipped';
  this.tracking.shippedAt = new Date();

  if (trackingInfo.carrier) this.tracking.carrier = trackingInfo.carrier;
  if (trackingInfo.trackingNumber) this.tracking.trackingNumber = trackingInfo.trackingNumber;
  if (trackingInfo.trackingUrl) this.tracking.trackingUrl = trackingInfo.trackingUrl;

  return this.save();
};

/**
 * Marcar pedido como entregado
 */
orderSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.tracking.deliveredAt = new Date();
  return this.save();
};

/**
 * Cancelar pedido
 */
orderSchema.methods.cancel = function(reason, cancelledBy = 'customer') {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    reason,
    cancelledBy,
  };
  return this.save();
};

/**
 * Soft delete
 */
orderSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Generar número de orden único
 * Formato: ORD-YYYYMMDD-XXXX (ej: ORD-20250108-0001)
 */
orderSchema.statics.generateOrderNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Buscar el último pedido del día
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${dateStr}`),
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
};

/**
 * Buscar pedidos activos (no eliminados)
 */
orderSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

/**
 * Buscar por email del cliente
 */
orderSchema.statics.findByEmail = function(email) {
  return this.find({
    'customer.email': email.toLowerCase(),
    isDeleted: false
  }).sort({ createdAt: -1 });
};

/**
 * Buscar por usuario
 */
orderSchema.statics.findByUser = function(userId) {
  return this.find({
    'customer.userId': userId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// ==========================================
// MIDDLEWARE (Hooks)
// ==========================================

/**
 * Pre-save: Generar orderNumber si no existe
 */
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await this.constructor.generateOrderNumber();
  }
  next();
});

/**
 * Pre-save: Validar que total = subtotal + tax + shipping - discount
 */
orderSchema.pre('save', function(next) {
  const calculatedTotal =
    this.pricing.subtotal +
    this.pricing.tax +
    this.pricing.shipping -
    this.pricing.discount;

  // Permitir pequeña diferencia por redondeo (0.01)
  if (Math.abs(calculatedTotal - this.pricing.total) > 0.01) {
    return next(new Error(
      `Total mismatch: calculated ${calculatedTotal.toFixed(2)} but got ${this.pricing.total.toFixed(2)}`
    ));
  }

  next();
});

// ==========================================
// MODEL EXPORT
// ==========================================
const Order = mongoose.model('Order', orderSchema);

export default Order;
