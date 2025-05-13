import { Global, Module } from '@nestjs/common';

/**
 * Common Module
 *
 * This module contains shared components, DTOs, and utilities
 * that can be used across the application to promote code reuse
 * and maintain consistency throughout the codebase.
 *
 * Marked as @Global to make it available application-wide without
 * explicitly importing it in every module.
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}
