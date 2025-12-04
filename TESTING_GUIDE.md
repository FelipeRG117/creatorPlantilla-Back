# 🧪 Guía de Testing - API de Autenticación

**Backend Mariachi Web V3**

---

## 📋 Requisitos Previos

1. **MongoDB corriendo** (MongoDB Atlas o local)
2. **Variables de entorno configuradas** (`.env` creado)
3. **Dependencias instaladas**: `npm install`
4. **Servidor iniciado**: `npm run dev`

---

## 🚀 Iniciar el Servidor

```bash
cd web-back
npm run dev
```

**Salida esperada:**
```
✅ Conexión a MongoDB establecida exitosamente
📦 Base de datos: mariachiDB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 MARIACHI WEB V3 - BACKEND SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Servidor escuchando en: http://localhost:5000
📊 Modo: development
🗄️  Base de datos: mariachiDB
🌐 CORS origin: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Endpoints disponibles:
   - GET  /health
   - POST /api/auth/register
   - POST /api/auth/login
   - GET  /api/auth/me (protegido)
```

---

## 🔍 Testing con cURL

### 1. Health Check

```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": 1733184000000,
  "environment": "development",
  "database": "connected"
}
```

---

### 2. Registrar Usuario

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

**Respuesta esperada (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "674d1234567890abcdef1234",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "createdAt": "2025-12-02T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**

**400 - Validación fallida:**
```json
{
  "success": false,
  "error": {
    "id": "zod-1733184000000",
    "code": "VALIDATION_ERROR",
    "userMessage": "Por favor corrige los errores en el formulario",
    "metadata": {
      "issues": [
        {
          "path": "password",
          "message": "La contraseña debe tener al menos 8 caracteres",
          "code": "too_small"
        }
      ]
    }
  }
}
```

**409 - Email ya registrado:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT_ERROR",
    "userMessage": "El email ya está registrado"
  }
}
```

---

### 3. Login de Usuario

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123"
  }'
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "674d1234567890abcdef1234",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "lastLogin": "2025-12-02T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**

**401 - Credenciales inválidas:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "userMessage": "Debes iniciar sesión para continuar",
    "technicalMessage": "Credenciales inválidas"
  }
}
```

---

### 4. Obtener Perfil (Ruta Protegida)

**IMPORTANTE:** Necesitas el token del registro o login

```bash
# Guardar token en variable (en terminal bash/zsh)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Hacer request con token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "674d1234567890abcdef1234",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "lastLogin": "2025-12-02T...",
      "createdAt": "2025-12-02T..."
    }
  }
}
```

**Errores posibles:**

**401 - Sin token:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "userMessage": "Debes iniciar sesión para continuar",
    "technicalMessage": "No se proporcionó token de autenticación"
  }
}
```

**401 - Token inválido:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "userMessage": "Debes iniciar sesión para continuar",
    "technicalMessage": "Token inválido. Por favor inicia sesión nuevamente."
  }
}
```

---

### 5. Actualizar Perfil

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan Carlos",
    "lastName": "Pérez García",
    "phone": "+52 1234567890",
    "bio": "Amante de la música mariachi"
  }'
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "user": {
      "id": "674d1234567890abcdef1234",
      "email": "usuario@example.com",
      "firstName": "Juan Carlos",
      "lastName": "Pérez García",
      "phone": "+52 1234567890",
      "bio": "Amante de la música mariachi",
      "role": "user"
    }
  }
}
```

---

### 6. Cambiar Contraseña

```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Password123",
    "newPassword": "NewPassword456",
    "confirmPassword": "NewPassword456"
  }'
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🧪 Testing con Postman

### Importar Colección

1. Abrir Postman
2. Click en "Import"
3. Crear nueva colección "Mariachi Web V3"

### Configurar Variables de Entorno

**Variables:**
- `base_url`: `http://localhost:5000`
- `token`: (se llenará automáticamente)

### Requests a Crear:

#### 1. Register
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/register`
- **Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "Test1234",
  "firstName": "Test",
  "lastName": "User"
}
```
- **Tests (para guardar token):**
```javascript
if (pm.response.code === 201) {
  const response = pm.response.json();
  pm.environment.set("token", response.data.token);
}
```

#### 2. Login
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "Test1234"
}
```
- **Tests:**
```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("token", response.data.token);
}
```

#### 3. Get Profile
- **Method:** GET
- **URL:** `{{base_url}}/api/auth/me`
- **Headers:**
  - `Authorization`: `Bearer {{token}}`

#### 4. Update Profile
- **Method:** PUT
- **URL:** `{{base_url}}/api/auth/profile`
- **Headers:**
  - `Authorization`: `Bearer {{token}}`
- **Body (JSON):**
```json
{
  "firstName": "Updated",
  "lastName": "Name"
}
```

---

## 🐛 Troubleshooting

### Error: "MONGODB_URI no está definida"

**Solución:** Verifica que el archivo `.env` existe y tiene la variable configurada:
```bash
cat .env | grep MONGODB_URI
```

### Error: "Cannot find module"

**Solución:** Instala las dependencias:
```bash
npm install
```

### Error: "Port 5000 already in use"

**Solución:** Cambia el puerto en `.env`:
```env
PORT=5001
```

### Error: "connect ECONNREFUSED" (MongoDB)

**Solución:**
1. Verifica que MongoDB Atlas esté accesible
2. Verifica las credenciales en `.env`
3. Verifica tu IP en MongoDB Atlas whitelist

### Error de validación Zod

**Ejemplo:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "metadata": {
      "issues": [...]
    }
  }
}
```

**Solución:** Revisa los `metadata.issues` para ver qué campos fallaron la validación

---

## ✅ Checklist de Testing

- [ ] Servidor inicia sin errores
- [ ] Health check responde correctamente
- [ ] Registro de usuario funciona
- [ ] No permite emails duplicados
- [ ] Validación de password funciona (mínimo 8 chars, mayúscula, número)
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas falla (401)
- [ ] Token JWT se genera correctamente
- [ ] Ruta protegida `/auth/me` funciona con token válido
- [ ] Ruta protegida falla sin token (401)
- [ ] Ruta protegida falla con token inválido (401)
- [ ] Actualizar perfil funciona
- [ ] Cambiar contraseña funciona
- [ ] Password hasheado en base de datos (no texto plano)

---

## 🎯 Próximos Pasos

Una vez que todos los tests pasen:

1. ✅ **Fase 3.1 COMPLETA** - Seguridad y Autenticación
2. 🔄 **Fase 3.2** - Adaptar modelos para mariachi (Album, Concert, Product, Announcement)
3. 🔄 **Fase 3.3** - Crear endpoints CRUD completos
4. 🔄 **Fase 3.4** - Integrar con frontend Next.js

---

**Última actualización:** Diciembre 2, 2025
