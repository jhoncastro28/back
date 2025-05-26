import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryReportsController } from './inventory-reports.controller';
import { InventoryReportsService } from './inventory-reports.service';
import { InventoryReportTransformer } from './transformers/inventory-report.transformer';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [InventoryReportsController],
  providers: [InventoryReportsService, InventoryReportTransformer],
  exports: [InventoryReportsService],
})
export class InventoryReportsModule {}
