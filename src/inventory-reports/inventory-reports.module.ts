import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryReportsController } from './inventory-reports.controller';
import { InventoryReportsService } from './inventory-reports.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryReportsController],
  providers: [InventoryReportsService],
  exports: [InventoryReportsService],
})
export class InventoryReportsModule {}
