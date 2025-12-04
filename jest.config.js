/**
 * Jest Configuration
 * Testing configuration for enterprise-grade backend
 */

export default {
  // Use native ESM
  testEnvironment: 'node',
  transform: {},

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],

  // Coverage thresholds (enterprise standard: 60%+)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout (60 seconds para tests con DB)
  testTimeout: 60000,

  // Verbose output
  verbose: true,

  // Detectar memory leaks
  detectLeaks: false,

  // Detectar tests abiertos
  detectOpenHandles: true,

  // Force exit después de tests
  forceExit: true,

  // Limpiar mocks entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Global variables disponibles en tests
  globals: {
    'NODE_ENV': 'test'
  }
};
