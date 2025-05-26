import { Throttle } from '@nestjs/throttler';

/**
 * Rate limiting decorator for public endpoints
 *
 * Applies rate limiting to endpoints to prevent abuse and ensure fair usage.
 * Uses NestJS Throttler under the hood.
 *
 * @param limit - Maximum number of requests allowed within the TTL window (default: 5)
 * @param ttl - Time to live in milliseconds before the limit resets (default: 60000ms = 1 minute)
 * @returns Decorator function that applies rate limiting
 *
 * @example
 * ```typescript
 * @PublicRateLimit(10, 60000) // 10 requests per minute
 * async myEndpoint() {}
 * ```
 */
export const PublicRateLimit = (limit: number = 5, ttl: number = 60000) =>
  Throttle({ default: { limit, ttl } });
