import { Controller, Post, Get, Param, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InternalApiKeyGuard } from '../../guards/internal-api-key.guard';
import { InternalWorkersService, RequestMeta } from './internal-workers.service';
import { InternalCreateWorkerDto, InternalUpsertProfileDto, InternalActivateWorkerDto } from './dto/internal-worker.dto';

/**
 * Internal acquisition boundary — service-to-service endpoints for
 * offermarket-ai-acquisition.
 *
 * Effective routes (global prefix `api/v1` from main.ts):
 *   POST /api/v1/internal/workers
 *   POST /api/v1/internal/workers/:id/profile
 *   GET  /api/v1/internal/workers/:id/profile
 *   POST /api/v1/internal/workers/:id/activate
 *
 * `:id` is the OfferMarket worker publicId (format `W-000123`) returned from
 * the create call — NOT internal DB ids.
 *
 * Auth: shared secret via `x-api-key` (InternalApiKeyGuard); the endpoint is
 * fail-closed when INTERNAL_API_KEY is unset. A stricter @Throttle applies per
 * route because the global guard's per-IP bucket only sees one caller here.
 * The ProcessingRestrictionGuard passes unauthenticated requests through and
 * the acquisition target users are not GDPR-restricted normal cases — if a
 * target user has restricted processing, the create still goes through
 * AuthService (which does not consult that guard); audit rows remain.
 */
@Controller('internal/workers')
@UseGuards(InternalApiKeyGuard)
export class InternalWorkersController {
  constructor(private internalWorkersService: InternalWorkersService) {}

  @Post()
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @HttpCode(HttpStatus.CREATED)
  async createWorker(@Body() dto: InternalCreateWorkerDto, @Req() req: any) {
    return this.internalWorkersService.createWorker(dto, this.meta(req));
  }

  /** Create/update from READY_TO_CREATE of the AI conversation. Idempotent by nature. */
  @Post(':id/profile')
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async upsertWorkerProfile(@Param('id') id: string, @Body() dto: InternalUpsertProfileDto, @Req() req: any) {
    return this.internalWorkersService.upsertWorkerProfile(id, dto, this.meta(req));
  }

  @Get(':id/profile')
  async getWorkerProfile(@Param('id') id: string) {
    return this.internalWorkersService.getWorkerProfile(id);
  }

  @Post(':id/activate')
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async activateWorker(@Param('id') id: string, @Body() dto: InternalActivateWorkerDto, @Req() req: any) {
    return this.internalWorkersService.activateWorker(id, dto ?? {}, this.meta(req));
  }

  private meta(req: any): RequestMeta {
    return {
      ipAddress: req?.ip,
      userAgent: typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      requestId: typeof req?.headers?.['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
    };
  }
}