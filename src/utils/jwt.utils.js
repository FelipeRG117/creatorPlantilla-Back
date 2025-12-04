/**
 * Utilidades para manejo de JSON Web Tokens (JWT)
 *
 * Funciones para:
 * - Generar tokens de autenticación
 * - Verificar y decodificar tokens
 * - Manejo de tokens expirados
 */

import jwt from 'jsonwebtoken'
import { AuthenticationError } from '../errors/AppError.js'

/**
 * Genera un JWT para un usuario
 *
 * @param {Object} payload - Datos del usuario a incluir en el token
 * @param {string} payload.id - ID del usuario
 * @param {string} payload.role - Rol del usuario (user/admin)
 * @param {Object} options - Opciones adicionales
 * @param {string} options.expiresIn - Tiempo de expiración (default: env.JWT_EXPIRE)
 * @returns {string} Token JWT firmado
 *
 * @example
 * const token = generateToken({ id: user._id, role: user.role })
 */
export const generateToken = (payload, options = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno')
  }

  if (!payload.id) {
    throw new Error('El payload debe incluir un ID de usuario')
  }

  const tokenPayload = {
    id: payload.id,
    role: payload.role || 'user',
    // Incluir timestamp para invalidación manual si es necesario
    iat: Math.floor(Date.now() / 1000)
  }

  const tokenOptions = {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRE || '7d',
    // Emisor del token (tu aplicación)
    issuer: 'mariachi-web-v3',
    // Audiencia (quién puede usar este token)
    audience: 'mariachi-web-client'
  }

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, tokenOptions)
}

/**
 * Verifica y decodifica un JWT
 *
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {AuthenticationError} Si el token es inválido o expirado
 *
 * @example
 * try {
 *   const decoded = verifyToken(token)
 *   console.log(decoded.id, decoded.role)
 * } catch (error) {
 *   // Token inválido o expirado
 * }
 */
export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno')
  }

  if (!token) {
    throw new AuthenticationError('No se proporcionó token de autenticación')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'mariachi-web-v3',
      audience: 'mariachi-web-client'
    })

    return decoded
  } catch (error) {
    // Manejar diferentes tipos de errores JWT
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('El token ha expirado. Por favor inicia sesión nuevamente.')
    }

    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Token inválido. Por favor inicia sesión nuevamente.')
    }

    if (error.name === 'NotBeforeError') {
      throw new AuthenticationError('El token aún no es válido.')
    }

    // Error genérico
    throw new AuthenticationError('Error al verificar el token de autenticación.')
  }
}

/**
 * Decodifica un JWT sin verificar su firma
 * USAR SOLO PARA DEBUGGING - NO CONFIAR EN LOS DATOS
 *
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 *
 * @example
 * const decoded = decodeToken(token)
 * if (decoded) {
 *   console.log('Token expira:', new Date(decoded.exp * 1000))
 * }
 */
export const decodeToken = (token) => {
  if (!token) {
    return null
  }

  try {
    // decode() no verifica la firma, solo decodifica
    return jwt.decode(token, { complete: false })
  } catch (error) {
    return null
  }
}

/**
 * Genera un token de refresh (mayor duración)
 * Útil para implementar refresh token pattern
 *
 * @param {Object} payload - Datos del usuario
 * @returns {string} Refresh token
 *
 * @example
 * const refreshToken = generateRefreshToken({ id: user._id })
 */
export const generateRefreshToken = (payload) => {
  return generateToken(payload, {
    expiresIn: '30d' // Refresh token dura más
  })
}

/**
 * Extrae el token del header Authorization
 *
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token extraído o null
 *
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization)
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.split(' ')[1]
}

/**
 * Verifica si un token está cerca de expirar
 * Útil para implementar renovación automática
 *
 * @param {string} token - Token JWT
 * @param {number} thresholdMinutes - Minutos antes de expiración (default: 30)
 * @returns {boolean} true si está cerca de expirar
 *
 * @example
 * if (isTokenExpiringSoon(token)) {
 *   // Renovar token
 * }
 */
export const isTokenExpiringSoon = (token, thresholdMinutes = 30) => {
  try {
    const decoded = decodeToken(token)

    if (!decoded || !decoded.exp) {
      return true
    }

    const expiresAt = decoded.exp * 1000 // Convertir a ms
    const now = Date.now()
    const thresholdMs = thresholdMinutes * 60 * 1000

    return (expiresAt - now) < thresholdMs
  } catch (error) {
    return true
  }
}
