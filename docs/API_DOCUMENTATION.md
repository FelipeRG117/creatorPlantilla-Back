# Mariachi Web V3 - API Documentation

## 📚 Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Módulos CRUD Enterprise](#módulos-crud-enterprise)
5. [Módulos Legacy](#módulos-legacy)
6. [Códigos de Respuesta](#códigos-de-respuesta)
7. [Rate Limiting](#rate-limiting)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Información General

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://api.mariachiweb.com`

### Documentación Interactiva (Swagger)
- **URL**: `http://localhost:5000/api/docs`
- **Formato JSON**: `http://localhost:5000/api/docs/json`

### Características Enterprise Implementadas
- ✅ **JWT Authentication** con Bearer tokens
- ✅ **RBAC** (Role-Based Access Control): `user`, `creator`, `admin`
- ✅ **Rate Limiting** avanzado por endpoint
- ✅ **Logging** profesional (Winston + Morgan)
- ✅ **Security Headers** (Helmet)
- ✅ **CORS** configurado
- ✅ **MongoDB Sanitization** contra inyecciones
- ✅ **Validation** con Zod schemas
- ✅ **Health Checks** detallados
- ✅ **Circuit Breakers** para resiliencia
- ✅ **Correlation IDs** para tracking de requests

---

## Autenticación

### Obtener Token JWT

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Usar el Token

Incluye el token en el header `Authorization` de tus requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Registro de Nuevos Usuarios

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "nuevo@example.com",
  "password": "Password123!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "user"
}
```

**Response** (201):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## Endpoints Disponibles

### Health & Monitoring

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/health` | GET | No | Basic health check |
| `/health/detailed` | GET | No | Detailed health with DB status |
| `/health/readiness` | GET | No | Readiness probe (K8s) |
| `/health/liveness` | GET | No | Liveness probe (K8s) |
| `/health/metrics` | GET | No | System metrics |
| `/api/circuit-breakers/status` | GET | No | Circuit breaker status |
| `/api/metrics/summary` | GET | No | Metrics summary |

### Autenticación

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | Registrar nuevo usuario |
| `/api/auth/login` | POST | No | Iniciar sesión |
| `/api/auth/me` | GET | Sí | Obtener perfil actual |
| `/api/auth/profile` | PUT | Sí | Actualizar perfil |
| `/api/auth/change-password` | PUT | Sí | Cambiar contraseña |
| `/api/auth/logout` | POST | Sí | Cerrar sesión |
| `/api/auth/forgot-password` | POST | No | Solicitar reset de contraseña |
| `/api/auth/reset-password` | POST | No | Resetear contraseña |

---

## Módulos CRUD Enterprise

Los siguientes módulos implementan el patrón CRUD completo con características enterprise:

### 1. Albums (Álbumes Musicales)

**Base Path**: `/api/albums`

#### Endpoints Públicos

##### Listar Álbumes
```http
GET /api/albums?page=1&limit=10&sort=-releaseYear&search=mariachi
```

**Query Parameters**:
- `page` (number, default: 1): Número de página
- `limit` (number, default: 10, max: 100): Resultados por página
- `sort` (string): Campo de ordenamiento (usar `-` para descendente)
- `search` (string): Búsqueda por título/artista
- `genre` (string): Filtrar por género
- `year` (number): Filtrar por año de lanzamiento
- `isActive` (boolean): Solo álbumes activos

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Mariachi Tradicional Vol. 1",
      "artist": "Mariachi Vargas de Tecalitlán",
      "releaseYear": 2024,
      "genre": "Mariachi Tradicional",
      "coverImage": "https://res.cloudinary.com/.../image.jpg",
      "description": "Álbum de mariachi tradicional mexicano",
      "songs": [
        {
          "title": "El Rey",
          "duration": "3:45",
          "trackNumber": 1
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

##### Obtener Álbum por ID
```http
GET /api/albums/:id
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Mariachi Tradicional Vol. 1",
    ...
  }
}
```

##### Obtener Álbum por Slug
```http
GET /api/albums/slug/:slug
```

**Example**: `GET /api/albums/slug/mariachi-tradicional-vol-1`

##### Álbumes Destacados
```http
GET /api/albums/featured
```

##### Nuevos Lanzamientos
```http
GET /api/albums/new-releases
```

#### Endpoints Protegidos (Requieren Autenticación)

##### Crear Álbum
```http
POST /api/albums
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Nuevo Álbum Mariachi",
  "artist": "Mariachi Los Camperos",
  "releaseYear": 2024,
  "genre": "Mariachi Tradicional",
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "description": "Descripción del álbum",
  "songs": [
    {
      "title": "Canción 1",
      "duration": "3:30",
      "trackNumber": 1
    },
    {
      "title": "Canción 2",
      "duration": "4:15",
      "trackNumber": 2
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Nuevo Álbum Mariachi",
    ...
  }
}
```

##### Actualizar Álbum
```http
PUT /api/albums/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**: (Campos opcionales)
```json
{
  "title": "Título Actualizado",
  "description": "Nueva descripción"
}
```

##### Eliminar Álbum (Soft Delete)
```http
DELETE /api/albums/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Album deleted successfully"
}
```

##### Publicar Álbum
```http
POST /api/albums/:id/publish
Authorization: Bearer <token>
```

##### Despublicar Álbum
```http
POST /api/albums/:id/unpublish
Authorization: Bearer <token>
```

##### Archivar Álbum
```http
POST /api/albums/:id/archive
Authorization: Bearer <token>
```

##### Subir Cover Image
```http
POST /api/albums/:id/upload-cover
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Image file (JPG, PNG, WebP, max 5MB)

**Response** (200):
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/.../cover.jpg",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "coverImage": "https://res.cloudinary.com/.../cover.jpg",
    ...
  }
}
```

---

### 2. Concerts (Conciertos)

**Base Path**: `/api/concerts`

#### Endpoints Públicos

##### Listar Conciertos
```http
GET /api/concerts?page=1&limit=10&status=upcoming&city=Ciudad%20de%20México
```

**Query Parameters**:
- `page`, `limit`, `sort`, `search`: Igual que albums
- `status`: `upcoming`, `ongoing`, `completed`, `cancelled`
- `city`: Filtrar por ciudad
- `state`: Filtrar por estado
- `country`: Filtrar por país
- `dateFrom`: Fecha desde (ISO 8601)
- `dateTo`: Fecha hasta (ISO 8601)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Gran Noche de Mariachi",
      "description": "Concierto especial con los mejores mariachis",
      "date": "2024-12-25T20:00:00.000Z",
      "location": {
        "venue": "Auditorio Nacional",
        "city": "Ciudad de México",
        "state": "CDMX",
        "country": "México",
        "address": "Paseo de la Reforma 50",
        "coordinates": {
          "latitude": 19.4326,
          "longitude": -99.1332
        }
      },
      "performers": ["Mariachi Vargas de Tecalitlán"],
      "ticketPrice": {
        "min": 500,
        "max": 2000,
        "currency": "MXN"
      },
      "capacity": 5000,
      "status": "upcoming",
      "images": ["https://res.cloudinary.com/.../poster.jpg"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

##### Crear Concierto (Protegido)
```http
POST /api/concerts
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Gran Noche de Mariachi",
  "description": "Descripción del evento",
  "date": "2024-12-25T20:00:00.000Z",
  "location": {
    "venue": "Auditorio Nacional",
    "city": "Ciudad de México",
    "state": "CDMX",
    "country": "México",
    "address": "Paseo de la Reforma 50",
    "coordinates": {
      "latitude": 19.4326,
      "longitude": -99.1332
    }
  },
  "performers": ["Mariachi Vargas de Tecalitlán"],
  "ticketPrice": {
    "min": 500,
    "max": 2000,
    "currency": "MXN"
  },
  "capacity": 5000,
  "status": "upcoming",
  "images": []
}
```

---

### 3. Products (Productos)

**Base Path**: `/api/products`

#### Endpoints Públicos

##### Listar Productos
```http
GET /api/products?category=clothing&minPrice=100&maxPrice=5000
```

**Query Parameters**:
- `category`: `instruments`, `clothing`, `accessories`, `services`, `digital`
- `minPrice`, `maxPrice`: Rango de precios
- `inStock`: Solo productos con stock

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Sombrero Charro Profesional",
      "description": "Sombrero de alta calidad para mariachi",
      "price": 1500,
      "category": "clothing",
      "stock": 50,
      "images": ["https://res.cloudinary.com/.../sombrero.jpg"],
      "specifications": {
        "material": "Lana fina",
        "color": "Negro",
        "tamaño": "Varios"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

##### Crear Producto (Protegido)
```http
POST /api/products
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Sombrero Charro Profesional",
  "description": "Descripción del producto",
  "price": 1500,
  "category": "clothing",
  "stock": 50,
  "images": [],
  "specifications": {
    "material": "Lana fina",
    "color": "Negro"
  }
}
```

---

### 4. Announcements (Anuncios)

**Base Path**: `/api/announcements`

#### Endpoints Públicos

##### Listar Anuncios
```http
GET /api/announcements?category=news&status=published&isPinned=true
```

**Query Parameters**:
- `category`: `news`, `event`, `update`, `promotion`, `announcement`
- `status`: `draft`, `published`, `archived`
- `isPinned`: Solo anuncios fijados
- `tags`: Filtrar por tags (separados por coma)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Nueva Temporada de Conciertos 2024",
      "slug": "nueva-temporada-conciertos-2024",
      "content": "Contenido completo del anuncio en markdown...",
      "excerpt": "Breve resumen del anuncio",
      "category": "news",
      "status": "published",
      "featuredImage": "https://res.cloudinary.com/.../featured.jpg",
      "images": [],
      "tags": ["conciertos", "2024", "eventos"],
      "publishDate": "2024-01-01T00:00:00.000Z",
      "isPinned": true,
      "viewCount": 1523,
      "shareCount": 45,
      "clickCount": 230,
      "author": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "Admin",
        "lastName": "Sistema",
        "email": "admin@mariachiweb.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

##### Obtener Anuncio por Slug
```http
GET /api/announcements/slug/:slug
```

##### Incrementar Views
```http
POST /api/announcements/:id/view
```

##### Incrementar Shares
```http
POST /api/announcements/:id/share
```

##### Incrementar Clicks
```http
POST /api/announcements/:id/click
```

##### Crear Anuncio (Protegido)
```http
POST /api/announcements
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Nuevo Anuncio Importante",
  "content": "Contenido completo en markdown...",
  "excerpt": "Resumen corto",
  "category": "news",
  "status": "draft",
  "featuredImage": "https://res.cloudinary.com/.../image.jpg",
  "images": [],
  "tags": ["importante", "2024"],
  "publishDate": "2024-12-01T00:00:00.000Z",
  "isPinned": false
}
```

---

## Módulos Legacy

Los siguientes módulos son legacy (código antiguo) y **SOLO soportan operaciones de lectura (GET)**:

### 1. Creators (Creadores)
- `GET /api/creators` - Listar todos los creadores
- `GET /api/creators/:id` - Obtener creador por ID

### 2. Merch (Merchandising)
- `GET /api/merch` - Listar todo el merch

### 3. Institutions (Instituciones)
- `GET /api/institutions` - Listar todas las instituciones

### 4. Sponsors (Patrocinadores)
- `GET /api/sponsor` - Listar todos los sponsors (nota: ruta singular)

### 5. Courses (Cursos)
- `GET /api/courses` - Listar todos los cursos
- ⚠️ `GET /api/courses/:id` - **NO USAR** (tiene bugs, causa timeout)

### 6. Production (Producción)
- `GET /api/production` - Listar todas las producciones

**Notas sobre Módulos Legacy**:
- No tienen validación enterprise
- No tienen paginación
- Tienen código legacy con console.logs
- Algunos tienen bugs conocidos
- Se migrarán gradualmente a patrón enterprise

---

## Códigos de Respuesta

### Success (2xx)
- `200 OK` - Request exitoso
- `201 Created` - Recurso creado exitosamente

### Client Errors (4xx)
- `400 Bad Request` - Error de validación
- `401 Unauthorized` - Sin token o token inválido
- `403 Forbidden` - Sin permisos suficientes
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `429 Too Many Requests` - Rate limit excedido

### Server Errors (5xx)
- `500 Internal Server Error` - Error del servidor

### Formato de Error Estándar

Todos los errores siguen este formato:

```json
{
  "success": false,
  "error": "Descripción del error",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Errores de Validación

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Rate Limiting

La API implementa rate limiting para proteger contra abuso:

### Límites por Endpoint

| Endpoint Type | Límite | Ventana de Tiempo |
|---------------|--------|-------------------|
| General API | 100 requests | 15 minutos |
| Auth (login/register) | 5 requests | 15 minutos |
| Password Reset | 3 requests | 1 hora |

### Headers de Rate Limit

La API retorna headers con información del rate limit:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Respuesta cuando se excede el límite

```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Ejemplos de Uso

### JavaScript/TypeScript (Fetch API)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  return data.token;
};

// Obtener álbumes (con token)
const getAlbums = async (token) => {
  const response = await fetch('http://localhost:5000/api/albums?page=1&limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Crear álbum
const createAlbum = async (token, albumData) => {
  const response = await fetch('http://localhost:5000/api/albums', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(albumData)
  });

  return response.json();
};
```

### React (usando Axios)

```javascript
import axios from 'axios';

// Configurar axios con base URL y token
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Uso
const fetchAlbums = async () => {
  const response = await api.get('/albums', {
    params: { page: 1, limit: 10 }
  });
  return response.data;
};

const createAlbum = async (albumData) => {
  const response = await api.post('/albums', albumData);
  return response.data;
};
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# Obtener álbumes (sin autenticación)
curl http://localhost:5000/api/albums?page=1&limit=10

# Crear álbum (con autenticación)
curl -X POST http://localhost:5000/api/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title":"Nuevo Álbum",
    "artist":"Mariachi Los Camperos",
    "releaseYear":2024,
    "genre":"Mariachi Tradicional"
  }'

# Subir imagen
curl -X POST http://localhost:5000/api/albums/507f1f77bcf86cd799439011/upload-cover \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@cover.jpg"
```

---

## Testing

El backend cuenta con **214 tests** de integración que validan todos los endpoints:

```bash
# Ejecutar todos los tests
npm test

# Ver cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

**Cobertura de Tests**:
- ✅ Auth: 20 tests
- ✅ Albums: 44 tests
- ✅ Concerts: 40 tests
- ✅ Products: 46 tests
- ✅ Announcements: 51 tests
- ✅ Legacy Modules: 13 tests

---

## Soporte

Para preguntas o problemas con la API:
- **Swagger Docs**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health/detailed
- **Metrics**: http://localhost:5000/api/metrics/summary

---

**Última Actualización**: Diciembre 2024
**Versión API**: 3.0.0
**Status**: Production Ready ✅
