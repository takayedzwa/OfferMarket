import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { RetentionService } from './retention.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [PrivacyController],
  providers: [PrivacyService, RetentionService],
  exports: [PrivacyService, RetentionService],
})
export class PrivacyModule {}