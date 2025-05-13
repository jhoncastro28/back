import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';

@Catch(UnauthorizedException)
export class LogoutExceptionFilter implements ExceptionFilter {
  constructor(private authService: AuthService) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const url = request.originalUrl || request.url;

    const isLogoutEndpoint =
      request.method === 'POST' &&
      (url === '/auth/logout' || url.endsWith('/auth/logout'));

    if (isLogoutEndpoint) {
      const authHeader = request.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          this.authService.logoutWithToken(token);
        } catch (error) {
          console.error(
            'Error during logout token invalidation:',
            error.message,
          );
        }
      }

      return response.status(HttpStatus.OK).json({
        message: 'Successfully logged out',
      });
    }

    return response.status(exception.getStatus()).json(exception.getResponse());
  }
}
