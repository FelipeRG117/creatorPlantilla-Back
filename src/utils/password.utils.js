/**
 * Utilidades para manejo seguro de contraseñas
 *
 * Funciones para:
 * - Hashear contraseñas con bcrypt
 * - Comparar contraseñas hasheadas
 * - Validar fortaleza de contraseñas
 */

import bcrypt from 'bcryptjs'
import { ValidationError } from '../errors/AppError.js'

/**
 * Hashea una contraseña usando bcrypt
 *
 * @param {string} password - Contraseña en texto plano
 * @param {number} rounds - Número de rounds de salt (default: 10 o env.BCRYPT_ROUNDS)
 * @returns {Promise<string>} Contraseña hasheada
 *
 * @example
 * const hashedPassword = await hashPassword('myPassword123')
 */
export const hashPassword = async (password) => {
  if (!password) {
    throw new ValidationError('La contraseña es requerida')
  }

  if (typeof password !== 'string') {
    throw new ValidationError('La contraseña debe ser un string')
  }

  try {
    // Obtener rounds de bcrypt desde env o usar 10 por defecto
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10

    // Generar salt
    const salt = await bcrypt.genSalt(saltRounds)

    // Hashear password con el salt
    const hashedPassword = await bcrypt.hash(password, salt)

    return hashedPassword
  } catch (error) {
    throw new Error('Error al hashear la contraseña: ' + error.message)
  }
}

/**
 * Compara una contraseña en texto plano con un hash
 *
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} true si coinciden, false si no
 *
 * @example
 * const isValid = await comparePassword('myPassword123', user.password)
 * if (!isValid) {
 *   throw new AuthenticationError('Contraseña incorrecta')
 * }
 */
export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false
  }

  if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
    return false
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword)
    return isMatch
  } catch (error) {
    console.error('Error al comparar contraseñas:', error)
    return false
  }
}

/**
 * Valida la fortaleza de una contraseña
 * Reglas:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial (opcional)
 *
 * @param {string} password - Contraseña a validar
 * @param {Object} options - Opciones de validación
 * @param {number} options.minLength - Longitud mínima (default: 8)
 * @param {boolean} options.requireUppercase - Requiere mayúscula (default: true)
 * @param {boolean} options.requireLowercase - Requiere minúscula (default: true)
 * @param {boolean} options.requireNumber - Requiere número (default: true)
 * @param {boolean} options.requireSpecial - Requiere carácter especial (default: false)
 * @returns {Object} { valid: boolean, errors: string[] }
 *
 * @example
 * const validation = validatePasswordStrength('Abc12345')
 * if (!validation.valid) {
 *   console.log('Errores:', validation.errors)
 * }
 */
export const validatePasswordStrength = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false
  } = options

  const errors = []

  // Validar longitud
  if (!password || password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`)
  }

  // Validar mayúscula
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  }

  // Validar minúscula
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  }

  // Validar número
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  // Validar carácter especial
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Genera una contraseña aleatoria segura
 * Útil para reset de contraseñas o contraseñas temporales
 *
 * @param {number} length - Longitud de la contraseña (default: 12)
 * @returns {string} Contraseña generada
 *
 * @example
 * const tempPassword = generateRandomPassword(16)
 * // Enviar por email al usuario
 */
export const generateRandomPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|'

  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Completar el resto con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Mezclar los caracteres para que no sean predecibles
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Verifica si una contraseña está en la lista de contraseñas comunes
 * Útil para prevenir contraseñas débiles conocidas
 *
 * @param {string} password - Contraseña a verificar
 * @returns {boolean} true si es una contraseña común
 *
 * @example
 * if (isCommonPassword('password123')) {
 *   throw new ValidationError('Por favor usa una contraseña más segura')
 * }
 */
export const isCommonPassword = (password) => {
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    '111111',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'admin',
    'admin123'
  ]

  return commonPasswords.includes(password.toLowerCase())
}

/**
 * Sanitiza una contraseña (remueve espacios en blanco)
 *
 * @param {string} password - Contraseña a sanitizar
 * @returns {string} Contraseña sanitizada
 *
 * @example
 * const clean = sanitizePassword('  myPassword123  ')
 * // 'myPassword123'
 */
export const sanitizePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return ''
  }

  return password.trim()
}
