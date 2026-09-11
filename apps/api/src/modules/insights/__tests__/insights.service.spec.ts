import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InsightsService } from '../insights.service';

// Hand-rolled Prisma mock (same pattern as offers.service.spec.ts).
function makePrisma() {
  return {
    insightArticle: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    insightArticleSource: { deleteMany: jest.fn(), createMany: jest.fn() },
    insightSource: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    insightFollow: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    insightAnalyticsEvent: { create: jest.fn(), findFirst: jest.fn() },
    region: { findUnique: jest.fn() },
    adminAction: { create: jest.fn() },
  };
}

function makeService(prisma: any) {
  const eventEmitter = { emit: jest.fn() } as any;
  const config = {
    getThresholds: jest.fn().mockResolvedValue({ MIN_ARTICLE_SAMPLE: 20 }),
  } as any;
  const service = new InsightsService(prisma, eventEmitter, config);
  return { service, eventEmitter };
}

describe('InsightsService — admin article lifecycle', () => {
  it('rejects a create when the slug is taken', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue({ id: 'existing', slug: 'taken' });
    const { service } = makeService(prisma);

    await expect(
      service.adminCreate(
        {
          title: 'Test',
          slug: 'taken',
          category: 'SALARY',
          summary: 'A summary long enough.',
          content: 'Content body long enough.',
          dataClass: 'EDITORIAL',
        } as any,
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses publishing a non-editorial insight below the minimum sample size', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue({
      id: 'a1',
      deletedAt: null,
      dataClass: 'OFFERMARKT',
      sampleSize: 12,
      dataPeriodStart: new Date('2026-07-01'),
      dataPeriodEnd: new Date('2026-08-31'),
    });
    prisma.insightArticle.update.mockResolvedValue({ id: 'a1', status: 'PUBLISHED' });
    const { service } = makeService(prisma);

    await expect(service.adminPublish('a1', 'admin-1')).rejects.toThrow(BadRequestException);
    expect(prisma.insightArticle.update).not.toHaveBeenCalled();
  });

  it('refuses publishing a non-editorial insight without a data period', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue({
      id: 'a1',
      deletedAt: null,
      dataClass: 'OFFICIAL',
      sampleSize: 500,
      dataPeriodStart: null,
      dataPeriodEnd: null,
    });
    const { service } = makeService(prisma);

    await expect(service.adminPublish('a1', 'admin-1')).rejects.toThrow(BadRequestException);
  });

  it('publishes an editorial insight without sample-size requirements and emits fan-out', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue({
      id: 'a1',
      deletedAt: null,
      dataClass: 'EDITORIAL',
      slug: 'editorial',
      title: 'Editorial',
      category: 'CAREER',
      profession: null,
      skills: [],
      sampleSize: null,
    });
    prisma.insightArticle.update.mockResolvedValue({
      id: 'a1',
      slug: 'editorial',
      title: 'Editorial',
      category: 'CAREER',
      profession: null,
      skills: [],
      status: 'PUBLISHED',
    });
    prisma.insightFollow.findMany.mockResolvedValue([]);
    const { service, eventEmitter } = makeService(prisma);

    const result = await service.adminPublish('a1', 'admin-1');
    expect(result.status).toBe('PUBLISHED');
    expect(prisma.insightArticle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PUBLISHED' }) }),
    );
  });

  it('throws NotFound when the article does not exist', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue(null);
    const { service } = makeService(prisma);

    await expect(service.adminPublish('missing', 'admin-1')).rejects.toThrow(NotFoundException);
  });
});

describe('InsightsService — follows', () => {
  it('refuses a follow with no profession, region or skill', async () => {
    const prisma = makePrisma();
    const { service } = makeService(prisma);

    await expect(service.createFollow('u1', {})).rejects.toThrow(BadRequestException);
  });

  it('creates a follow with a profession', async () => {
    const prisma = makePrisma();
    prisma.insightFollow.create.mockResolvedValue({ id: 'f1', userId: 'u1', profession: 'ELECTRICIAN' });
    const { service } = makeService(prisma);

    const follow = await service.createFollow('u1', { profession: 'ELECTRICIAN' });
    expect(follow.id).toBe('f1');
    expect(prisma.insightFollow.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', profession: 'ELECTRICIAN' }) }),
    );
  });
});

describe('InsightsService — analytics ingest', () => {
  it('rejects events for unknown articles', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue(null);
    const { service } = makeService(prisma);

    await expect(
      service.ingestEvent({ sessionKey: 'session-abc123', eventType: 'ARTICLE_VIEW', articleId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('counts a unique reader only for the first session event and increments the counter', async () => {
    const prisma = makePrisma();
    prisma.insightArticle.findFirst.mockResolvedValue({ id: 'a1', slug: 's' });
    prisma.insightAnalyticsEvent.findFirst.mockResolvedValue(null);
    prisma.insightAnalyticsEvent.create.mockResolvedValue({});
    prisma.insightArticle.update.mockResolvedValue({});
    const { service } = makeService(prisma);

    const result = await service.ingestEvent(
      { sessionKey: 'session-abc123', eventType: 'UNIQUE_READER', articleId: 'a1' },
      'user-1',
    );
    expect(result.accepted).toBe(true);
    expect(result.counted).toBe(true);
    expect(prisma.insightAnalyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sessionKey: 'session-abc123', userId: 'user-1', eventType: 'UNIQUE_READER' }),
      }),
    );
    expect(prisma.insightArticle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { uniqueReaderCount: 1 } }),
    );
  });
});