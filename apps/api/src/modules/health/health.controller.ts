import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Liveness health check.
 *
 * Returns 200 as long as the NestJS process is alive and answering requests.
 * Deliberately depends on nothing else (no PostgreSQL, Redis, S3) so it stays
 * green when a downstream dependency is degraded — verifying those is a
 * readiness concern, not liveness. Used by Fly's HTTP health check
 * (see `fly.toml` -> `http_service.checks`).
 *
 * `@SkipThrottle()` so the check never receives a 429 — it is polled every 30s
 * by the Fly proxy and must always answer.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}