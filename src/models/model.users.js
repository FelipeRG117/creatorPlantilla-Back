import mongoose from "mongoose";

/**
 * Schema de Usuario
 * Actualizado para autenticación JWT
 */
const usersSchema = new mongoose.Schema(
  {
    // Campos de autenticación
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false // No incluir password en queries por defecto
    },

    // Información personal
    firstName: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true
    },
    userName: {
      type: String,
      unique: true,
      sparse: true, // Permite null pero único si existe
      trim: true
    },

    // Contacto
    phone: {
      type: String,
      trim: true
    },

    // Configuraciones de usuario
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    preference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notification: {
      type: Boolean,
      default: true
    },

    // Información adicional
    location: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      maxlength: [500, 'La biografía no puede superar los 500 caracteres']
    },
    avatar: {
      type: String // URL de la imagen
    },

    // Metadata
    lastLogin: {
      type: Date,
      default: Date.now
    },
    followed: {
      type: String
    },

    // Verificación de email (futuro)
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },

    // Reset de contraseña (futuro)
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    toJSON: {
      transform: function(doc, ret) {
        // No devolver password ni tokens en JSON
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  }
);

// Índices para optimizar búsquedas
usersSchema.index({ email: 1 });
usersSchema.index({ userName: 1 });

// Export con alias para compatibilidad
export const userModel = mongoose.model("user", usersSchema);
export const modelUsers = userModel; // Mantener para compatibilidad con código existente
