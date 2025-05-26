import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalesReportController } from './sales-report.controller';
import { SalesReportService } from './sales-report.service';
import { SalesReportTransformer } from './transformers/sales-report.transformer';

/**
 * Module for handling sales report generation and analysis
 */
@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SalesReportController],
  providers: [SalesReportService, SalesReportTransformer],
  exports: [SalesReportService, SalesReportTransformer],
})
export class SalesReportModule {}
