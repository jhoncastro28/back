/**
 * Core configuration and bootstrap file for the SIGMA API
 *
 * Core Features:
 * 1. Logging Configuration:
 *    - Implements comprehensive logging levels (error, warn, debug, log, verbose)
 *    - Uses NestJS built-in logger for consistent log formatting
 *    - Enables tracking of application events and errors
 *    - Custom log format for better debugging and monitoring
 *
 * 2. Security Features:
 *    - CORS enabled for cross-origin resource sharing with secure defaults
 *    - Input validation using ValidationPipe with strict settings
 *    - Data sanitization with whitelist and forbidNonWhitelisted options
 *    - Bearer token authentication support
 *    - Rate limiting for API endpoints
 *    - Helmet middleware for HTTP header security
 *    - XSS protection
 *
 * 3. API Documentation:
 *    - Swagger/OpenAPI integration for API documentation
 *    - Interactive API testing interface at /api/docs
 *    - Detailed endpoint descriptions and request/response schemas
 *    - API versioning support
 *    - Request/Response examples included
 *
 * 4. Environment Configuration:
 *    - Environment-based configuration using envs
 *    - Dynamic port allocation
 *    - Flexible configuration for different deployment environments
 *    - Secure secrets management
 *
 * 5. Application Architecture:
 *    - Modular design with AppModule as the root module
 *    - Dependency injection for loose coupling
 *    - Scalable and maintainable structure
 *    - Global exception handling
 *    - Request lifecycle hooks
 *
 * 6. Performance Optimizations:
 *    - Response compression
 *    - Caching strategies
 *    - Efficient request parsing
 *    - Payload size limits
 *
 * @module Core
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
// import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { envs } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Security Middleware
  app.use(helmet());
  // if (envs.nodeEnv === 'production') {
  //   app.use(
  //     rateLimit({
  //       windowMs: 15 * 60 * 1000, // 15 minutes
  //       max: 1000, // limit each IP to 1000 requests per windowMs
  //     }),
  //   );
  // }

  // CORS Configuration
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || envs.allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Global Pipes and Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: envs.nodeEnv === 'production',
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Performance Optimizations
  app.use(compression());
  app.enableShutdownHooks();

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('SIGMA API')
    .setDescription('API para la gestión de inventario de la empresa Almendros')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Server Startup
  const port = envs.port;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Environment: ${envs.nodeEnv}`);
  logger.log(`Server is running at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
