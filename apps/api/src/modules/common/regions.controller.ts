import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { RegionsService } from './regions.service';

/**
 * REGIONS CONTROLLER
 *
 * Provides region data for search filters and profile forms.
 * Supports hierarchical navigation (Country → Province → City)
 * and region resolution (find-or-create for worker profiles).
 */

@Controller('regions')
export class RegionsController {
  constructor(private regionsService: RegionsService) {}

  @Get()
  async getRegions(
    @Query('type') type?: string,
    @Query('province') province?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.regionsService.getRegions({ type, province, parentId });
  }

  /**
   * Resolve a location (country + province + city) to Region records.
   * Finds or creates Country, Province, and City records linked via parentId.
   * Returns the City record's ID for storing as worker.regionId.
   */
  @Post('resolve')
  async resolveRegion(
    @Body() body: {
      countryCode: string;
      countryName?: string;
      provinceCode: string;
      provinceName: string;
      cityName: string;
      cityLatitude?: string;
      cityLongitude?: string;
    },
  ) {
    return this.regionsService.resolveOrCreateRegion(body);
  }
}