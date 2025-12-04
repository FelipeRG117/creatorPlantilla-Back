# Mariachi Web V3 - Deployment Checklist

## Guía Completa para Deployment a Producción

Esta guía cubre todos los pasos necesarios para desplegar el backend de Mariachi Web V3 en un entorno de producción enterprise-ready.

---

## Pre-Deployment Checklist

### 1. Validación de Código ✅

- [ ] **Tests pasando al 100%**
  ```bash
  npm test
  ```
  - Objetivo: 214/214 tests passing
  - Cobertura mínima: 80%

- [ ] **No hay console.logs en código de producción**
  ```bash
  # Buscar console.logs (exceptuando archivos de test)
  grep -r "console.log" src/ --exclude-dir=tests
  ```

- [ ] **Linting sin errores**
  ```bash
  # Si tienes ESLint configurado
  npm run lint
  ```

- [ ] **Dependencies actualizadas y sin vulnerabilidades críticas**
  ```bash
  npm audit
  npm audit fix
  ```

### 2. Variables de Entorno 🔐

- [ ] **Crear archivo .env.production**
  ```env
  NODE_ENV=production
  PORT=5000

  # MongoDB
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mariachi-prod?retryWrites=true&w=majority

  # JWT
  JWT_SECRET=<generate-random-256-bit-string>
  JWT_EXPIRES_IN=7d
  JWT_REFRESH_EXPIRES_IN=30d

  # Cloudinary
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret

  # CORS
  FRONTEND_URL=https://www.mariachiweb.com
  ALLOWED_ORIGINS=https://www.mariachiweb.com,https://mariachiweb.com

  # Rate Limiting
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX_REQUESTS=100

  # Logging
  LOG_LEVEL=info
  LOG_DIR=./logs
  ```

- [ ] **Generar JWT_SECRET seguro**
  ```bash
  # Generar secret aleatorio de 256 bits
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **Validar que NO hay secrets en el código**
  ```bash
  # Buscar posibles secrets hardcodeados
  grep -r "password\s*=\s*['\"]" src/
  grep -r "secret\s*=\s*['\"]" src/
  ```

### 3. Base de Datos MongoDB 🗄️

- [ ] **MongoDB Atlas configurado (recomendado) o servidor MongoDB propio**
  - Cluster con Replica Set (mínimo M10 para producción)
  - Backup automático habilitado
  - IP Whitelist configurada

- [ ] **Connection String validado**
  ```bash
  # Test de conexión
  mongosh "mongodb+srv://user:pass@cluster.mongodb.net/mariachi-prod"
  ```

- [ ] **Índices creados automáticamente**
  - Mongoose los crea en primera conexión
  - Verificar con: `db.albums.getIndexes()`

- [ ] **Usuario de base de datos con permisos correctos**
  - Permisos: `readWrite` en la base de datos
  - NO usar cuenta con permisos de admin

### 4. Cloudinary ☁️

- [ ] **Cuenta de Cloudinary configurada**
  - Plan adecuado según volumen esperado
  - Upload presets configurados

- [ ] **Credenciales validadas**
  ```bash
  # Test rápido de upload
  curl -X POST https://api.cloudinary.com/v1_1/<cloud_name>/image/upload \
    -F "file=@test-image.jpg" \
    -F "api_key=<api_key>" \
    -F "timestamp=$(date +%s)" \
    -F "signature=<generate-signature>"
  ```

- [ ] **Transformaciones configuradas** (opcional)
  - Resize presets
  - Optimización automática
  - Format conversions

---

## Deployment Options

### Opción 1: Heroku (Recomendado para inicio)

#### Pasos de Deployment

1. **Instalar Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku

   # Windows
   # Descargar desde heroku.com/cli
   ```

2. **Login en Heroku**
   ```bash
   heroku login
   ```

3. **Crear aplicación**
   ```bash
   heroku create mariachi-web-api
   ```

4. **Configurar variables de entorno**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="mongodb+srv://..."
   heroku config:set JWT_SECRET="..."
   heroku config:set CLOUDINARY_CLOUD_NAME="..."
   heroku config:set CLOUDINARY_API_KEY="..."
   heroku config:set CLOUDINARY_API_SECRET="..."
   heroku config:set FRONTEND_URL="https://mariachiweb.com"
   ```

5. **Configurar Procfile** (ya incluido)
   ```
   web: node app.js
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Verificar logs**
   ```bash
   heroku logs --tail
   ```

8. **Escalar dynos** (si es necesario)
   ```bash
   heroku ps:scale web=2
   ```

#### Checklist Heroku

- [ ] Aplicación creada
- [ ] Variables de entorno configuradas
- [ ] Git remoto agregado
- [ ] Deploy exitoso
- [ ] Health check pasando: `https://mariachi-web-api.herokuapp.com/health`
- [ ] Swagger docs accesible: `https://mariachi-web-api.herokuapp.com/api/docs`

