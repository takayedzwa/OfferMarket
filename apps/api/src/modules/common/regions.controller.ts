import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * REGIONS CONTROLLER
 *
 * Provides region data for search filters and profile forms.
 */

@Controller('regions')
export class RegionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getRegions(
    @Query('type') type?: string,
    @Query('province') province?: string,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (province) where.province = { contains: province, mode: 'insensitive' };

    return this.prisma.region.findMany({
      where,
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameEn: true,
        type: true,
        province: true,
      },
    });
  }
}