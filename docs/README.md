# Mariachi Web V3 - Backend Documentation

## 📁 Documentación Enterprise

Bienvenido a la documentación completa del backend de Mariachi Web V3. Este directorio contiene toda la información necesaria para entender, usar y desplegar la API.

---

## 📚 Documentos Disponibles

### 1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Documentación completa de la API REST**

Contiene:
- Información general de la API
- Guía de autenticación JWT
- Todos los endpoints disponibles
- Esquemas de request/response
- Ejemplos de uso (cURL, JavaScript, React)
- Códigos de respuesta y manejo de errores
- Rate limiting
- Ejemplos de integración para frontend

**Cuándo usar**: Cuando el equipo de frontend necesite saber cómo consumir la API.

---

### 2. [MONGODB_INDEXES.md](./MONGODB_INDEXES.md)
**Guía de optimización de índices MongoDB**

Contiene:
- Estado actual de indexación (33+ índices)
- Índices por modelo (Albums, Concerts, Products, Announcements)
- Estrategia de indexación compuesta
- Comandos de monitoreo de performance
- Mejores prácticas de optimización
- Guía de index maintenance

**Cuándo usar**: Cuando necesites entender o optimizar el rendimiento de queries de base de datos.

---

### 3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
**Checklist completo para deployment a producción**

Contiene:
- Pre-deployment checklist
- Variables de entorno requeridas
- Guías paso a paso para múltiples plataformas:
  - Heroku
  - Railway.app
  - DigitalOcean
  - AWS (EC2 + PM2 + Nginx)
  - Docker
- Post-deployment verification
- Health checks
- Security checks
- Rollback plan
- Maintenance guides

**Cuándo usar**: Cuando estés listo para desplegar a producción o necesites configurar un nuevo ambiente.

---

## 🚀 Quick Start para Desarrolladores Frontend

### 1. Endpoints Principales

```
Base URL (Development): http://localhost:5000
Base URL (Production): https://api.mariachiweb.com
```

### 2. Autenticación

```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!'
  })
});

const { token, user } = await response.json();
```

### 3. Usar Token en Requests

```javascript
// Obtener álbumes
const albums = await fetch('http://localhost:5000/api/albums', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 4. Documentación Interactiva (Swagger)

Visita: `http://localhost:5000/api/docs`

Aquí puedes:
- Ver todos los endpoints
- Probar requests directamente
- Ver esquemas de datos
- Copiar ejemplos de código

---

## 🏗️ Arquitectura del Backend

### Estructura de Archivos

```
web-back/
├── app.js                        # Entry point
├── database.js                   # MongoDB connection
├── src/
│   ├── config/
│   │   ├── env.validation.js     # Variables de entorno (Zod)
│   │   ├── logger.js             # Winston logger
│   │   └── swagger.config.js     # Swagger/OpenAPI config
│   ├── controllers/              # Business logic
│   ├── models/                   # Mongoose schemas
│   ├── repositories/             # Data access layer
│   ├── routes/                   # API routes
│   ├── middleware/               # Express middleware
│   ├── validators/               # Zod validation schemas
│   └── services/                 # External services (Cloudinary)
├── tests/
│   └── integration/              # Integration tests
└── docs/                         # Esta carpeta
```

### Patrón de Arquitectura

El backend sigue un patrón **Repository Pattern** con capas claramente separadas:

```
Request → Route → Middleware → Controller → Repository → Model → Database
                      ↓                          ↓
                 Validation              Business Logic
```

**Beneficios**:
- Separación de responsabilidades
- Fácil testing
- Código reutilizable
- Mantenibilidad

---

## ✅ Estado Actual del Proyecto

### Testing: 214 Tests Passing ✅

```
Test Suites: 6 passed, 6 total
Tests:       214 passed, 214 total
Time:        ~24s
```

**Desglose**:
- Auth: 20 tests
- Albums: 44 tests
- Concerts: 40 tests
- Products: 46 tests
- Announcements: 51 tests
- Legacy Modules: 13 tests

### Features Enterprise Implementadas ✅