---

### Opción 2: Railway.app (Alternativa moderna)

1. **Conectar repositorio GitHub**
   - railway.app > New Project > Deploy from GitHub

2. **Configurar variables de entorno**
   - Settings > Variables > Bulk Import
   - Pegar contenido de .env.production

3. **Deploy automático**
   - Cada push a main despliega automáticamente

#### Checklist Railway

- [ ] Proyecto conectado a GitHub
- [ ] Variables configuradas
- [ ] Deploy automático habilitado
- [ ] Custom domain configurado (opcional)
- [ ] Health check pasando

---

### Opción 3: DigitalOcean App Platform

1. **Crear App**
   - App Platform > Create App > GitHub

2. **Configurar build**
   ```yaml
   # app.yaml
   name: mariachi-web-api
   services:
   - name: api
     github:
       repo: your-username/mariachi-web-v3
       branch: main
       deploy_on_push: true
     build_command: npm install
     run_command: npm start
     envs:
     - key: NODE_ENV
       value: production
     - key: MONGODB_URI
       value: ${MONGODB_URI}
   ```

3. **Deploy**
   - Automático al hacer push

---

### Opción 4: AWS (EC2 + PM2) - Producción Avanzada

#### 1. Provisionar EC2 Instance

- [ ] **Lanzar instancia EC2**
  - Type: t3.small o superior
  - OS: Ubuntu 22.04 LTS
  - Security Group: Puerto 80, 443, 22 abiertos

- [ ] **Conectar vía SSH**
  ```bash
  ssh -i key.pem ubuntu@<ec2-public-ip>
  ```

#### 2. Configurar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git

# Clonar repositorio
git clone https://github.com/your-username/mariachi-web-v3.git
cd mariachi-web-v3/web-back

# Instalar dependencies (production only)
npm ci --production

# Crear .env file
nano .env
# (pegar variables de entorno)
```

#### 3. Configurar PM2

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mariachi-api',
    script: './app.js',
    instances: 2,                    # Cluster mode (2 instancias)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver logs
pm2 logs

# Monitoreo
pm2 monit

# Guardar configuración
pm2 save

# Auto-start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### 4. Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Configurar site
sudo nano /etc/nginx/sites-available/mariachi-api
```

```nginx
server {
    listen 80;
    server_name api.mariachiweb.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/mariachi-api /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.mariachiweb.com

# Auto-renewal (ya configurado)
sudo certbot renew --dry-run
```

#### Checklist AWS

- [ ] EC2 instance running
- [ ] Node.js instalado
- [ ] Código clonado y dependencies instaladas
- [ ] PM2 configurado y running
- [ ] Nginx configurado
- [ ] SSL certificate instalado
- [ ] Health check pasando
- [ ] CloudWatch logs configurados (opcional)
- [ ] Auto Scaling configurado (opcional)

---

### Opción 5: Docker + Docker Compose

#### Dockerfile

```dockerfile
# Crear Dockerfile en la raíz del proyecto
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencies
RUN npm ci --production

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "app.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
```

#### Deploy con Docker

```bash
# Build image
docker build -t mariachi-api:latest .

# Run con docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Post-Deployment Verification

### 1. Health Checks 🏥

- [ ] **Basic Health**
  ```bash
  curl https://api.mariachiweb.com/health
  ```
  Response esperado: `{ "status": "healthy" }`

- [ ] **Detailed Health**
  ```bash
  curl https://api.mariachiweb.com/health/detailed
  ```
  Verificar:
  - database: "connected"
  - cloudinary: "configured"

- [ ] **Readiness Probe**
  ```bash
  curl https://api.mariachiweb.com/health/readiness
  ```

### 2. Endpoints Críticos 🔍

- [ ] **Root Endpoint**
  ```bash
  curl https://api.mariachiweb.com/
  ```

- [ ] **Swagger Docs**
  ```bash
  curl https://api.mariachiweb.com/api/docs
  ```

- [ ] **Auth - Register**
  ```bash
  curl -X POST https://api.mariachiweb.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
  ```

- [ ] **Auth - Login**
  ```bash
  curl -X POST https://api.mariachiweb.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}'
  ```

- [ ] **Albums - List**
  ```bash
  curl https://api.mariachiweb.com/api/albums
  ```

### 3. Performance Tests ⚡

- [ ] **Response Time < 200ms** (para endpoints simples)
  ```bash
  curl -w "@curl-format.txt" -o /dev/null -s https://api.mariachiweb.com/api/albums
  ```

  ```
  # curl-format.txt
  time_namelookup:  %{time_namelookup}\n
  time_connect:  %{time_connect}\n
  time_total:  %{time_total}\n
  ```

- [ ] **Load Test con Artillery** (opcional)
  ```bash
  npm install -g artillery

  # artillery.yml
  config:
    target: 'https://api.mariachiweb.com'
    phases:
      - duration: 60
        arrivalRate: 10
  scenarios:
    - flow:
        - get:
            url: "/api/albums"

  artillery run artillery.yml
  ```

### 4. Security Checks 🔒

- [ ] **HTTPS habilitado**
  ```bash
  curl -I https://api.mariachiweb.com
  ```
  Verificar: `Strict-Transport-Security` header presente

- [ ] **Security Headers (Helmet)**
  ```bash
  curl -I https://api.mariachiweb.com
  ```
  Verificar headers:
  - `X-DNS-Prefetch-Control`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Strict-Transport-Security`

