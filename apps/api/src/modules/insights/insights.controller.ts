import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { InsightsService } from './insights.service';
import { InsightsStatsService } from './insights-stats.service';
import { MarketProfessionService } from './market-profession.service';
import { InsightsSnapshotService } from './insights-snapshot.service';
import { MarketPageGateService } from './market-page-gate.service';
import { parsePage, parseLimit } from '../../common/utils/pagination';
import {
  CreateInsightFollowDto,
  InsightAnalyticsEventDto,
} from './dto/insight-article.dto';

/**
 * Public + authenticated Insights endpoints (the reader-facing API).
 *
 * Analytics ingest is intentionally public and pseudonymous: events key off a
 * random sessionKey (no IP, no device fingerprint, no personal data). When the
 * caller is authenticated the userId is attached server-side from the JWT —
 * never trusted from the body.
 */
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly statsService: InsightsStatsService,
    private readonly professionService: MarketProfessionService,
    private readonly snapshotService: InsightsSnapshotService,
    private readonly marketGateService: MarketPageGateService,
  ) {}

  @Get('articles')
  async listArticles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('profession') profession?: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.insightsService.listPublished({
      page: parsePage(page),
      limit: parseLimit(limit, 12),
      category,
      profession,
      regionId,
    });
  }

  @Get('articles/:slug')
  async getArticle(@Param('slug') slug: string) {
    return this.insightsService.getPublishedBySlug(slug);
  }

  @Get('categories')
  async getCategories() {
    return this.insightsService.getCategories();
  }

  /** Generic market teaser for anonymous visitors (no personalization, no estimates). */
  @Get('market/preview')
  async marketPreview(@Query('profession') profession?: string) {
    return this.statsService.getMarketPreview(profession);
  }

  // ==========================================================================
  // PUBLIC MARKET PAGE DATA (T11) — the /market/* page data source AND the
  // stable public data feed (Dataset contentUrl target; URL_ARCHITECTURE Δ3d +
  // AI_SEARCH_STRATEGY D2.4). Aggregate-only: reads the daily MarketSnapshot
  // rows (already sample-gated, provenance-carrying) — never per-worker or
  // per-offer data. Indexability gate: 30/20 with hysteresis (Q12/Δ4); city
  // pages additionally require an editorial sign-off.
  // ==========================================================================

  /** Profession-level page data + indexability gate for /market/{profession}. */
  @Get('market/public/:profession')
  async marketPageProfession(@Param('profession') profession: string) {
    return this.marketGateResponse(profession, null);
  }

  /** City-level page data + gate for /market/{profession}/{citySlug}. */
  @Get('market/public/:profession/:citySlug')
  async marketPageCity(
    @Param('profession') profession: string,
    @Param('citySlug') citySlug: string,
  ) {
    return this.marketGateResponse(profession, citySlug);
  }

  /**
   * Assemble the gated public payload: gate verdict + the latest snapshot's
   * aggregate blocks + provenance. Everything below `snapshot` originates
   * from the snapshot service's gated aggregation (small cells suppressed).
   */
  private async marketGateResponse(profession: string, citySlug: string | null) {
    const result = await this.marketGateService.evaluatePage(profession, citySlug);
    const data = (result.snapshotData ?? {}) as {
      salary?: unknown;
      demand?: unknown;
      skills?: unknown;
      benefits?: unknown;
      provenance?: unknown;
    };
    return {
      profession: profession.toLowerCase(),
      citySlug: citySlug ?? null,
      indexable: result.indexable,
      verdict: result.verdict,
      gate: {
        indexableMinSamples: 30,
        exitMinSamples: 20,
        hysteresisMonths: 2,
        sampleSize: result.sampleSize,
      },
      region:
        citySlug && result.snapshotData
          ? await this.regionForCitySlug(citySlug)
          : null,
      snapshot: result.snapshotData
        ? {
            date: result.snapshotDate,
            data,
          }
        : null,
    };
  }

  private async regionForCitySlug(citySlug: string) {
    const city = await this.marketGateService.findCityRegionForSlug(citySlug);
    if (!city) return null;
    return { id: city.id, name: city.name, nameEn: city.nameEn ?? null };
  }

  /** Personalized "Your Market" for workers. */
  @Get('market/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async workerMarketOverview(@Request() req: any) {
    return this.statsService.getWorkerMarketOverview(req.user.id);
  }

  /** Employer intelligence view. */
  @Get('market/employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async employerMarketView(@Request() req: any) {
    return this.statsService.getEmployerMarketView(req.user.id);
  }

  /**
   * Trend series (day / week / month / quarter / year-over-year) derived
   * from the stored MarketSnapshot rows. Aggregate-only; every point keeps
   * its own sample size and availability.
   */
  @Get('market/trends')
  async marketTrends(
    @Query('profession') profession?: string,
    @Query('regionId') regionId?: string,
    @Query('granularity') granularityQuery?: string,
  ) {
    const valid = ['day', 'week', 'month', 'quarter', 'yoy'] as const;
    const granularity = (valid as readonly string[]).includes(granularityQuery ?? '')
      ? (granularityQuery as (typeof valid)[number])
      : 'month';
    return this.snapshotService.getTrends(profession ?? '', granularity, regionId);
  }

  // --- Profession taxonomy + skill search (public reference data) ----------

  @Get('professions')
  async listProfessions(@Query('group') group?: string, @Query('search') search?: string) {
    return this.professionService.listProfessions({ group, search });
  }

  @Get('professions/groups')
  async listProfessionGroups() {
    return this.professionService.listGroups();
  }

  @Get('skills')
  async searchSkills(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.professionService.searchSkills(q, parseLimit(limit, 20));
  }

  /** Anonymous-safe analytics ingest (pseudonymous sessionKey). */
  @Post('analytics/event')
  @Throttle({ short: { ttl: 60000, limit: 120 } })
  async ingestEvent(@Body() dto: InsightAnalyticsEventDto, @Request() req: any) {
    // Optional identity: req.user is only populated when a valid JWT was sent.
    return this.insightsService.ingestEvent(dto, req.user?.id);
  }

  @Get('follows')
  @UseGuards(JwtAuthGuard)
  async listFollows(@Request() req: any) {
    return this.insightsService.listFollows(req.user.id);
  }

  @Post('follows')
  @UseGuards(JwtAuthGuard)
  async createFollow(@Body() dto: CreateInsightFollowDto, @Request() req: any) {
    return this.insightsService.createFollow(req.user.id, dto);
  }

  @Delete('follows/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFollow(@Param('id') id: string, @Request() req: any) {
    return this.insightsService.deleteFollow(req.user.id, id);
  }
}