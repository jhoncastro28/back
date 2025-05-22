import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsController } from './clients.controller';
import { MobileClientController } from './mobile-client.controller';
import { ClientsService } from './clients.service';
import { envs } from '../config/envs';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    JwtModule.register({
      secret: envs.jwt.secret,
      signOptions: {
        expiresIn: envs.jwt.expiresIn,
      },
    }),
  ],
  controllers: [ClientsController, MobileClientController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
