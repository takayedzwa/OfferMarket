import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InsightsController } from './insights.controller';
import { InsightsAdminController } from './insights-admin.controller';
import { InsightsService } from './insights.service';
import { InsightsStatsService } from './insights-stats.service';
import { InsightsConfigService } from './insights-config.service';
import { MarketAggregationService } from './market-aggregation.service';
import { InsightsSnapshotService } from './insights-snapshot.service';
import { InsightsGeneratorService } from './insights-generator.service';
import { MarketProfessionService } from './market-profession.service';
import { InsightsDashboardService } from './insights-dashboard.service';

/**
 * Offermarket Insights — labor-market intelligence module.
 *
 * Layers:
 *   InsightsConfigService    — admin-configurable integrity thresholds (P2)
 *   MarketAggregationService — dimension-parameterized aggregation engine (P1)
 *   InsightsSnapshotService  — nightly MarketSnapshot writer + trend service (P3)
 *   MarketProfessionService  — profession taxonomy resolution + skill search (P4)
 *   InsightsGeneratorService — auto-draft insights (always DRAFT, admin-reviewed) (P6)
 *   InsightsDashboardService — admin Market Intelligence dashboard aggregates (P7)
 *
 * Exports InsightsStatsService so AuthModule can attach insight-attributed
 * registration events later (reader → registration is the north-star funnel).
 */
@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [InsightsController, InsightsAdminController],
  providers: [
    InsightsService,
    InsightsStatsService,
    InsightsConfigService,
    MarketAggregationService,
    InsightsSnapshotService,
    InsightsGeneratorService,
    MarketProfessionService,
    InsightsDashboardService,
  ],
  exports: [InsightsService, InsightsStatsService],
})
export class InsightsModule {}