/**
 * Upload Middleware
 * Middleware para manejo de uploads con Multer
 * Incluye validación de archivos y límites
 */

import multer from 'multer';
import { logger } from '../config/logger.js';

/**
 * Configuración de almacenamiento en memoria
 * Los archivos se mantienen en memoria como Buffer
 * para enviarlos directamente a Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * Filtro de archivos
 * Solo permite imágenes
 */
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    logger.debug('File accepted', {
      filename: file.originalname,
      mimetype: file.mimetype,
      correlationId: req.correlationId
    });
    cb(null, true);
  } else {
    logger.warn('File rejected - invalid type', {
      filename: file.originalname,
      mimetype: file.mimetype,
      correlationId: req.correlationId
    });
    cb(
      new Error(
        `Invalid file type. Only images are allowed (jpeg, jpg, png, gif, webp, svg). Got: ${file.mimetype}`
      ),
      false
    );
  }
};

/**
 * Configuración de Multer
 */
const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    files: 10 // Máximo 10 archivos por request
  }
};

/**
 * Instancia de Multer configurada
 */
const upload = multer(multerConfig);

/**
 * Middleware para upload de una sola imagen
 * Campo: 'image'
 */
export const uploadSingle = upload.single('image');

/**
 * Middleware para upload de múltiples imágenes
 * Campo: 'images'
 * Máximo: 10 imágenes
 */
export const uploadMultiple = upload.array('images', 10);

/**
 * Middleware para upload de múltiples campos
 * Permite diferentes campos con diferentes nombres
 */
export const uploadFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }
]);

/**
 * Middleware de manejo de errores de Multer
 * Debe colocarse después de los middlewares de upload
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error occurred', {
      code: err.code,
      message: err.message,
      field: err.field,
      correlationId: req.correlationId
    });

    // Errores específicos de Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds the maximum allowed (10MB)',
          details: err.message
        }
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded (maximum 10)',
          details: err.message
        }
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNEXPECTED_FILE',
          message: `Unexpected file field: ${err.field}`,
          details: err.message
        }
      });
    }

    // Error genérico de Multer
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'File upload error',
        details: err.message
      }
    });
  }

  // Error de validación de tipo de archivo
  if (err.message && err.message.includes('Invalid file type')) {
    logger.error('Invalid file type', {
      message: err.message,
      correlationId: req.correlationId
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Invalid file type',
        details: err.message
      }
    });
  }

  // Otros errores
  logger.error('Upload error', {
    message: err.message,
    stack: err.stack,
    correlationId: req.correlationId
  });

  next(err);
};

/**
 * Middleware para validar que se subió al menos un archivo
 */
export const requireFile = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    logger.warn('No file uploaded', {
      correlationId: req.correlationId
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded. Please provide an image file.'
      }
    });
  }

  next();
};

/**
 * Helper: Convertir buffer a data URI
 * Útil para enviar a Cloudinary
 */
export const bufferToDataURI = (file) => {
  if (!file || !file.buffer) {
    return null;
  }

  const b64 = Buffer.from(file.buffer).toString('base64');
  return `data:${file.mimetype};base64,${b64}`;
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  requireFile,
  bufferToDataURI
};
