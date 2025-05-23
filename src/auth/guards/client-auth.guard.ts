import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClientAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any) {
    // Allow only client tokens
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    if (user.type !== 'client') {
      throw new UnauthorizedException(
        'Only mobile clients can access this endpoint',
      );
    }

    return user;
  }
}
