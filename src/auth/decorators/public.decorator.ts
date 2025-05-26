import { SetMetadata } from '@nestjs/common';

/**
 * Public route decorator
 *
 * Marks a route as public, bypassing authentication checks.
 * Use this decorator on endpoints that should be accessible without authentication.
 *
 * @returns Decorator function that marks route as public
 *
 * @example
 * ```typescript
 * @Public()
 * async publicEndpoint() {}
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
