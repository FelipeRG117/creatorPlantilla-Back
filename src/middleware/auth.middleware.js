/**
 * Middleware de autenticación y autorización
 *
 * Proporciona middlewares para:
 * - Verificar tokens JWT
 * - Proteger rutas privadas
 * - Verificar roles de usuario
 * - Control de acceso basado en roles (RBAC)
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.utils.js'
import { AuthenticationError, AuthorizationError, NotFoundError } from '../errors/AppError.js'
import { userModel } from '../models/model.users.js'

/**
 * Middleware para autenticar requests con JWT
 * Verifica el token y adjunta el usuario al request
 *
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next function
 *
 * @example
 * // En tus rutas
 * router.get('/profile', authenticate, UserController.getProfile)
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      throw new AuthenticationError('No se proporcionó token de autenticación')
    }

    // 2. Verificar y decodificar token
    const decoded = verifyToken(token)

    // 3. Buscar usuario en la base de datos
    const user = await userModel.findById(decoded.id).select('-password')

    if (!user) {
      throw new NotFoundError('Usuario')
    }

    // 4. Verificar si el usuario está activo (si tienes ese campo)
    // if (user.isActive === false) {
    //   throw new AuthenticationError('Usuario desactivado')
    // }

    // 5. Adjuntar usuario al request para uso en controladores
    req.user = user
    req.token = token

    next()
  } catch (error) {
    // El errorHandler se encargará de formatear el error
    next(error)
  }
}

/**
 * Middleware para verificar roles específicos
 * DEBE usarse DESPUÉS del middleware authenticate
 *
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function} Middleware de Express
 *
 * @example
 * // Solo admins pueden acceder
 * router.delete('/albums/:id',
 *   authenticate,
 *   authorize('admin'),
 *   AlbumController.delete
 * )
 *
 * // Admins o moderadores pueden acceder
 * router.put('/albums/:id',
 *   authenticate,
 *   authorize('admin', 'moderator'),
 *   AlbumController.update
 * )
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario existe en el request (debe venir de authenticate)
      if (!req.user) {
        throw new AuthenticationError('Usuario no autenticado')
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware combinado: autenticar Y verificar rol de admin
 * Atajo para la combinación más común
 *
 * @example
 * // En lugar de:
 * router.post('/albums', authenticate, authorize('admin'), AlbumController.create)
 *
 * // Puedes usar:
 * router.post('/albums', authenticateAdmin, AlbumController.create)
 */
export const authenticateAdmin = [
  authenticate,
  authorize('admin')
]

/**
 * Middleware opcional de autenticación
 * Si hay token, verifica y adjunta usuario
 * Si no hay token, continúa sin usuario
 * Útil para rutas que cambian comportamiento según autenticación
 *
 * @example
 * // Endpoint que devuelve más datos si estás autenticado
 * router.get('/albums', optionalAuthenticate, AlbumController.getAll)
 *
 * // En el controlador:
 * if (req.user) {
 *   // Usuario autenticado, devolver datos completos
 * } else {
 *   // Usuario público, devolver datos limitados
 * }
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    // Si no hay token, continuar sin usuario
    if (!token) {
      return next()
    }

    // Si hay token, intentar verificar
    try {
      const decoded = verifyToken(token)
      const user = await userModel.findById(decoded.id).select('-password')

      if (user) {
        req.user = user
        req.token = token
      }
    } catch (error) {
      // Si el token es inválido, continuar sin usuario (no lanzar error)
      console.warn('Token inválido en optionalAuthenticate:', error.message)
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware para verificar que el usuario es dueño del recurso
 * Útil para endpoints donde un usuario solo puede editar sus propios datos
 *
 * @param {string} userIdParam - Nombre del parámetro que contiene el ID del usuario
 * @returns {Function} Middleware de Express
 *
 * @example
 * // Solo el usuario puede ver su propio perfil (o un admin)
 * router.get('/users/:userId/profile',
 *   authenticate,
 *   checkOwnership('userId'),
 *   UserController.getProfile
 * )
 */
export const checkOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuario no autenticado')
      }

      const resourceUserId = req.params[userIdParam]

      // Admins pueden acceder a cualquier recurso
      if (req.user.role === 'admin') {
        return next()
      }

      // Verificar que el usuario es dueño del recurso
      if (req.user._id.toString() !== resourceUserId) {
        throw new AuthorizationError('No tienes permiso para acceder a este recurso')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware para verificar permisos específicos
 * Más granular que authorize() basado en roles
 * Útil para implementar sistema de permisos complejo
 *
 * @param {...string} requiredPermissions - Permisos requeridos
 * @returns {Function} Middleware de Express
 *
 * @example
 * // Si implementas un campo permissions en el modelo User
 * router.post('/albums',
 *   authenticate,
 *   checkPermissions('albums.create'),
 *   AlbumController.create
 * )
 */
export const checkPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuario no autenticado')
      }

      // Verificar si el modelo User tiene un campo permissions
      if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
        // Si no hay sistema de permisos, solo admins pueden acceder
        if (req.user.role !== 'admin') {
          throw new AuthorizationError('No tienes los permisos necesarios')
        }
        return next()
      }

      // Verificar que el usuario tiene todos los permisos requeridos
      const hasAllPermissions = requiredPermissions.every(permission =>
        req.user.permissions.includes(permission)
      )

      if (!hasAllPermissions) {
        throw new AuthorizationError(
          `Se requieren los siguientes permisos: ${requiredPermissions.join(', ')}`
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware para verificar email verificado
 * Útil si implementas verificación de email
 *
 * @example
 * router.post('/concerts/purchase',
 *   authenticate,
 *   requireEmailVerified,
 *   ConcertController.purchaseTicket
 * )
 */
export const requireEmailVerified = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Usuario no autenticado')
    }

    // Verificar si el modelo User tiene campo emailVerified
    if (req.user.emailVerified === false) {
      throw new AuthorizationError(
        'Debes verificar tu email para realizar esta acción'
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}
