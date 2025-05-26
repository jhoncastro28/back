import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesController } from './core/sales.controller';
import { SalesService } from './core/sales.service';
import { SaleDetailsController } from './details/sale-details.controller';
import { SaleDetailsService } from './details/sale-details.service';
import { SalesReportModule } from './reports/sales-report.module';

/**
 * Module for managing sales operations and reporting
 * Includes core sales functionality, details management, and reporting
 */
@Module({
  imports: [PrismaModule, CommonModule, SalesReportModule],
  controllers: [SalesController, SaleDetailsController],
  providers: [SalesService, SaleDetailsService],
  exports: [SalesService],
})
export class SalesModule {}
