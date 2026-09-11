import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR_CODES } from '../../i18n/error-codes';

/**
 * MarketProfessionService — the profession taxonomy (P4) and skill search.
 *
 * The taxonomy is admin-managed reference data: adding a profession (or a
 * whole group) never requires a code change. Marketplace free-text
 * (`Worker.primaryTrade`, `InsightArticle.profession`, `InsightFollow.profession`)
 * is resolved to taxonomy entries by slug / name / EN-name / alias matching,
 * so existing strings keep working while the taxonomy fills in.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export interface UpsertProfessionDto {
  name: string;
  nameEn?: string;
  group: string;
  description?: string;
  aliases?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class MarketProfessionService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PUBLIC READS
  // ==========================================================================

  async listProfessions(params: { group?: string; search?: string; includeInactive?: boolean } = {}) {
    const where = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.group ? { group: params.group } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { nameEn: { contains: params.search, mode: 'insensitive' as const } },
              { aliases: { has: params.search.toLowerCase() } },
            ],
          }
        : {}),
    };
    return this.prisma.profession.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listGroups() {
    const rows = await this.prisma.profession.groupBy({
      by: ['group'],
      where: { isActive: true },
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ group: r.group, count: r._count._all }))
      .sort((a, b) => a.group.localeCompare(b.group));
  }

  /** Normalizes a marketplace free-text profession to a taxonomy entry. */
  async resolveProfession(input: string) {
    const normalized = input.trim().toLowerCase();
    const profession = await this.prisma.profession.findFirst({
      where: {
        OR: [
          { slug: normalized },
          { name: { equals: input.trim(), mode: 'insensitive' } },
          { nameEn: { equals: input.trim(), mode: 'insensitive' } },
          { aliases: { has: normalized } },
        ],
        isActive: true,
      },
    });
    return profession;
  }

  // ==========================================================================
  // SKILLS
  // ==========================================================================

  /** Searchable, versioned skill catalog (public, used by follows + forms). */
  async searchSkills(q?: string, limit = 20) {
    return this.prisma.skill.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nameEn: { contains: q, mode: 'insensitive' } },
                { slug: { contains: slugify(q), mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
                { subcategory: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      take: Math.min(Math.max(limit, 1), 50),
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        category: true,
        subcategory: true,
        description: true,
        usageCount: true,
        version: true,
        isCertification: true,
      },
    });
  }

  // ==========================================================================
  // ADMIN CRUD
  // ==========================================================================

  async adminList() {
    return this.prisma.profession.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async adminCreate(dto: UpsertProfessionDto) {
    const slug = slugify(dto.name);
    if (!slug) {
      throw new BadRequestException({ code: ERROR_CODES.PROFESSION_INVALID, message: 'Name cannot be slugified.' });
    }
    const existing = await this.prisma.profession.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.PROFESSION_SLUG_TAKEN,
        message: `Profession "${dto.name}" already exists.`,
        params: { slug },
      });
    }
    return this.prisma.profession.create({
      data: {
        slug,
        name: dto.name,
        nameEn: dto.nameEn,
        group: slugify(dto.group) || 'other',
        description: dto.description,
        aliases: (dto.aliases ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean),
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async adminUpdate(id: string, dto: Partial<UpsertProfessionDto>) {
    const existing = await this.prisma.profession.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: ERROR_CODES.PROFESSION_NOT_FOUND, message: 'Profession not found' });
    }
    // Meaningful definition changes bump the taxonomy version so snapshots
    // and metrics can record which definition they were computed against.
    const definitionChanged =
      (dto.name !== undefined && dto.name !== existing.name) ||
      (dto.group !== undefined && slugify(dto.group) !== existing.group) ||
      (dto.aliases !== undefined && JSON.stringify(dto.aliases) !== JSON.stringify(existing.aliases));
    return this.prisma.profession.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn } : {}),
        ...(dto.group !== undefined ? { group: slugify(dto.group) || 'other' } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.aliases !== undefined
          ? { aliases: dto.aliases.map((a) => a.trim().toLowerCase()).filter(Boolean) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(definitionChanged ? { version: existing.version + 1 } : {}),
      },
    });
  }

  /** Soft-disable: taxonomy history is never destroyed. */
  async adminDeactivate(id: string) {
    const existing = await this.prisma.profession.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: ERROR_CODES.PROFESSION_NOT_FOUND, message: 'Profession not found' });
    }
    return this.prisma.profession.update({ where: { id }, data: { isActive: false } });
  }
}