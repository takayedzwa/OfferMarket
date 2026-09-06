import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InsightsController } from './insights.controller';
import { InsightsAdminController } from './insights-admin.controller';
import { InsightsService } from './insights.service';
import { InsightsStatsService } from './insights-stats.service';

/**
 * Offermarket Insights — labor-market intelligence module.
 *
 * Exports InsightsStatsService so AuthModule can attach insight-attributed
 * registration events later (reader → registration is the north-star funnel).
 */
@Module({
  imports: [PrismaModule],
  controllers: [InsightsController, InsightsAdminController],
  providers: [InsightsService, InsightsStatsService],
  exports: [InsightsService, InsightsStatsService],
})
export class InsightsModule {}