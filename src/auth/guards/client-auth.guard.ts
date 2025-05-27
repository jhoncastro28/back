import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClientAuthGuard extends AuthGuard('jwt-client') {
  private readonly logger = new Logger(ClientAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Checking auth for ${request.method} ${request.url}`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${err?.message || 'No user'}`);
      throw err || new UnauthorizedException('Authentication required');
    }

    if (user.type !== 'client') {
      this.logger.warn(`Wrong user type: ${user.type}`);
      throw new UnauthorizedException(
        'Only mobile clients can access this endpoint',
      );
    }

    this.logger.debug(
      `Authentication successful for client: ${user.documentNumber}`,
    );
    return user;
  }
}
