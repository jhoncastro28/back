import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../interfaces';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);
    this.logger.debug(`User object: ${JSON.stringify(user)}`);
    this.logger.debug(`Token from headers: ${request.headers.authorization}`);

    // Check if user exists
    if (!user) {
      this.logger.error('No user object found in request');
      throw new ForbiddenException(
        'No user information found. You may not be authenticated.',
      );
    }

    // Check if user has a role
    if (!user.role) {
      this.logger.error('User has no role property');
      throw new ForbiddenException(
        'Your user account does not have a role assigned',
      );
    }

    // Check if user role is in required roles
    const hasRole = requiredRoles.includes(user.role);
    this.logger.debug(`User has required role: ${hasRole}`);

    if (!hasRole) {
      throw new ForbiddenException(
        `Role ${user.role} does not have access to this resource`,
      );
    }

    return true;
  }
}