- [ ] **CORS configurado correctamente**
  ```bash
  curl -H "Origin: https://mariachiweb.com" \
    -I https://api.mariachiweb.com/api/albums
  ```
  Verificar: `Access-Control-Allow-Origin` header

- [ ] **Rate Limiting funcionando**
  ```bash
  # Hacer 6 requests seguidos (límite es 5 en 15min para auth)
  for i in {1..6}; do
    curl -X POST https://api.mariachiweb.com/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"wrong@email.com","password":"wrong"}'
    echo "Request $i"
  done
  ```
  El 6to request debe retornar 429 (Too Many Requests)

### 5. Monitoring Setup 📊

- [ ] **Logs configurados**
  - Winston logs escribiendo a archivos
  - Rotation configurada

- [ ] **Error Tracking** (opcional pero recomendado)
  - Sentry configurado
  - Alerts configuradas

- [ ] **APM** (opcional)
  - New Relic / Datadog
  - Monitoreo de performance

- [ ] **Uptime Monitoring**
  - UptimeRobot / Pingdom
  - Alerts configuradas

---

## Rollback Plan 🔄

Si algo sale mal en deployment:

### Heroku/Railway
```bash
# Ver releases
heroku releases

# Rollback al release anterior
heroku rollback v123
```

### AWS con PM2
```bash
# Ir a versión anterior del código
cd /path/to/app
git checkout previous-commit-hash
npm install
pm2 restart all
```

### Docker
```bash
# Usar imagen anterior
docker-compose down
docker-compose up -d --build --no-cache previous-version
```

---

## Maintenance

### Backup de Base de Datos

#### MongoDB Atlas (Automático)
- Cloud Backups habilitados por defecto
- Retention: 7 días (configurable)
- Restore desde UI

#### Manual Backup
```bash
# Exportar colección
mongodump --uri="mongodb+srv://..." --db=mariachi-prod --out=./backup

# Importar backup
mongorestore --uri="mongodb+srv://..." --db=mariachi-prod ./backup/mariachi-prod
```

### Actualizar Código

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Instalar nuevas dependencies
npm install

# 3. Correr tests
npm test

# 4. Reiniciar aplicación
# Heroku
git push heroku main

# PM2
pm2 restart all

# Docker
docker-compose down && docker-compose up -d --build
```

### Monitoreo de Logs

```bash
# Heroku
heroku logs --tail

# PM2
pm2 logs

# Docker
docker-compose logs -f

# Archivos locales
tail -f logs/combined.log
tail -f logs/error.log
```

---

## Checklist Final de Producción ✅

### Pre-Launch
- [ ] Todos los tests pasando (214/214)
- [ ] Variables de entorno configuradas
- [ ] MongoDB production database configurado
- [ ] Cloudinary configurado
- [ ] SSL certificate instalado
- [ ] CORS configurado para dominio production
- [ ] Rate limiting habilitado
- [ ] Logging configurado

### Launch Day
- [ ] Deploy exitoso
- [ ] Health checks pasando
- [ ] Endpoints críticos funcionando
- [ ] Performance acceptable (< 200ms)
- [ ] Security headers presentes
- [ ] Monitoring activado
- [ ] Backups configurados

### Post-Launch
- [ ] Monitorear logs por 24h
- [ ] Verificar métricas de performance
- [ ] Revisar error rate
- [ ] Validar uptime
- [ ] Documentar issues encontrados

---

## Contacto y Soporte

### Documentación
- API Docs: `/api/docs`
- README: `/docs/README.md`
- API Documentation: `/docs/API_DOCUMENTATION.md`

### Monitoring Endpoints
- Health: `/health`
- Detailed Health: `/health/detailed`
- Metrics: `/api/metrics/summary`
- Circuit Breakers: `/api/circuit-breakers/status`

---

**Última Actualización**: Diciembre 2024
**Status**: ✅ PRODUCTION READY
**Test Coverage**: 214 tests passing
