/**
 * Concert Model - Simplified
 * Schema simplificado que coincide con el frontend interface
 */

import mongoose from 'mongoose';

const ConcertSchema = new mongoose.Schema(
  {
    // Fecha del concierto (ISO Date)
    date: {
      type: Date,
      required: [true, 'Concert date is required'],
      index: true
    },

    // Hora del evento (formato HH:MM)
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in format HH:MM (24h)']
    },

    // Nombre del venue
    venue: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    },

    // Dirección del venue
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },

    // Ciudad
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },

    // Estado/Provincia (opcional)
    state: {
      type: String,
      trim: true
    },

    // País
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'México',
      index: true
    },

    // Tickets disponibles
    hasTickets: {
      type: Boolean,
      default: false
    },

    // RSVP disponible
    hasRSVP: {
      type: Boolean,
      default: false
    },

    // Sold out
    soldOut: {
      type: Boolean,
      default: false,
      index: true
    },

    // URL de venta de tickets
    ticketUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Ticket URL must be a valid HTTP/HTTPS URL'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices compuestos
ConcertSchema.index({ date: 1, city: 1 });
ConcertSchema.index({ date: 1, soldOut: 1 });
ConcertSchema.index({ country: 1, date: 1 });

// Virtual: día de la semana (calculado)
ConcertSchema.virtual('dayOfWeek').get(function () {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
  return days[this.date.getDay()];
});

// Virtual: flag del país (calculado)
ConcertSchema.virtual('countryFlag').get(function () {
  const flags = {
    'México': '🇲🇽',
    'Mexico': '🇲🇽',
    'Estados Unidos': '🇺🇸',
    'United States': '🇺🇸',
    'USA': '🇺🇸',
    'España': '🇪🇸',
    'Spain': '🇪🇸',
    'Argentina': '🇦🇷',
    'Colombia': '🇨🇴',
    'Chile': '🇨🇱',
    'Perú': '🇵🇪',
    'Peru': '🇵🇪',
    'Brasil': '🇧🇷',
    'Brazil': '🇧🇷',
  };
  return flags[this.country] || '🌎';
});

// Métodos estáticos

/**
 * Buscar conciertos futuros
 */
ConcertSchema.statics.findUpcoming = function (limit = 10) {
  const now = new Date();
  return this.find({
    date: { $gte: now },
    soldOut: false
  })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Buscar conciertos pasados
 */
ConcertSchema.statics.findPast = function (limit = 10) {
  const now = new Date();
  return this.find({
    date: { $lt: now }
  })
    .sort({ date: -1 })
    .limit(limit);
};

/**
 * Buscar por ciudad
 */
ConcertSchema.statics.findByCity = function (city) {
  return this.find({
    city: new RegExp(city, 'i'),
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

/**
 * Buscar por país
 */
ConcertSchema.statics.findByCountry = function (country) {
  return this.find({
    country: new RegExp(country, 'i'),
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

export const concertModel = mongoose.model('Concert', ConcertSchema);
export default concertModel;
