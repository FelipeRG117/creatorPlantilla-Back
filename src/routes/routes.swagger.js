/**
 * SWAGGER UI ROUTES
 *
 * Expone la documentación OpenAPI en /api/docs
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.config.js';

const router = express.Router();

// Configuración de Swagger UI
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #d4af37; }
  `,
  customSiteTitle: 'Mariachi Web V3 API Docs',
  customfavIcon: '/favicon.ico'
};

// Servir documentación Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

// Endpoint para obtener el JSON de OpenAPI
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export { router as routesSwagger };
