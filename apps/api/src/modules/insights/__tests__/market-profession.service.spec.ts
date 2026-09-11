import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MarketProfessionService } from '../market-profession.service';

function makePrisma() {
  return {
    profession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new', ...data })),
      update: jest.fn().mockImplementation(({ data, where }) => Promise.resolve({ id: where?.id ?? 'p1', ...data })),
    },
    skill: { findMany: jest.fn() },
  };
}

describe('MarketProfessionService — public reads', () => {
  it('hides inactive professions by default and filters by group/search', async () => {
    const prisma = makePrisma();
    const service = new MarketProfessionService(prisma as any);

    await service.listProfessions({ group: 'technical', search: 'weld' });

    const where = prisma.profession.findMany.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.group).toBe('technical');
    expect(where.OR).toBeDefined();
  });

  it('resolves a free-text profession by name, EN name or alias', async () => {
    const prisma = makePrisma();
    const service = new MarketProfessionService(prisma as any);

    await service.resolveProfession('  Electrician ');
    let where = prisma.profession.findFirst.mock.calls[0][0].where;
    expect(where.OR[0]).toEqual({ slug: 'electrician' });
    expect(where.isActive).toBe(true);
  });

  it('lists taxonomy groups with counts, sorted', async () => {
    const prisma = makePrisma();
    prisma.profession.groupBy.mockResolvedValue([
      { group: 'transport', _count: { _all: 2 } },
      { group: 'technical', _count: { _all: 5 } },
    ]);
    const service = new MarketProfessionService(prisma as any);

    const groups = await service.listGroups();
    expect(groups).toEqual([
      { group: 'technical', count: 5 },
      { group: 'transport', count: 2 },
    ]);
  });

  it('caps skill search at 50 and sorts by usage', async () => {
    const prisma = makePrisma();
    const service = new MarketProfessionService(prisma as any);

    await service.searchSkills('welding', 999);
    const args = prisma.skill.findMany.mock.calls[0][0];
    expect(args.take).toBe(50);
    expect(args.orderBy).toEqual([{ usageCount: 'desc' }, { name: 'asc' }]);
    expect(args.select.version).toBe(true);
  });
});

describe('MarketProfessionService — admin CRUD', () => {
  it('creates with a slugified name and normalized group + aliases', async () => {
    const prisma = makePrisma();
    prisma.profession.findUnique.mockResolvedValue(null);
    const service = new MarketProfessionService(prisma as any);

    await service.adminCreate({
      name: 'HVAC Technician',
      group: 'Technical Trades',
      aliases: ['  Heat Pump Installer  ', ''],
    });

    const data = prisma.profession.create.mock.calls[0][0].data;
    expect(data.slug).toBe('hvac-technician');
    expect(data.group).toBe('technical-trades');
    expect(data.aliases).toEqual(['heat pump installer']);
  });

  it('rejects a duplicate slug with PROFESSION_SLUG_TAKEN', async () => {
    const prisma = makePrisma();
    prisma.profession.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new MarketProfessionService(prisma as any);

    await expect(service.adminCreate({ name: 'Electrician', group: 'technical' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects a name that cannot be slugified', async () => {
    const prisma = makePrisma();
    const service = new MarketProfessionService(prisma as any);

    await expect(service.adminCreate({ name: '///', group: 'technical' })).rejects.toThrow(BadRequestException);
  });

  it('bumps the taxonomy version only when the definition changes', async () => {
    const prisma = makePrisma();
    prisma.profession.findUnique.mockResolvedValue({ id: 'p1', name: 'Electrician', group: 'technical', aliases: [], version: 2 });
    const service = new MarketProfessionService(prisma as any);

    await service.adminUpdate('p1', { description: 'new copy' });
    let data = prisma.profession.update.mock.calls[0][0].data;
    expect(data.version).toBeUndefined();

    await service.adminUpdate('p1', { name: 'Installation Electrician' });
    data = prisma.profession.update.mock.calls[1][0].data;
    expect(data.version).toBe(3);
    expect(data.name).toBe('Installation Electrician');
  });

  it('throws PROFESSION_NOT_FOUND for an unknown id', async () => {
    const prisma = makePrisma();
    prisma.profession.findUnique.mockResolvedValue(null);
    const service = new MarketProfessionService(prisma as any);

    await expect(service.adminUpdate('missing', {})).rejects.toThrow(NotFoundException);
    await expect(service.adminDeactivate('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft-disables instead of deleting', async () => {
    const prisma = makePrisma();
    prisma.profession.findUnique.mockResolvedValue({ id: 'p1', isActive: true });
    const service = new MarketProfessionService(prisma as any);

    const result = await service.adminDeactivate('p1');
    expect(prisma.profession.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { isActive: false } });
    expect(result.isActive).toBe(false);
  });
});