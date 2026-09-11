import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../guards/admin.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsService } from './insights.service';
import { InsightsConfigService } from './insights-config.service';
import { InsightsDashboardService } from './insights-dashboard.service';
import { InsightsGeneratorService } from './insights-generator.service';
import { InsightsSnapshotService } from './insights-snapshot.service';
import { MarketProfessionService } from './market-profession.service';
import { parsePage, parseLimit } from '../../common/utils/pagination';
import {
  CreateInsightArticleDto,
  ScheduleInsightDto,
  UpdateInsightArticleDto,
  UpdateInsightsGeneratorConfigDto,
  UpdateInsightsThresholdsDto,
  UpdateProfessionApiDto,
  UpsertInsightSourceDto,
  UpsertProfessionApiDto,
} from './dto/insight-article.dto';

/**
 * Insights CMS + Market Intelligence administration — ADMIN only (AdminGuard
 * self-authenticates: do NOT pair with JwtAuthGuard, matching the
 * admin.controller convention). Every mutating action records an AdminAction
 * audit row.
 */
@Controller('admin/insights')
@UseGuards(AdminGuard)
@Throttle({ short: { ttl: 60000, limit: 60 } })
export class InsightsAdminController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly prisma: PrismaService,
    private readonly configService: InsightsConfigService,
    private readonly dashboardService: InsightsDashboardService,
    private readonly generatorService: InsightsGeneratorService,
    private readonly snapshotService: InsightsSnapshotService,
    private readonly professionService: MarketProfessionService,
  ) {}

  // --- Articles -----------------------------------------------------------

  @Get('articles')
  async listArticles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.insightsService.adminList({
      page: parsePage(page),
      limit: parseLimit(limit, 20),
      status,
      category,
    });
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    return this.insightsService.adminGet(id);
  }

  @Post('articles')
  async createArticle(@Body() dto: CreateInsightArticleDto, @Request() req: any) {
    return this.insightsService.adminCreate(dto, req.user.id);
  }

  @Patch('articles/:id')
  async updateArticle(@Param('id') id: string, @Body() dto: UpdateInsightArticleDto, @Request() req: any) {
    return this.insightsService.adminUpdate(id, dto, req.user.id);
  }

  @Post('articles/:id/schedule')
  async scheduleArticle(@Param('id') id: string, @Body() dto: ScheduleInsightDto, @Request() req: any) {
    return this.insightsService.adminSchedule(id, new Date(dto.publishAt), req.user.id);
  }

  @Post('articles/:id/publish')
  async publishArticle(@Param('id') id: string, @Request() req: any) {
    return this.insightsService.adminPublish(id, req.user.id);
  }

  @Post('articles/:id/unpublish')
  async unpublishArticle(@Param('id') id: string, @Request() req: any) {
    return this.insightsService.adminUnpublish(id, req.user.id);
  }

  @Post('articles/:id/archive')
  async archiveArticle(@Param('id') id: string, @Request() req: any) {
    return this.insightsService.adminArchive(id, req.user.id);
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string, @Request() req: any) {
    return this.insightsService.adminDelete(id, req.user.id);
  }

  // --- Sources ------------------------------------------------------------

  @Get('sources')
  async listSources() {
    return this.insightsService.listSources();
  }

  @Post('sources')
  async createSource(@Body() dto: UpsertInsightSourceDto, @Request() req: any) {
    const source = await this.insightsService.createSource(dto);
    await this.audit(req.user.id, 'INSIGHT_SOURCE_CREATED', 'insight_source', source.id);
    return source;
  }

  @Patch('sources/:id')
  async updateSource(@Param('id') id: string, @Body() dto: Partial<UpsertInsightSourceDto>, @Request() req: any) {
    const source = await this.insightsService.updateSource(id, dto);
    await this.audit(req.user.id, 'INSIGHT_SOURCE_UPDATED', 'insight_source', id);
    return source;
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string, @Request() req: any) {
    const result = await this.insightsService.deleteSource(id);
    await this.audit(req.user.id, 'INSIGHT_SOURCE_DELETED', 'insight_source', id);
    return result;
  }

  // --- Market Intelligence: dashboard ---------------------------------------

  @Get('market/dashboard')
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }

  // --- Market Intelligence: thresholds (statistical safeguards) -------------

  @Get('market/thresholds')
  async getThresholds() {
    return this.configService.getThresholds();
  }

  @Put('market/thresholds')
  async updateThresholds(@Body() dto: UpdateInsightsThresholdsDto, @Request() req: any) {
    const thresholds = await this.configService.updateThresholds(dto);
    await this.audit(req.user.id, 'INSIGHT_THRESHOLDS_UPDATED', 'admin_settings', 'insights.thresholds');
    return thresholds;
  }

  // --- Market Intelligence: generator config + run-now ----------------------

  @Get('market/generator-config')
  async getGeneratorConfig() {
    return this.configService.getGeneratorConfig();
  }

  @Put('market/generator-config')
  async updateGeneratorConfig(@Body() dto: UpdateInsightsGeneratorConfigDto, @Request() req: any) {
    const config = await this.configService.updateGeneratorConfig(dto);
    await this.audit(req.user.id, 'INSIGHT_GENERATOR_CONFIG_UPDATED', 'admin_settings', 'insights.generator');
    return config;
  }

  /** Run the draft generator on demand (same rules as the nightly cron). */
  @Post('market/generate')
  async runGenerator(@Request() req: any) {
    const result = await this.generatorService.generateDrafts();
    await this.audit(req.user.id, 'INSIGHT_GENERATOR_RUN', 'insight_generator', 'manual');
    return result;
  }

  // --- Market Intelligence: snapshots (data provenance inspection) ----------

  @Get('market/snapshots')
  async listSnapshots(
    @Query('profession') profession?: string,
    @Query('regionId') regionId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshotService.listSnapshots(profession, regionId, parsePage(page), parseLimit(limit, 20));
  }

  @Get('market/snapshots/:id')
  async getSnapshot(@Param('id') id: string) {
    return this.snapshotService.getSnapshot(id);
  }

  // --- Profession taxonomy CRUD ---------------------------------------------

  @Get('professions')
  async adminListProfessions() {
    return this.professionService.adminList();
  }

  @Post('professions')
  async createProfession(@Body() dto: UpsertProfessionApiDto, @Request() req: any) {
    const profession = await this.professionService.adminCreate(dto);
    await this.audit(req.user.id, 'PROFESSION_CREATED', 'profession', profession.id);
    return profession;
  }

  @Patch('professions/:id')
  async updateProfession(@Param('id') id: string, @Body() dto: UpdateProfessionApiDto, @Request() req: any) {
    const profession = await this.professionService.adminUpdate(id, dto);
    await this.audit(req.user.id, 'PROFESSION_UPDATED', 'profession', id);
    return profession;
  }

  @Delete('professions/:id')
  async deactivateProfession(@Param('id') id: string, @Request() req: any) {
    const profession = await this.professionService.adminDeactivate(id);
    await this.audit(req.user.id, 'PROFESSION_DEACTIVATED', 'profession', id);
    return profession;
  }

  private async audit(actorId: string, action: string, entityType: string, entityId: string) {
    await this.prisma.adminAction.create({
      data: { actorId, action, entityType, entityId },
    });
  }
}