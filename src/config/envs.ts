import 'dotenv/config';
import * as joi from 'joi';

/**
 * Environment Variables Interface
 * Defines the structure and types of required environment variables
 */
interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  ALLOWED_ORIGINS: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

/**
 * Environment validation schema using Joi
 * Validates all required environment variables with specific rules
 */
const envsSchema = joi
  .object({
    PORT: joi.number().port().required().default(3000).messages({
      'number.base': 'PORT must be a number',
      'number.port': 'PORT must be a valid port number (0-65535)',
    }),

    DATABASE_URL: joi
      .string()
      .required()
      .pattern(/^postgresql:\/\/.*$/)
      .messages({
        'string.base': 'DATABASE_URL must be a string',
        'string.empty': 'DATABASE_URL cannot be empty',
        'string.pattern.base':
          'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://',
        'any.required': 'DATABASE_URL is required',
      }),

    ALLOWED_ORIGINS: joi.string().required().messages({
      'string.base': 'ALLOWED_ORIGINS must be a string',
      'string.empty': 'ALLOWED_ORIGINS cannot be empty',
    }),

    NODE_ENV: joi
      .string()
      .valid('development', 'production')
      .required()
      .messages({
        'string.base': 'NODE_ENV must be a string',
        'string.empty': 'NODE_ENV cannot be empty',
        'string.valid': 'NODE_ENV must be one of: development, production',
      }),

    JWT_SECRET: joi.string().messages({
      'string.base': 'JWT_SECRET must be a string',
      'string.empty': 'JWT_SECRET cannot be empty',
    }),

    JWT_EXPIRES_IN: joi.string().messages({
      'string.base': 'JWT_EXPIRES_IN must be a string',
      'string.empty': 'JWT_EXPIRES_IN cannot be empty',
    }),
  })
  .unknown(true);

/**
 * Validate environment variables
 * Throws detailed error messages if validation fails
 */
const { error, value } = envsSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  const errorMessage = error.details.map((detail) => detail.message).join('\n');
  throw new Error(
    `Environment Configuration Validation Error:\n${errorMessage}`,
  );
}

const envVars: EnvVars = value;

/**
 * Validated and typed environment configuration
 * Use this object throughout the application for environment values
 */
export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map((origin) =>
    origin.trim(),
  ),
  nodeEnv: envVars.NODE_ENV,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
};
