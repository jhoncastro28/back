import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from './services/pagination.service';
import { ReportService } from './services/report.service';
import { ToggleActiveService } from './services/toggle-active.service';

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
  imports: [PrismaModule],
  providers: [ToggleActiveService, PaginationService, ReportService],
  exports: [ToggleActiveService, PaginationService, ReportService],
})
export class CommonModule {}
