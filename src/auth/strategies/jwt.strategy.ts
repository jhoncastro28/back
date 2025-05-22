import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from '../../config/envs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwt.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    try {
      this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      if (
        this.authService.isTokenInvalidated(payload.sub) ||
        this.authService.isTokenInvalidated(token)
      ) {
        throw new UnauthorizedException(
          'The session has expired or been logged out',
        );
      }

      // Check if this is a client token
      if (payload.type === 'client') {
        const client = await this.prismaService.client.findUnique({
          where: { id: payload.sub },
        });

        if (!client) {
          throw new UnauthorizedException('Client not found');
        }

        if (!client.isActive) {
          throw new UnauthorizedException('Client is inactive');
        }

        return {
          id: payload.sub,
          type: 'client',
          documentType: payload.documentType,
          documentNumber: payload.documentNumber,
          isActive: client.isActive,
        };
      }

      // Logic for users
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User is inactive');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
