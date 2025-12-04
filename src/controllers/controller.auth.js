/**
 * Controlador de Autenticación
 *
 * Maneja:
 * - Registro de usuarios
 * - Login
 * - Logout
 * - Obtener perfil del usuario autenticado
 * - Actualizar perfil
 * - Cambio de contraseña
 */

import { userModel } from '../models/model.users.js'
import { hashPassword, comparePassword } from '../utils/password.utils.js'
import { generateToken } from '../utils/jwt.utils.js'
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError
} from '../errors/AppError.js'

export class AuthController {
  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.validatedData

      // 1. Verificar si el usuario ya existe
      const existingUser = await userModel.findOne({ email })

      if (existingUser) {
        throw new ConflictError('El email ya está registrado', 'Usuario')
      }

      // 2. Hashear password
      const hashedPassword = await hashPassword(password)

      // 3. Crear usuario
      const user = await userModel.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        ...(phone && { phone }),
        role: 'user', // Por defecto todos son 'user'
        lastLogin: new Date()
      })

      // 4. Generar token JWT
      const token = generateToken({
        id: user._id,
        role: user.role
      })

      // 5. Responder con usuario (sin password) y token
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt
          },
          token
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Login de usuario
   * POST /api/auth/login
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.validatedData

      // 1. Buscar usuario por email (incluyendo password para comparar)
      const user = await userModel.findOne({ email }).select('+password')

      if (!user) {
        throw new AuthenticationError('Credenciales inválidas')
      }

      // 2. Verificar password
      const isValidPassword = await comparePassword(password, user.password)

      if (!isValidPassword) {
        throw new AuthenticationError('Credenciales inválidas')
      }

      // 3. Actualizar lastLogin
      user.lastLogin = new Date()
      await user.save()

      // 4. Generar token JWT
      const tokenOptions = rememberMe ? { expiresIn: '30d' } : undefined
      const token = generateToken(
        {
          id: user._id,
          role: user.role
        },
        tokenOptions
      )

      // 5. Responder con usuario (sin password) y token
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLogin: user.lastLogin
          },
          token
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/me
   *
   * @param {Request} req - req.user viene del middleware authenticate
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async getMe(req, res, next) {
    try {
      // req.user ya viene del middleware authenticate
      // No incluye password porque el middleware usa .select('-password')

      res.json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            lastLogin: req.user.lastLogin,
            createdAt: req.user.createdAt
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Actualizar perfil del usuario autenticado
   * PUT /api/auth/profile
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, bio, avatar } = req.validatedData

      // Construir objeto de actualización solo con campos proporcionados
      const updateData = {}
      if (firstName !== undefined) updateData.firstName = firstName
      if (lastName !== undefined) updateData.lastName = lastName
      if (phone !== undefined) updateData.phone = phone
      if (bio !== undefined) updateData.bio = bio
      if (avatar !== undefined) updateData.avatar = avatar

      // Actualizar usuario
      const user = await userModel.findByIdAndUpdate(
        req.user._id,
        updateData,
        {
          new: true, // Devolver documento actualizado
          runValidators: true // Ejecutar validadores de Mongoose
        }
      ).select('-password')

      if (!user) {
        throw new NotFoundError('Usuario')
      }

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            bio: user.bio,
            avatar: user.avatar,
            role: user.role
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cambiar contraseña del usuario autenticado
   * PUT /api/auth/change-password
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.validatedData

      // 1. Buscar usuario con password
      const user = await userModel.findById(req.user._id).select('+password')

      if (!user) {
        throw new NotFoundError('Usuario')
      }

      // 2. Verificar contraseña actual
      const isValidPassword = await comparePassword(currentPassword, user.password)

      if (!isValidPassword) {
        throw new AuthenticationError('La contraseña actual es incorrecta')
      }

      // 3. Hashear nueva contraseña
      const hashedPassword = await hashPassword(newPassword)

      // 4. Actualizar password
      user.password = hashedPassword
      await user.save()

      // 5. Generar nuevo token (opcional: invalidar tokens anteriores)
      const token = generateToken({
        id: user._id,
        role: user.role
      })

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: {
          token // Devolver nuevo token
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Logout (cliente debe eliminar el token)
   * POST /api/auth/logout
   *
   * Nota: En JWT stateless, el logout es manejado por el cliente
   * Este endpoint es opcional, útil para logging o invalidación de tokens
   *
   * @param {Request} req - Request de Express
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async logout(req, res, next) {
    try {
      // En una implementación más avanzada, podrías:
      // 1. Guardar el token en una blacklist
      // 2. Usar refresh tokens y revocarlos
      // 3. Guardar sesiones en Redis

      // Por ahora, simplemente confirmamos el logout
      res.json({
        success: true,
        message: 'Logout exitoso'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Solicitar reset de contraseña (enviar email con token)
   * POST /api/auth/forgot-password
   *
   * Nota: Requiere implementar servicio de email
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.validatedData

      // 1. Buscar usuario
      const user = await userModel.findOne({ email })

      // Por seguridad, siempre responder lo mismo (no revelar si el email existe)
      const response = {
        success: true,
        message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      }

      if (!user) {
        return res.json(response)
      }

      // 2. Generar token de reset (válido por 1 hora)
      const resetToken = generateToken(
        { id: user._id, purpose: 'password-reset' },
        { expiresIn: '1h' }
      )

      // 3. TODO: Enviar email con el token
      // await sendPasswordResetEmail(user.email, resetToken)
      console.log('🔑 Reset token para', user.email, ':', resetToken)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Resetear contraseña con token
   * POST /api/auth/reset-password
   *
   * @param {Request} req - req.validatedData viene del middleware validateRequest
   * @param {Response} res - Response de Express
   * @param {NextFunction} next - Next function
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.validatedData

      // 1. Verificar token
      const decoded = verifyToken(token)

      // 2. Verificar que es un token de reset
      if (decoded.purpose !== 'password-reset') {
        throw new AuthenticationError('Token inválido')
      }

      // 3. Buscar usuario
      const user = await userModel.findById(decoded.id)

      if (!user) {
        throw new NotFoundError('Usuario')
      }

      // 4. Hashear nueva contraseña
      const hashedPassword = await hashPassword(newPassword)

      // 5. Actualizar password
      user.password = hashedPassword
      await user.save()

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
