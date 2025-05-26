/**
 * Test Environment Configuration
 * Provides mock environment values for testing purposes
 */
export const testEnvs = {
  port: 3000,
  databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
  allowedOrigins: ['http://localhost:3000'],
  nodeEnv: 'development',
  jwtSecret:
    'testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt',
  jwtExpiresIn: '24h',
};

process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET =
  'testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt';
process.env.JWT_EXPIRES_IN = '24h';
