import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ERROR_CODES } from '../../i18n/error-codes';
import { MAX_PUBLISH_FANOUT } from './insights-settings';
import { InsightsConfigService } from './insights-config.service';
import {
  CreateInsightArticleDto,
  UpdateInsightArticleDto,
  UpsertInsightSourceDto,
} from './dto/insight-article.dto';
import { NotificationEventType } from '../notifications/notification.types';

/**
 * Insights content service: articles (CMS lifecycle), sources, follows,
 * analytics ingest and the publish fan-out to followers.
 *
 * Lifecycle: DRAFT → SCHEDULED → PUBLISHED ⇄ UNPUBLISHED → ARCHIVED.
 * Scheduled articles publish automatically once publishAt <= now; the sweep
 * runs cheaply at the top of every public/admin list read.
 */
const CATEGORIES = ['SALARY', 'DEMAND', 'EMPLOYER', 'INDUSTRY', 'CAREER'] as const;

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: InsightsConfigService,
  ) {}

  // ==========================================================================
  // PUBLIC READS
  // ==========================================================================

  async listPublished(params: {
    page: number;
    limit: number;
    category?: string;
    profession?: string;
    regionId?: string;
  }) {
    await this.publishDueScheduled();
    const where = {
      status: 'PUBLISHED' as const,
      deletedAt: null,
      ...(params.category && (CATEGORIES as readonly string[]).includes(params.category)
        ? { category: params.category as any }
        : {}),
      ...(params.profession
        ? { profession: { equals: params.profession, mode: 'insensitive' as const } }
        : {}),
      ...(params.regionId ? { regionId: params.regionId } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.insightArticle.count({ where }),
      this.prisma.insightArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: this.publicCardSelect(),
      }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getPublishedBySlug(slug: string) {
    await this.publishDueScheduled();
    const article = await this.prisma.insightArticle.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        region: { select: { id: true, name: true, nameEn: true } },
        author: { select: { firstName: true, lastName: true } },
        sources: {
          orderBy: { order: 'asc' },
          include: { source: true },
        },
      },
    });
    if (!article) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_NOT_FOUND,
        message: 'Insight not found',
      });
    }
    // Strip internals; the public shape is the CMS shape minus admin-only bits.
    const { authorId, deletedAt, registerClickCount, registrationCount, ...publicArticle } = article;
    void authorId;
    void deletedAt;
    void registerClickCount;
    void registrationCount;
    return {
      ...publicArticle,
      authorName:
        article.authorName ??
        [article.author?.firstName, article.author?.lastName].filter(Boolean).join(' ') ??
        'Offermarket Editorial',
    };
  }

  async getCategories() {
    await this.publishDueScheduled();
    const counts = await this.prisma.insightArticle.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED', deletedAt: null },
      _count: { _all: true },
    });
    return CATEGORIES.map((category) => ({
      category,
      count: counts.find((c) => c.category === category)?._count._all ?? 0,
    }));
  }

  // ==========================================================================
  // ADMIN CMS
  // ==========================================================================

  async adminList(params: { page: number; limit: number; status?: string; category?: string }) {
    await this.publishDueScheduled();
    const where = {
      deletedAt: null,
      ...(params.status && (['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as string[]).includes(params.status)
        ? { status: params.status as any }
        : {}),
      ...(params.category && (CATEGORIES as readonly string[]).includes(params.category)
        ? { category: params.category as any }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.insightArticle.count({ where }),
      this.prisma.insightArticle.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          region: { select: { name: true } },
          _count: { select: { sources: true } },
        },
      }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async adminGet(id: string) {
    const article = await this.prisma.insightArticle.findFirst({
      where: { id, deletedAt: null },
      include: {
        region: { select: { id: true, name: true } },
        sources: { orderBy: { order: 'asc' }, include: { source: true } },
      },
    });
    if (!article) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_NOT_FOUND,
        message: 'Insight not found',
      });
    }
    return article;
  }

  async adminCreate(dto: CreateInsightArticleDto, adminId: string) {
    await this.assertSlugAvailable(dto.slug);
    const article = await this.prisma.insightArticle.create({
      data: {
        ...dto,
        dataPeriodStart: dto.dataPeriodStart ? new Date(dto.dataPeriodStart) : undefined,
        dataPeriodEnd: dto.dataPeriodEnd ? new Date(dto.dataPeriodEnd) : undefined,
        authorId: adminId,
        status: 'DRAFT',
      },
    });
    await this.replaceSources(article.id, dto.sourceIds ?? []);
    await this.audit(adminId, 'INSIGHT_ARTICLE_CREATED', article.id);
    return this.adminGet(article.id);
  }

  async adminUpdate(id: string, dto: UpdateInsightArticleDto, adminId: string) {
    const existing = await this.prisma.insightArticle.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_NOT_FOUND,
        message: 'Insight not found',
      });
    }
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug);
    }
    await this.prisma.insightArticle.update({
      where: { id },
      data: {
        ...dto,
        dataPeriodStart: dto.dataPeriodStart ? new Date(dto.dataPeriodStart) : undefined,
        dataPeriodEnd: dto.dataPeriodEnd ? new Date(dto.dataPeriodEnd) : undefined,
      },
    });
    if (dto.sourceIds) await this.replaceSources(id, dto.sourceIds);
    await this.audit(adminId, 'INSIGHT_ARTICLE_UPDATED', id);
    return this.adminGet(id);
  }

  async adminSchedule(id: string, publishAt: Date, adminId: string) {
    const article = await this.getForTransition(id);
    if (article.status === 'PUBLISHED') {
      throw new BadRequestException({
        code: ERROR_CODES.INSIGHT_INVALID_TRANSITION,
        message: 'Unpublish before scheduling.',
      });
    }
    const updated = await this.prisma.insightArticle.update({
      where: { id },
      data: { status: 'SCHEDULED', publishAt, publishedAt: null },
    });
    await this.audit(adminId, 'INSIGHT_ARTICLE_SCHEDULED', id, { publishAt });
    return updated;
  }

  async adminPublish(id: string, adminId: string) {
    const article = await this.getForTransition(id);
    await this.validateForPublish(article);
    const updated = await this.prisma.insightArticle.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), publishAt: null },
    });
    await this.audit(adminId, 'INSIGHT_ARTICLE_PUBLISHED', id);
    this.fanOutToFollowers(updated).catch((err) =>
      this.logger.error(`Publish fan-out failed for ${id}`, err),
    );
    return updated;
  }

  async adminUnpublish(id: string, adminId: string) {
    await this.getForTransition(id);
    const updated = await this.prisma.insightArticle.update({
      where: { id },
      data: { status: 'UNPUBLISHED', publishAt: null },
    });
    await this.audit(adminId, 'INSIGHT_ARTICLE_UNPUBLISHED', id);
    return updated;
  }

  async adminArchive(id: string, adminId: string) {
    await this.getForTransition(id);
    const updated = await this.prisma.insightArticle.update({
      where: { id },
      data: { status: 'ARCHIVED', publishAt: null },
    });
    await this.audit(adminId, 'INSIGHT_ARTICLE_ARCHIVED', id);
    return updated;
  }

  async adminDelete(id: string, adminId: string) {
    await this.getForTransition(id);
    await this.prisma.insightArticle.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await this.audit(adminId, 'INSIGHT_ARTICLE_DELETED', id);
    return { deleted: true };
  }

  // ==========================================================================
  // SOURCES
  // ==========================================================================

  async listSources() {
    return this.prisma.insightSource.findMany({ orderBy: { name: 'asc' } });
  }

  async createSource(dto: UpsertInsightSourceDto) {
    return this.prisma.insightSource.create({
      data: {
        ...dto,
        sourceType: dto.sourceType as any,
        publicationDate: dto.publicationDate ? new Date(dto.publicationDate) : undefined,
        dataDate: dto.dataDate ? new Date(dto.dataDate) : undefined,
      },
    });
  }

  async updateSource(id: string, dto: Partial<UpsertInsightSourceDto>) {
    const source = await this.prisma.insightSource.findUnique({ where: { id } });
    if (!source) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_SOURCE_NOT_FOUND,
        message: 'Source not found',
      });
    }
    return this.prisma.insightSource.update({
      where: { id },
      data: {
        ...dto,
        sourceType: dto.sourceType as any,
        publicationDate: dto.publicationDate ? new Date(dto.publicationDate) : undefined,
        dataDate: dto.dataDate ? new Date(dto.dataDate) : undefined,
      },
    });
  }

  async deleteSource(id: string) {
    const source = await this.prisma.insightSource.findUnique({ where: { id } });
    if (!source) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_SOURCE_NOT_FOUND,
        message: 'Source not found',
      });
    }
    await this.prisma.insightSource.delete({ where: { id } });
    return { deleted: true };
  }

  // ==========================================================================
  // FOLLOWS
  // ==========================================================================

  async listFollows(userId: string) {
    return this.prisma.insightFollow.findMany({
      where: { userId },
      include: { region: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFollow(
    userId: string,
    dto: { profession?: string; regionId?: string; skillSlug?: string; notifyEmail?: boolean },
  ) {
    if (!dto.profession && !dto.regionId && !dto.skillSlug) {
      throw new BadRequestException({
        code: ERROR_CODES.INSIGHT_FOLLOW_EMPTY,
        message: 'Follow at least one of profession, region or skill.',
      });
    }
    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
      if (!region) {
        throw new NotFoundException({
          code: ERROR_CODES.INSIGHT_REGION_NOT_FOUND,
          message: 'Region not found',
        });
      }
    }
    return this.prisma.insightFollow.create({
      data: {
        userId,
        profession: dto.profession,
        regionId: dto.regionId,
        skillSlug: dto.skillSlug,
        notifyEmail: dto.notifyEmail ?? true,
      },
      include: { region: { select: { id: true, name: true } } },
    });
  }

  async deleteFollow(userId: string, id: string) {
    const follow = await this.prisma.insightFollow.findUnique({ where: { id } });
    if (!follow || follow.userId !== userId) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_FOLLOW_NOT_FOUND,
        message: 'Follow not found',
      });
    }
    await this.prisma.insightFollow.delete({ where: { id } });
    return { deleted: true };
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  async ingestEvent(
    dto: {
      sessionKey: string;
      eventType: string;
      articleId?: string;
      path?: string;
      referrer?: string;
      locale?: string;
    },
    userId?: string,
  ) {
    // The article must exist and be published for article-scoped events.
    if (dto.articleId) {
      const article = await this.prisma.insightArticle.findFirst({
        where: { id: dto.articleId, status: 'PUBLISHED', deletedAt: null },
        select: { id: true, slug: true, category: true, title: true, profession: true },
      });
      if (!article) {
        throw new NotFoundException({
          code: ERROR_CODES.INSIGHT_NOT_FOUND,
          message: 'Insight not found',
        });
      }
    }

    // Unique-reader / returning-reader resolution happens per (sessionKey, article).
    const isFirstSessionEvent = await this.isFirstEventForSession(dto.sessionKey, dto.articleId, dto.eventType);
    const resolvedType = dto.eventType as any;

    await this.prisma.insightAnalyticsEvent.create({
      data: {
        sessionKey: dto.sessionKey,
        userId: userId ?? null,
        articleId: dto.articleId ?? null,
        eventType: resolvedType,
        path: dto.path,
        referrer: dto.referrer,
        locale: dto.locale,
      },
    });

    // Maintain durable aggregate counters on the article row.
    const counterInc: Record<string, number> = {};
    if (dto.articleId) {
      if (resolvedType === 'ARTICLE_VIEW') counterInc['viewCount'] = 1;
      if (resolvedType === 'UNIQUE_READER' && isFirstSessionEvent) counterInc['uniqueReaderCount'] = 1;
      if (resolvedType === 'SHARE') counterInc['shareCount'] = 1;
      if (resolvedType === 'REGISTER_CLICK') counterInc['registerClickCount'] = 1;
      if (resolvedType === 'WORKER_REGISTER' || resolvedType === 'EMPLOYER_REGISTER') {
        counterInc['registrationCount'] = 1;
      }
      if (Object.keys(counterInc).length > 0) {
        await this.prisma.insightArticle.update({
          where: { id: dto.articleId },
          data: counterInc,
        });
      }
    }

    return { accepted: true, counted: Object.keys(counterInc).length > 0 };
  }

  private async isFirstEventForSession(sessionKey: string, articleId?: string, eventType?: string) {
    const existing = await this.prisma.insightAnalyticsEvent.findFirst({
      where: {
        sessionKey,
        ...(articleId ? { articleId } : {}),
        ...(eventType ? { eventType: eventType as any } : {}),
      },
      select: { id: true },
    });
    return !existing;
  }

  // ==========================================================================
  // INTERNALS
  // ==========================================================================

  /** Publishes any SCHEDULED article whose publishAt has passed. Cheap sweep. */
  private async publishDueScheduled() {
    const due = await this.prisma.insightArticle.findMany({
      where: { status: 'SCHEDULED', publishAt: { lte: new Date() }, deletedAt: null },
      select: { id: true, title: true, slug: true, category: true, profession: true, skills: true, regionId: true, sampleSize: true, dataClass: true, dataPeriodStart: true, dataPeriodEnd: true, statistics: true },
    });
    for (const article of due) {
      try {
        await this.validateForPublish(article as any);
        const updated = await this.prisma.insightArticle.update({
          where: { id: article.id },
          data: { status: 'PUBLISHED', publishedAt: new Date(), publishAt: null },
        });
        this.fanOutToFollowers(updated).catch((err) =>
          this.logger.error(`Scheduled fan-out failed for ${article.id}`, err),
        );
      } catch (err) {
        // A scheduled article that fails validation stays SCHEDULED (visible in
        // the admin list with its validation error) rather than silently dying.
        this.logger.warn(
          `Scheduled insight ${article.id} failed publish validation: ${(err as Error).message}`,
        );
      }
    }
  }

  /** Publish-time validator: the data-integrity contract (§10 of the doc). */
  private async validateForPublish(article: {
    dataClass: string;
    sampleSize?: number | null;
    statistics?: unknown;
    dataPeriodStart?: Date | null;
    dataPeriodEnd?: Date | null;
  }) {
    if (article.dataClass !== 'EDITORIAL') {
      const minSample = (await this.config.getThresholds()).MIN_ARTICLE_SAMPLE;
      const sample = article.sampleSize ?? 0;
      if (sample < minSample) {
        throw new BadRequestException({
          code: ERROR_CODES.INSIGHT_SAMPLE_TOO_SMALL,
          message: `Non-editorial insights require a sampleSize of at least ${minSample}; got ${sample}.`,
          params: { minSample, sample },
        });
      }
      if (!article.dataPeriodStart || !article.dataPeriodEnd) {
        throw new BadRequestException({
          code: ERROR_CODES.INSIGHT_DATA_PERIOD_REQUIRED,
          message: 'Data-driven insights must declare their data period.',
        });
      }
      if (article.dataPeriodEnd > new Date()) {
        throw new BadRequestException({
          code: ERROR_CODES.INSIGHT_DATA_PERIOD_REQUIRED,
          message: 'Data period cannot end in the future.',
        });
      }
    }
  }

  /** Notifies followers whose profession / region / skill matches the article. */
  private async fanOutToFollowers(article: {
    id: string;
    slug: string;
    title: string;
    category: string;
    profession?: string | null;
    skills: string[];
    regionId?: string | null;
  }) {
    const follows = await this.prisma.insightFollow.findMany({
      where: {
        OR: [
          ...(article.profession
            ? [{ profession: { equals: article.profession, mode: 'insensitive' as const } }]
            : []),
          ...(article.regionId ? [{ regionId: article.regionId }] : []),
          ...(article.skills.length ? [{ skillSlug: { in: article.skills } }] : []),
        ],
      },
      select: { userId: true },
      take: MAX_PUBLISH_FANOUT,
    });
    const userIds = [...new Set(follows.map((f) => f.userId))];
    for (const userId of userIds) {
      this.eventEmitter.emit(NotificationEventType.INSIGHT_PUBLISHED, {
        recipientUserId: userId,
        actionUrl: `/insights/${article.slug}`,
        articleId: article.id,
        articleTitle: article.title,
        articleSlug: article.slug,
        category: article.category,
        profession: article.profession ?? undefined,
      });
    }
    if (userIds.length > 0) {
      this.logger.log(`Insight ${article.slug} fan-out: ${userIds.length} followers notified`);
    }
  }

  private async getForTransition(id: string) {
    const article = await this.prisma.insightArticle.findFirst({ where: { id, deletedAt: null } });
    if (!article) {
      throw new NotFoundException({
        code: ERROR_CODES.INSIGHT_NOT_FOUND,
        message: 'Insight not found',
      });
    }
    return article;
  }

  private async assertSlugAvailable(slug: string) {
    const existing = await this.prisma.insightArticle.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException({
        code: ERROR_CODES.INSIGHT_SLUG_TAKEN,
        message: `Slug "${slug}" is already in use.`,
        params: { slug },
      });
    }
  }

  private async replaceSources(articleId: string, sourceIds: string[]) {
    await this.prisma.insightArticleSource.deleteMany({ where: { articleId } });
    if (sourceIds.length > 0) {
      await this.prisma.insightArticleSource.createMany({
        data: sourceIds.map((sourceId, order) => ({ articleId, sourceId, order })),
      });
    }
  }

  private async audit(actorId: string, action: string, entityId: string, details?: any) {
    await this.prisma.adminAction.create({
      data: { actorId, action, entityType: 'insight_article', entityId, details },
    });
  }

  private publicCardSelect() {
    return {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      profession: true,
      skills: true,
      dataClass: true,
      sampleSize: true,
      dataPeriodStart: true,
      dataPeriodEnd: true,
      publishedAt: true,
      lastUpdatedAt: true,
      viewCount: true,
      uniqueReaderCount: true,
      shareCount: true,
    } as const;
  }
}