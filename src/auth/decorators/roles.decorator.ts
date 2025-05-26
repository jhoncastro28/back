import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/role.guard';
import { Role } from '../interfaces/permission.interface';

/**
 * Role-based access control decorator
 *
 * Assigns one or more roles to a route or controller, restricting access
 * to users with matching roles. Works in conjunction with RoleGuard.
 *
 * @param roles - Array of roles that are allowed to access the route
 * @returns Decorator function that assigns roles metadata
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.MANAGER)
 * async protectedEndpoint() {}
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
