import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkersModule } from './modules/workers/workers.module';
import { EmployersModule } from './modules/employers/employers.module';
import { OffersModule } from './modules/offers/offers.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    WorkersModule,
    EmployersModule,
    OffersModule,
    MessagesModule,
  ],
})
export class AppModule {}
