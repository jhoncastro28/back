import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SaleDetailsController } from './sale-details.controller';
import { SaleDetailsService } from './sale-details.service';

@Module({
  imports: [PrismaModule],
  controllers: [SaleDetailsController],
  providers: [SaleDetailsService],
  exports: [SaleDetailsService],
})
export class SaleDetailsModule {}