- ✅ **JWT Authentication** con RBAC
- ✅ **Rate Limiting** avanzado
- ✅ **Winston Logging** profesional
- ✅ **Helmet Security** headers
- ✅ **CORS** configurado
- ✅ **MongoDB Sanitization**
- ✅ **Circuit Breakers** para resiliencia
- ✅ **Correlation IDs** para tracking
- ✅ **Health Checks** detallados
- ✅ **Environment Validation** (Zod)
- ✅ **Error Handling** profesional
- ✅ **Swagger/OpenAPI** documentation
- ✅ **MongoDB Indexes** optimizados
- ✅ **Integration Tests** comprehensivos

---

## 🎯 Próximos Pasos para Frontend

### Fase 1: Setup Inicial
1. Leer [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Probar endpoints en Swagger: `http://localhost:5000/api/docs`
3. Configurar axios/fetch con base URL
4. Implementar authentication flow

### Fase 2: Integración de Módulos
1. **Auth Module**
   - Login/Register
   - Protected routes
   - Token refresh

2. **Albums Module**
   - Listar álbumes
   - Ver detalle de álbum
   - Filtros y búsqueda

3. **Concerts Module**
   - Calendario de eventos
   - Filtros geográficos
   - Compra de tickets (link externo)

4. **Products Module**
   - Catálogo de productos
   - Carrito de compras
   - Checkout

5. **Announcements Module**
   - Feed de noticias
   - Detalle de anuncio
   - Categorías

### Fase 3: Optimización
1. Implementar caching (React Query / SWR)
2. Optimistic UI updates
3. Error boundary y retry logic
4. Loading states y skeletons

---

## 🔧 Herramientas de Desarrollo

### Health Check durante desarrollo

```bash
# Basic health
curl http://localhost:5000/health

# Detailed (con DB status)
curl http://localhost:5000/health/detailed

# Metrics
curl http://localhost:5000/api/metrics/summary
```

### Ver Logs

```bash
# Development
tail -f logs/combined.log

# Errors only
tail -f logs/error.log
```

### Correr Tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Verbose
npm run test:verbose
```

---

## 📞 Soporte y Contacto

### Documentación Adicional
- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs/json`
- Health Check: `/health/detailed`

### Recursos Externos
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Express Docs](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

## 🎵 Sobre el Proyecto

**Mariachi Web V3** es una plataforma enterprise para músicos de mariachi que permite:
- Gestionar álbumes musicales
- Publicar y promocionar conciertos
- Vender productos y merchandise
- Compartir noticias y anuncios

**Stack Tecnológico**:
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Cloud Storage**: Cloudinary
- **Documentation**: Swagger/OpenAPI 3.0

---

## 📝 Changelog

### v3.0.0 (Diciembre 2024) - Production Ready
- ✅ Complete CRUD modules (Albums, Concerts, Products, Announcements)
- ✅ 214 integration tests
- ✅ Swagger/OpenAPI documentation
- ✅ MongoDB indexes optimized
- ✅ Deployment guides for multiple platforms
- ✅ Enterprise features (logging, rate limiting, security)
- ✅ Health checks and monitoring endpoints

---

**Última Actualización**: Diciembre 2024
**Versión**: 3.0.0
**Status**: ✅ PRODUCTION READY

---

## 🚦 Status del Backend

| Feature | Status | Coverage |
|---------|--------|----------|
| Auth Module | ✅ Ready | 20 tests |
| Albums Module | ✅ Ready | 44 tests |
| Concerts Module | ✅ Ready | 40 tests |
| Products Module | ✅ Ready | 46 tests |
| Announcements Module | ✅ Ready | 51 tests |
| Legacy Modules | ✅ Tested | 13 tests |
| Documentation | ✅ Complete | - |
| Deployment Guide | ✅ Complete | - |
| MongoDB Indexes | ✅ Optimized | 33+ indexes |
| Security | ✅ Enterprise | Helmet, CORS, Rate Limiting |

**Total Tests**: 214/214 passing ✅
**Ready for Frontend Integration**: YES ✅
**Ready for Production Deploy**: YES ✅
