import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (request.url.startsWith('/mobile/client')) {
      this.logger.debug(
        `Skipping global JWT guard for mobile route: ${request.url}`,
      );
      return true;
    }

    this.logger.debug(`Checking auth for ${request.method} ${request.url}`);

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.error('No Authorization header found');
    } else {
      this.logger.debug(
        `Authorization header format: ${authHeader.substring(0, 10)}...`,
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.error(
        `Authentication failed: ${err?.message || info?.message || 'No user found'}`,
      );
    }
    return super.handleRequest(err, user, info, context);
  }
}
