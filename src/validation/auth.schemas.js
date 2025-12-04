/**
 * Schemas de validación Zod para autenticación
 * Inspirado en querySchemas.ts con validaciones personalizadas
 *
 * Define schemas para:
 * - Registro de usuarios
 * - Login
 * - Cambio de contraseña
 * - Reset de contraseña
 */

import { z } from 'zod'

/**
 * Schema para registro de nuevos usuarios
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  email: z
    .string({
      required_error: 'El email es obligatorio',
      invalid_type_error: 'El email debe ser un texto'
    })
    .email('Email inválido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(100, 'El email es demasiado largo')
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: 'La contraseña es obligatoria',
      invalid_type_error: 'La contraseña debe ser un texto'
    })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .refine(
      (password) => {
        // Lista de contraseñas comunes a rechazar
        const commonPasswords = [
          'password',
          '12345678',
          'qwerty123',
          'password123',
          'abc12345'
        ]
        return !commonPasswords.includes(password.toLowerCase())
      },
      { message: 'Esta contraseña es demasiado común. Por favor elige una más segura.' }
    ),

  firstName: z
    .string({
      required_error: 'El nombre es obligatorio',
      invalid_type_error: 'El nombre debe ser un texto'
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es demasiado largo')
    .trim()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),

  lastName: z
    .string({
      required_error: 'El apellido es obligatorio',
      invalid_type_error: 'El apellido debe ser un texto'
    })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido es demasiado largo')
    .trim()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),

  // Campos opcionales
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Número de teléfono inválido')
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono es demasiado largo')
    .optional(),

  acceptTerms: z
    .boolean({
      required_error: 'Debes aceptar los términos y condiciones',
      invalid_type_error: 'acceptTerms debe ser un booleano'
    })
    .refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones para continuar'
    })
    .optional()
})

/**
 * Schema para login de usuarios
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'El email es obligatorio',
      invalid_type_error: 'El email debe ser un texto'
    })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: 'La contraseña es obligatoria',
      invalid_type_error: 'La contraseña debe ser un texto'
    })
    .min(1, 'La contraseña es requerida'),

  // Opcional: recordar sesión (para cookies de larga duración)
  rememberMe: z.boolean().optional()
})

/**
 * Schema para cambio de contraseña (usuario autenticado)
 * PUT /api/auth/change-password
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({
      required_error: 'La contraseña actual es obligatoria'
    })
    .min(1, 'La contraseña actual es requerida'),

  newPassword: z
    .string({
      required_error: 'La nueva contraseña es obligatoria'
    })
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña es demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),

  confirmPassword: z
    .string({
      required_error: 'Debes confirmar la nueva contraseña'
    })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword']
})

/**
 * Schema para solicitar reset de contraseña
 * POST /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: 'El email es obligatorio'
    })
    .email('Email inválido')
    .toLowerCase()
    .trim()
})

/**
 * Schema para resetear contraseña con token
 * POST /api/auth/reset-password
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: 'El token es obligatorio'
    })
    .min(1, 'El token es requerido'),

  newPassword: z
    .string({
      required_error: 'La nueva contraseña es obligatoria'
    })
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña es demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),

  confirmPassword: z
    .string({
      required_error: 'Debes confirmar la nueva contraseña'
    })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

/**
 * Schema para actualizar perfil de usuario
 * PUT /api/auth/profile
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es demasiado largo')
    .trim()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras')
    .optional(),

  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido es demasiado largo')
    .trim()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras')
    .optional(),

  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Número de teléfono inválido')
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono es demasiado largo')
    .optional(),

  // Otros campos opcionales
  bio: z
    .string()
    .max(500, 'La biografía es demasiado larga')
    .optional(),

  avatar: z
    .string()
    .url('URL de avatar inválida')
    .optional()
})

/**
 * Schema para verificar email con token
 * POST /api/auth/verify-email
 */
export const verifyEmailSchema = z.object({
  token: z
    .string({
      required_error: 'El token es obligatorio'
    })
    .min(1, 'El token es requerido')
})

/**
 * Schema común para IDs de MongoDB
 * Útil para validar params como :id
 */
export const mongoIdSchema = z.object({
  id: z
    .string({
      required_error: 'El ID es obligatorio'
    })
    .regex(/^[0-9a-fA-F]{24}$/, 'ID de MongoDB inválido')
})
