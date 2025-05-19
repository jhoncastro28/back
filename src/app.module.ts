import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { CommonModule } from './common/common.module';
import { DiscountsModule } from './discounts/discounts.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { PricesModule } from './prices/prices.module';
import { ProductsModule } from './products/products.module';
import { InventoryReportsModule } from './inventory-reports/inventory-reports.module';
import { SalesModule } from './sales/sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule,
    CommonModule,
    ProductsModule,
    PricesModule,
    DiscountsModule,
    InventoryMovementsModule,
    InventoryReportsModule,
    SalesModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
