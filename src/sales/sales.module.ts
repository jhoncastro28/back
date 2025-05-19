import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SaleDetailsController } from './sale-details.controller';
import { SaleDetailsService } from './sale-details.service';
import { SalesReportController } from './sales-report.controller';
import { SalesReportService } from './sales-report.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SalesController, SaleDetailsController, SalesReportController],
  providers: [SalesService, SaleDetailsService, SalesReportService],
  exports: [SalesService, SaleDetailsService, SalesReportService],
})
export class SalesModule {}
