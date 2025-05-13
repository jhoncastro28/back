import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/role.guard';
import { Role } from '../interfaces/permission.interface';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
