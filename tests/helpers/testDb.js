/**
 * Test Database Helper
 * MongoDB Memory Server para tests aislados
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '../../src/config/logger.js';

let mongoServer;

/**
 * Conectar a MongoDB Memory Server
 */
export async function connectTestDB() {
  try {
    // Crear instancia de MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Puerto diferente al de desarrollo
        dbName: 'mariachi-web-test'
      }
    });

    const uri = mongoServer.getUri();

    // Conectar con mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Test database connected', {
      uri: uri.replace(/\/\/.*@/, '//***:***@') // Ocultar credenciales
    });

    return mongoServer;
  } catch (error) {
    logger.error('Failed to connect to test database', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Desconectar y detener MongoDB Memory Server
 */
export async function disconnectTestDB() {
  try {
    // Desconectar mongoose
    await mongoose.disconnect();

    // Detener MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }

    logger.info('Test database disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from test database', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Limpiar todas las colecciones
 */
export async function clearTestDB() {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    logger.debug('Test database cleared');
  } catch (error) {
    logger.error('Failed to clear test database', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Limpiar una colección específica
 */
export async function clearCollection(collectionName) {
  try {
    const collection = mongoose.connection.collections[collectionName];
    if (collection) {
      await collection.deleteMany({});
      logger.debug(`Collection ${collectionName} cleared`);
    }
  } catch (error) {
    logger.error(`Failed to clear collection ${collectionName}`, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Obtener URI de test database
 */
export function getTestDBUri() {
  if (!mongoServer) {
    throw new Error('MongoDB Memory Server not initialized');
  }
  return mongoServer.getUri();
}

/**
 * Helper para crear datos de prueba
 */
export async function seedTestData(model, data) {
  try {
    if (Array.isArray(data)) {
      return await model.insertMany(data);
    }
    return await model.create(data);
  } catch (error) {
    logger.error('Failed to seed test data', {
      model: model.modelName,
      error: error.message
    });
    throw error;
  }
}

export default {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  clearCollection,
  getTestDBUri,
  seedTestData
};
