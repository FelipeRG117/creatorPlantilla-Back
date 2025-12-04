/**
 * Rutas de Autenticación
 *
 * Endpoints:
 * - POST /api/auth/register - Registro de usuarios
 * - POST /api/auth/login - Login
 * - GET  /api/auth/me - Obtener perfil (protegido)
 * - PUT  /api/auth/profile - Actualizar perfil (protegido)
 * - PUT  /api/auth/change-password - Cambiar contraseña (protegido)
 * - POST /api/auth/logout - Logout (protegido)
 * - POST /api/auth/forgot-password - Solicitar reset de contraseña
 * - POST /api/auth/reset-password - Resetear contraseña con token
 */

import { Router } from 'express'
import { AuthController } from '../controllers/controller.auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validation/auth.schemas.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const routesAuth = Router()

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "nuevo@example.com"
 *             password: "Password123!"
 *             firstName: "Juan"
 *             lastName: "Pérez"
 *             role: "user"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
routesAuth.post(
  '/register',
  validateRequest(registerSchema),
  asyncHandler(AuthController.register)
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y retorna un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "Password123!"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 email: "user@example.com"
 *                 firstName: "Juan"
 *                 lastName: "Pérez"
 *                 role: "user"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
routesAuth.post(
  '/login',
  validateRequest(loginSchema),
  asyncHandler(AuthController.login)
)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña (envía email con token)
 * @access  Público
 * @body    { email }
 */
routesAuth.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword)
)

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Público
 * @body    { token, newPassword, confirmPassword }
 */
routesAuth.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword)
)

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna la información del usuario actual basado en el token JWT
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
routesAuth.get(
  '/me',
  authenticate,
  asyncHandler(AuthController.getMe)
)

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Privado (requiere token)
 * @headers Authorization: Bearer <token>
 * @body    { firstName?, lastName?, phone?, bio?, avatar? }
 */
routesAuth.put(
  '/profile',
  authenticate,
  validateRequest(updateProfileSchema),
  asyncHandler(AuthController.updateProfile)
)

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Privado (requiere token)
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword, newPassword, confirmPassword }
 */
routesAuth.put(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (cliente debe eliminar el token)
 * @access  Privado (requiere token)
 * @headers Authorization: Bearer <token>
 */
routesAuth.post(
  '/logout',
  authenticate,
  asyncHandler(AuthController.logout)
)

// ==========================================
// RUTAS ADICIONALES (futuras implementaciones)
// ==========================================

/**
 * TODO: Implementar verificación de email
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email con token
 * @access  Público
 * @body    { token }
 */

/**
 * TODO: Implementar refresh token
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso
 * @access  Público
 * @body    { refreshToken }
 */

/**
 * TODO: Implementar revocación de tokens
 * @route   POST /api/auth/revoke
 * @desc    Revocar todos los tokens del usuario
 * @access  Privado
 * @headers Authorization: Bearer <token>
 */
