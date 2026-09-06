import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../guards/admin.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsService } from './insights.service';
import { parsePage, parseLimit } from '../../common/utils/pagination';
import {
  CreateInsightArticleDto,
  ScheduleInsightDto,
  UpdateInsightArticleDto,
  UpsertInsightSourceDto,
} from './dto/insight-article.dto';

/**
 * Insights CMS — ADMIN only (AdminGuard self-authenticates: do NOT pair with
 * JwtAuthGuard, matching the admin.controller convention). Every mutating
 * action records an AdminAction audit row.
 */
@Controller('admin/insights')
@UseGuards(AdminGuard)
@Throttle({ short: { ttl: 60000, limit: 60 } })
export class InsightsAdminController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly prisma: PrismaService,
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
    await this.audit(req.user.id, 'INSIGHT_SOURCE_CREATED', source.id);
    return source;
  }

  @Patch('sources/:id')
  async updateSource(@Param('id') id: string, @Body() dto: Partial<UpsertInsightSourceDto>, @Request() req: any) {
    const source = await this.insightsService.updateSource(id, dto);
    await this.audit(req.user.id, 'INSIGHT_SOURCE_UPDATED', id);
    return source;
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string, @Request() req: any) {
    const result = await this.insightsService.deleteSource(id);
    await this.audit(req.user.id, 'INSIGHT_SOURCE_DELETED', id);
    return result;
  }

  private async audit(actorId: string, action: string, entityId: string) {
    await this.prisma.adminAction.create({
      data: { actorId, action, entityType: 'insight_source', entityId },
    });
  }
}