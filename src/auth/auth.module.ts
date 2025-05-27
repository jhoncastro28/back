import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LogoutExceptionFilter } from './filters/logout-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
import { SessionService } from './services/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication Module
 *
 * Core module handling all authentication and authorization functionality:
 *
 * Features:
 * - User authentication and registration
 * - JWT-based token management
 * - Role-based access control (RBAC)
 * - Session tracking and management
 * - Rate limiting for public endpoints
 *
 * Security Measures:
 * - JWT token expiration
 * - Rate limiting protection
 * - Global authentication guard
 * - Role-based authorization guard
 * - Logout exception handling
 *
 * Dependencies:
 * - ConfigModule: For environment configuration
 * - PrismaModule: For database access
 * - PassportModule: For authentication strategies
 * - JwtModule: For JWT token handling
 * - ThrottlerModule: For rate limiting
 * - CommonModule: For shared functionality
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION_TIME', '24h'),
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,

    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: LogoutExceptionFilter,
    },
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
