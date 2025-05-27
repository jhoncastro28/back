import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtClientStrategy extends PassportStrategy(
  Strategy,
  'jwt-client',
) {
  private readonly logger = new Logger(JwtClientStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    this.logger.debug('=== CLIENT JWT VALIDATION START ===');
    this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

    // Validación simple para clientes móviles - SIN SessionService
    if (!payload.sub || payload.type !== 'client') {
      this.logger.warn('Invalid client token - missing sub or wrong type');
      throw new UnauthorizedException('Invalid client token');
    }

    this.logger.debug('Client validation successful');
    return {
      id: payload.sub,
      type: payload.type,
      documentType: payload.documentType,
      documentNumber: payload.documentNumber,
    };
  }
}
