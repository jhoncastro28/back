export const testEnvs = {
  port: 3000,
  databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
  jwt: {
    secret: 'test_secret_key_32_characters_long_!!',
    expiresIn: '1d',
  },
};

// Mock process.env for tests
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test_secret_key_32_characters_long_!!';
process.env.JWT_EXPIRATION = '1d';
