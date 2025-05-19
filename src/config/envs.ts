import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required().default(3000),
    DATABASE_URL: joi
      .string()
      .required()
      .pattern(/^postgresql:\/\/.*$/)
      .message('DATABASE_URL must be a valid PostgreSQL URI'),
    JWT_SECRET: joi.string().required().min(32),
    JWT_EXPIRATION: joi.string().required().default('1d'),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRATION,
  },
};
