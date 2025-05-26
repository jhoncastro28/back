import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prismaService: PrismaService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    try {
      this.logger.debug(`=== JWT VALIDATION START ===`);
      this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);
      this.logger.debug(`Request URL: ${req.url}`);
      this.logger.debug(`Request Method: ${req.method}`);

      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      this.logger.debug(
        `Extracted Token: ${token ? token.substring(0, 20) + '...' : 'No token'}`,
      );

      if (!token) {
        this.logger.error('No token provided');
        throw new UnauthorizedException('No token provided');
      }

      const isTokenInvalidated = this.authService.isTokenInvalidated(token);

      this.logger.debug(`Token invalidated check: ${isTokenInvalidated}`);

      if (isTokenInvalidated) {
        this.logger.error('Token is invalidated');
        throw new UnauthorizedException(
          'The session has expired or been logged out',
        );
      }

      if (payload.type === 'client') {
        this.logger.debug(`Processing CLIENT token for ID: ${payload.sub}`);

        const client = await this.prismaService.client.findUnique({
          where: { id: payload.sub },
        });

        this.logger.debug(
          `Client lookup result: ${client ? 'Found' : 'Not found'}`,
        );

        if (!client) {
          this.logger.error(
            `Client with ID ${payload.sub} not found in database`,
          );
          throw new UnauthorizedException('Client not found');
        }

        if (!client.isActive) {
          this.logger.error(`Client with ID ${payload.sub} is inactive`);
          throw new UnauthorizedException('Client is inactive');
        }

        const clientUser = {
          id: payload.sub,
          type: 'client',
          documentType: payload.documentType,
          documentNumber: payload.documentNumber,
          isActive: client.isActive,
          clientId: payload.sub,
          name: client.name,
          email: client.email,
        };

        this.logger.debug(
          `CLIENT validation successful, returning: ${JSON.stringify(clientUser)}`,
        );
        return clientUser;
      }

      this.logger.debug(`Processing USER token for ID: ${payload.sub}`);

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      this.logger.debug(`User lookup result: ${user ? 'Found' : 'Not found'}`);

      if (!user) {
        this.logger.error(`User with ID ${payload.sub} not found in database`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.error(`User with ID ${payload.sub} is inactive`);
        throw new UnauthorizedException('User is inactive');
      }

      const regularUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        type: 'user',
      };

      this.logger.debug(
        `USER validation successful, returning: ${JSON.stringify(regularUser)}`,
      );
      return regularUser;
    } catch (error) {
      this.logger.error(`=== JWT VALIDATION ERROR ===`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
