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

@Module({
  imports: [
    AuthModule,
    ClientsModule,
    CommonModule,
    ProductsModule,
    PricesModule,
    DiscountsModule,
    InventoryMovementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
