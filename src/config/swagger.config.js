/**
 * SWAGGER / OPENAPI 3.0 CONFIGURATION
 *
 * Documentación automática de la API usando OpenAPI Specification 3.0
 * Incluye:
 * - Información general de la API
 * - Esquemas de autenticación (JWT Bearer)
 * - Esquemas de datos reutilizables
 * - Tags organizados por módulos
 * - Respuestas comunes (errores, success)
 */

import swaggerJsdoc from 'swagger-jsdoc';

// ==========================================
// CONFIGURACIÓN BASE DE SWAGGER
// ==========================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mariachi Web V3 API',
      version: '3.0.0',
      description: `
# Mariachi Web V3 - Enterprise Backend API

API RESTful profesional para plataforma de músicos mariachi con características enterprise:

## Características Enterprise
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **RBAC** (Role-Based Access Control)
- ✅ **Rate Limiting** avanzado
- ✅ **Logging** profesional (Winston + Morgan)
- ✅ **Security Headers** (Helmet)
- ✅ **CORS** configurado
- ✅ **MongoDB Sanitization**
- ✅ **Health Checks** detallados
- ✅ **Circuit Breakers** para resiliencia
- ✅ **Correlation IDs** para tracking

## Módulos Disponibles
- **Auth**: Autenticación y autorización
- **Albums**: Gestión de álbumes musicales
- **Concerts**: Gestión de conciertos y eventos
- **Products**: Gestión de productos/servicios
- **Announcements**: Gestión de anuncios y noticias
- **Legacy**: Módulos legacy (Creators, Merch, Institutions, etc.)

## Autenticación
La mayoría de endpoints requieren autenticación JWT. Obtén tu token usando \`POST /api/auth/login\` y úsalo en el header:
\`\`\`
Authorization: Bearer <tu_token_jwt>
\`\`\`

## Rate Limiting
- **General API**: 100 requests / 15 minutos
- **Auth endpoints**: 5 requests / 15 minutos
- **Password reset**: 3 requests / hora

## Respuestas Comunes
- \`200\`: Success
- \`201\`: Created
- \`400\`: Bad Request (validación)
- \`401\`: Unauthorized (sin token o inválido)
- \`403\`: Forbidden (sin permisos)
- \`404\`: Not Found
- \`429\`: Too Many Requests (rate limit)
- \`500\`: Internal Server Error
      `,
      contact: {
        name: 'Mariachi Web V3 Support',
        email: 'support@mariachiweb.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.mariachiweb.com',
        description: 'Production server'
      }
    ],
    // ==========================================
    // SECURITY SCHEMES
    // ==========================================
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido desde /api/auth/login'
        }
      },
      // ==========================================
      // SCHEMAS REUTILIZABLES
      // ==========================================
      schemas: {
        // ===== ERROR SCHEMAS =====
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            correlationId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' }
                }
              }
            },
            correlationId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },

        // ===== USER/AUTH SCHEMAS =====
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            role: {
              type: 'string',
              enum: ['user', 'creator', 'admin'],
              example: 'user'
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' }
          }
        },

        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            role: { type: 'string', enum: ['user', 'creator'], example: 'user' }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },

        // ===== ALBUM SCHEMAS =====
        Album: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Mariachi Tradicional Vol. 1' },
            artist: { type: 'string', example: 'Mariachi Vargas de Tecalitlán' },
            releaseYear: { type: 'number', example: 2024 },
            genre: { type: 'string', example: 'Mariachi Tradicional' },
            coverImage: { type: 'string', example: 'https://cloudinary.com/image.jpg' },
            description: { type: 'string', example: 'Álbum de mariachi tradicional mexicano' },
            songs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'El Rey' },
                  duration: { type: 'string', example: '3:45' },
                  trackNumber: { type: 'number', example: 1 }
                }
              }
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        AlbumInput: {
          type: 'object',
          required: ['title', 'artist', 'releaseYear'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Mariachi Tradicional Vol. 1' },
            artist: { type: 'string', minLength: 3, maxLength: 200, example: 'Mariachi Vargas' },
            releaseYear: { type: 'number', minimum: 1900, maximum: 2100, example: 2024 },
            genre: { type: 'string', maxLength: 100, example: 'Mariachi Tradicional' },
            coverImage: { type: 'string', format: 'uri', example: 'https://cloudinary.com/image.jpg' },
            description: { type: 'string', maxLength: 2000, example: 'Descripción del álbum' },
            songs: {
              type: 'array',
              items: {
                type: 'object',
                required: ['title', 'duration'],
                properties: {
                  title: { type: 'string', example: 'El Rey' },
                  duration: { type: 'string', example: '3:45' },
                  trackNumber: { type: 'number', example: 1 }
                }
              }
            }
          }
        },

        // ===== CONCERT SCHEMAS =====
        Concert: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Gran Noche de Mariachi' },
            description: { type: 'string', example: 'Concierto especial con los mejores mariachis' },
            date: { type: 'string', format: 'date-time', example: '2024-12-25T20:00:00Z' },
            location: {
              type: 'object',
              properties: {
                venue: { type: 'string', example: 'Auditorio Nacional' },
                city: { type: 'string', example: 'Ciudad de México' },
                state: { type: 'string', example: 'CDMX' },
                country: { type: 'string', example: 'México' },
                address: { type: 'string', example: 'Paseo de la Reforma 50' },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', example: 19.4326 },
                    longitude: { type: 'number', example: -99.1332 }
                  }
                }
              }
            },
            performers: {
              type: 'array',
              items: { type: 'string', example: 'Mariachi Vargas de Tecalitlán' }
            },
            ticketPrice: {
              type: 'object',
              properties: {
                min: { type: 'number', example: 500 },
                max: { type: 'number', example: 2000 },
                currency: { type: 'string', example: 'MXN' }
              }
            },
            capacity: { type: 'number', example: 5000 },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              example: 'upcoming'
            },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        ConcertInput: {
          type: 'object',
          required: ['title', 'date', 'location'],
          properties: {
            title: { type: 'string', minLength: 5, example: 'Gran Noche de Mariachi' },
            description: { type: 'string', maxLength: 2000 },
            date: { type: 'string', format: 'date-time' },
            location: {
              type: 'object',
              required: ['venue', 'city', 'state', 'country'],
              properties: {
                venue: { type: 'string', example: 'Auditorio Nacional' },
                city: { type: 'string', example: 'Ciudad de México' },
                state: { type: 'string', example: 'CDMX' },
                country: { type: 'string', example: 'México' },
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' }
                  }
                }
              }
            },
            performers: { type: 'array', items: { type: 'string' } },
            ticketPrice: {
              type: 'object',
              properties: {
                min: { type: 'number', minimum: 0 },
                max: { type: 'number', minimum: 0 },
                currency: { type: 'string', default: 'MXN' }
              }
            },
            capacity: { type: 'number', minimum: 1 },
            status: { type: 'string', enum: ['upcoming', 'ongoing', 'completed', 'cancelled'] },
            images: { type: 'array', items: { type: 'string', format: 'uri' } }
          }
        },

        // ===== PRODUCT SCHEMAS =====
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Sombrero Charro Profesional' },
            description: { type: 'string', example: 'Sombrero de alta calidad para mariachi' },
            price: { type: 'number', example: 1500 },
            category: {
              type: 'string',
              enum: ['instruments', 'clothing', 'accessories', 'services', 'digital'],
              example: 'clothing'
            },
            stock: { type: 'number', example: 50 },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            specifications: {
              type: 'object',
              additionalProperties: { type: 'string' }
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        ProductInput: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            name: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string', maxLength: 2000 },
            price: { type: 'number', minimum: 0 },
            category: {
              type: 'string',
              enum: ['instruments', 'clothing', 'accessories', 'services', 'digital']
            },
            stock: { type: 'number', minimum: 0 },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            specifications: { type: 'object', additionalProperties: { type: 'string' } }
          }
        },

        // ===== ANNOUNCEMENT SCHEMAS =====
        Announcement: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Nueva Temporada de Conciertos 2024' },
            slug: { type: 'string', example: 'nueva-temporada-conciertos-2024' },
            content: { type: 'string', example: 'Contenido completo del anuncio...' },
            excerpt: { type: 'string', example: 'Breve resumen del anuncio' },
            category: {
              type: 'string',
              enum: ['news', 'event', 'update', 'promotion', 'announcement'],
              example: 'news'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              example: 'published'
            },
            featuredImage: { type: 'string', format: 'uri' },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            tags: { type: 'array', items: { type: 'string' } },
            publishDate: { type: 'string', format: 'date-time' },
            isPinned: { type: 'boolean', example: false },
            viewCount: { type: 'number', example: 0 },
            shareCount: { type: 'number', example: 0 },
            clickCount: { type: 'number', example: 0 },
            author: { $ref: '#/components/schemas/User' },
            createdBy: { $ref: '#/components/schemas/User' },
            updatedBy: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        AnnouncementInput: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 200 },
            content: { type: 'string', minLength: 10 },
            excerpt: { type: 'string', maxLength: 500 },
            category: {
              type: 'string',
              enum: ['news', 'event', 'update', 'promotion', 'announcement']
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              default: 'draft'
            },
            featuredImage: { type: 'string', format: 'uri' },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            tags: { type: 'array', items: { type: 'string' } },
            publishDate: { type: 'string', format: 'date-time' },
            isPinned: { type: 'boolean', default: false }
          }
        },

        // ===== PAGINATION SCHEMA =====
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        },

        // ===== HEALTH CHECK SCHEMAS =====
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'], example: 'healthy' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', example: 123456 },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['connected', 'disconnected'], example: 'connected' },
                cloudinary: { type: 'string', enum: ['configured', 'not configured'], example: 'configured' }
              }
            }
          }
        }
      },

      // ==========================================
      // RESPONSE TEMPLATES
      // ==========================================
      responses: {
        Unauthorized: {
          description: 'No autorizado - Token inválido o no proporcionado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'No token provided. Please login first.',
                correlationId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T12:00:00Z'
              }
            }
          }
        },
        Forbidden: {
          description: 'Prohibido - Sin permisos suficientes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Insufficient permissions',
                correlationId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T12:00:00Z'
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Resource not found',
                correlationId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T12:00:00Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Demasiadas peticiones - Rate limit excedido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Too many requests, please try again later',
                correlationId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T12:00:00Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },

      // ==========================================
      // PARAMETERS COMUNES
      // ==========================================
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Número de página'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Número de resultados por página'
        },
        sortParam: {
          in: 'query',
          name: 'sort',
          schema: { type: 'string', example: '-createdAt' },
          description: 'Campo de ordenamiento (usar - para descendente)'
        },
        searchParam: {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Búsqueda de texto'
        },
        idParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          description: 'MongoDB ObjectId'
        }
      }
    },

    // ==========================================
    // TAGS (Organización de endpoints)
    // ==========================================
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y autorización JWT'
      },
      {
        name: 'Albums',
        description: 'Gestión de álbumes musicales'
      },
      {
        name: 'Concerts',
        description: 'Gestión de conciertos y eventos'
      },
      {
        name: 'Products',
        description: 'Gestión de productos y servicios'
      },
      {
        name: 'Announcements',
        description: 'Gestión de anuncios y noticias'
      },
      {
        name: 'Health',
        description: 'Health checks y monitoreo del sistema'
      },
      {
        name: 'Legacy - Creators',
        description: 'Módulo legacy de creadores (solo lectura)'
      },
      {
        name: 'Legacy - Merch',
        description: 'Módulo legacy de merchandising (solo lectura)'
      },
      {
        name: 'Legacy - Institutions',
        description: 'Módulo legacy de instituciones (solo lectura)'
      },
      {
        name: 'Legacy - Sponsors',
        description: 'Módulo legacy de patrocinadores (solo lectura)'
      },
      {
        name: 'Legacy - Courses',
        description: 'Módulo legacy de cursos (solo lectura)'
      },
      {
        name: 'Legacy - Production',
        description: 'Módulo legacy de producción (solo lectura)'
      }
    ]
  },
  // ==========================================
  // ARCHIVOS A DOCUMENTAR
  // ==========================================
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

// Generar especificación Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerSpec };
