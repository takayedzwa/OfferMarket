import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ResolveRegionDto {
  countryCode: string;
  countryName?: string;
  provinceCode: string;
  provinceName: string;
  cityName: string;
  cityLatitude?: string;
  cityLongitude?: string;
}

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve a location (country + province + city) to Region records.
   * Finds or creates Country, Province, and City records linked via parentId.
   * Returns the City record's ID for storing as worker.regionId.
   */
  async resolveOrCreateRegion(dto: ResolveRegionDto): Promise<{ id: string; name: string; type: string; parentId: string | null }> {
    const countryName = dto.countryName || dto.countryCode;

    // 1. Find or create Country
    let country = await this.prisma.region.findFirst({
      where: { type: 'COUNTRY', name: countryName },
    });
    if (!country) {
      country = await this.prisma.region.create({
        data: {
          name: countryName,
          nameEn: countryName,
          type: 'COUNTRY',
        },
      });
    }

    // 2. Find or create Province
    let province = await this.prisma.region.findFirst({
      where: { type: 'PROVINCE', name: dto.provinceName, parentId: country.id },
    });
    if (!province) {
      province = await this.prisma.region.create({
        data: {
          name: dto.provinceName,
          nameEn: dto.provinceName,
          type: 'PROVINCE',
          parentId: country.id,
          province: dto.provinceCode,
        },
      });
    }

    // 3. Find or create City
    // If cityName matches provinceName (province-level region), return the province
    if (dto.cityName === dto.provinceName) {
      return { id: province.id, name: province.name, type: province.type, parentId: province.parentId };
    }

    const existingCity = await this.prisma.region.findFirst({
      where: {
        name: dto.cityName,
        parentId: province.id,
        type: 'CITY',
      },
    });

    if (existingCity) {
      return { id: existingCity.id, name: existingCity.name, type: existingCity.type, parentId: existingCity.parentId };
    }

    const city = await this.prisma.region.create({
      data: {
        name: dto.cityName,
        nameEn: dto.cityName,
        type: 'CITY',
        parentId: province.id,
        province: dto.provinceName,
        latitude: dto.cityLatitude ? parseFloat(dto.cityLatitude) : null,
        longitude: dto.cityLongitude ? parseFloat(dto.cityLongitude) : null,
      },
    });

    return { id: city.id, name: city.name, type: city.type, parentId: city.parentId };
  }

  /**
   * Get all descendant region IDs for a given region (for hierarchical search).
   * E.g., if regionId is a Province, returns all City IDs within it.
   * If regionId is a Country, returns all Province and City IDs within it.
   */
  async getDescendantIds(regionId: string): Promise<string[]> {
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (!region) return [regionId]; // Fallback: just return the ID itself

    const ids: string[] = [regionId];

    if (region.type === 'COUNTRY' || region.type === 'PROVINCE') {
      // Get all children recursively (max 3 levels: Country > Province > City)
      const children = await this.prisma.region.findMany({
        where: { parentId: regionId },
        select: { id: true, type: true },
      });
      ids.push(...children.map((c) => c.id));

      // If this is a Country, also get grandchildren (cities under provinces)
      if (region.type === 'COUNTRY' && children.length > 0) {
        const grandChildren = await this.prisma.region.findMany({
          where: { parentId: { in: children.map((c) => c.id) } },
          select: { id: true },
        });
        ids.push(...grandChildren.map((g) => g.id));
      }
    }

    return ids;
  }

  /**
   * Get all ancestor region IDs for a given region (traverse UP the hierarchy).
   * E.g., if regionId is a City, returns [provinceId, countryId].
   * This allows city-level searches to also find province-level workers.
   */
  async getAncestorIds(regionId: string): Promise<string[]> {
    const ids: string[] = [];
    let current = await this.prisma.region.findUnique({ where: { id: regionId } });
    while (current?.parentId) {
      ids.push(current.parentId);
      current = await this.prisma.region.findUnique({ where: { id: current.parentId } });
    }
    return ids;
  }

  /**
   * Get regions with optional filters including parentId for hierarchy navigation
   */
  async getRegions(params: { type?: string; province?: string; parentId?: string }) {
    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.province) where.province = { contains: params.province, mode: 'insensitive' };
    if (params.parentId) where.parentId = params.parentId;

    return this.prisma.region.findMany({
      where,
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameEn: true,
        type: true,
        province: true,
        parentId: true,
      },
    });
  }
}