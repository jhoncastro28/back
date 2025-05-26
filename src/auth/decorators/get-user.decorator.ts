import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * User data extraction decorator
 *
 * Extracts the authenticated user object or a specific user property from the request.
 * Must be used in conjunction with authentication guard to ensure user data is available.
 *
 * @param data - Optional property name to extract from the user object
 * @param ctx - Execution context containing the request
 * @returns Complete user object or specific user property if data parameter is provided
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@GetUser() user: User) {}
 *
 * @Get('email')
 * async getEmail(@GetUser('email') email: string) {}
 * ```
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
