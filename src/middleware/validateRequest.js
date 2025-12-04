/**
 * Middleware de validación usando Zod schemas
 * Inspirado en el sistema de querySchemas.ts
 *
 * Este middleware:
 * 1. Valida datos usando schemas de Zod
 * 2. Captura errores de validación automáticamente
 * 3. Los pasa al errorHandler para normalización
 * 4. Adjunta datos validados al request
 */

import { ValidationError } from '../errors/AppError.js'

/**
 * Middleware para validar el body de la request con un schema de Zod
 *
 * @param {ZodSchema} schema - Schema de Zod para validar
 * @returns {Function} Middleware de Express
 *
 * @example
 * import { createAlbumSchema } from '../validation/album.schemas.js'
 *
 * router.post('/albums',
 *   validateRequest(createAlbumSchema),
 *   AlbumController.create
 * )
 */
export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validar el body con el schema de Zod
      // parseAsync soporta validaciones asíncronas (como el refine en querySchemas.ts)
      const validatedData = await schema.parseAsync(req.body)

      // Adjuntar datos validados al request
      req.validatedData = validatedData

      next()
    } catch (error) {
      // ZodError será capturado por errorHandler y normalizado automáticamente
      next(error)
    }
  }
}

/**
 * Middleware para validar los params de la URL (como :id)
 *
 * @param {ZodSchema} schema - Schema de Zod para validar
 * @returns {Function} Middleware de Express
 *
 * @example
 * import { idParamSchema } from '../validation/common.schemas.js'
 *
 * router.get('/albums/:id',
 *   validateParams(idParamSchema),
 *   AlbumController.getById
 * )
 */
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedParams = await schema.parseAsync(req.params)
      req.validatedParams = validatedParams
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware para validar query strings (?sort=newest&limit=10)
 *
 * @param {ZodSchema} schema - Schema de Zod para validar
 * @returns {Function} Middleware de Express
 *
 * @example
 * import { albumQuerySchema } from '../validation/album.schemas.js'
 *
 * router.get('/albums',
 *   validateQuery(albumQuerySchema),
 *   AlbumController.getAll
 * )
 */
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedQuery = await schema.parseAsync(req.query)
      req.validatedQuery = validatedQuery
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware para validar archivos subidos (multipart/form-data)
 * Valida metadata del archivo, no el contenido
 *
 * @param {Object} options - Opciones de validación
 * @param {string[]} options.allowedTypes - Tipos MIME permitidos
 * @param {number} options.maxSize - Tamaño máximo en bytes
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.post('/albums/upload',
 *   upload.single('image'),
 *   validateFile({
 *     allowedTypes: ['image/jpeg', 'image/png'],
 *     maxSize: 5 * 1024 * 1024 // 5MB
 *   }),
 *   AlbumController.uploadImage
 * )
 */
export const validateFile = (options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024, // 10MB por defecto
    required = true
  } = options

  return (req, res, next) => {
    try {
      // Verificar si se requiere archivo
      if (required && !req.file) {
        throw new ValidationError('No se proporcionó ningún archivo', {
          field: 'file',
          message: 'Se requiere un archivo'
        })
      }

      // Si no hay archivo y no es requerido, continuar
      if (!req.file) {
        return next()
      }

      // Validar tipo de archivo
      if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
        throw new ValidationError('Tipo de archivo no permitido', {
          field: 'file',
          message: `Tipos permitidos: ${allowedTypes.join(', ')}`,
          received: req.file.mimetype
        })
      }

      // Validar tamaño
      if (req.file.size > maxSize) {
        throw new ValidationError('Archivo demasiado grande', {
          field: 'file',
          message: `Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
          received: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware para validar múltiples archivos
 *
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.post('/albums/upload-multiple',
 *   upload.array('images', 5),
 *   validateFiles({
 *     allowedTypes: ['image/jpeg', 'image/png'],
 *     maxSize: 5 * 1024 * 1024,
 *     maxFiles: 5
 *   }),
 *   AlbumController.uploadMultipleImages
 * )
 */
export const validateFiles = (options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024,
    maxFiles = 10,
    required = true
  } = options

  return (req, res, next) => {
    try {
      // Verificar si se requieren archivos
      if (required && (!req.files || req.files.length === 0)) {
        throw new ValidationError('No se proporcionaron archivos', {
          field: 'files',
          message: 'Se requieren archivos'
        })
      }

      // Si no hay archivos y no son requeridos, continuar
      if (!req.files || req.files.length === 0) {
        return next()
      }

      // Validar cantidad de archivos
      if (req.files.length > maxFiles) {
        throw new ValidationError('Demasiados archivos', {
          field: 'files',
          message: `Máximo ${maxFiles} archivos permitidos`,
          received: req.files.length
        })
      }

      // Validar cada archivo
      for (const file of req.files) {
        // Validar tipo
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          throw new ValidationError('Tipo de archivo no permitido', {
            field: 'files',
            fileName: file.originalname,
            message: `Tipos permitidos: ${allowedTypes.join(', ')}`,
            received: file.mimetype
          })
        }

        // Validar tamaño
        if (file.size > maxSize) {
          throw new ValidationError('Archivo demasiado grande', {
            field: 'files',
            fileName: file.originalname,
            message: `Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
            received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
          })
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
