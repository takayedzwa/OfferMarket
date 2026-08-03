import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

/**
 * AllExceptionsFilter — normalizes every error response to a consistent shape:
 *
 *   { statusCode, message, code?, params? }
 *
 * i18n strategy:
 * - Migrated throw sites pass `{ code, message, params }` to the NestJS
 *   exception. The filter forwards `code` + `params` so the frontend can
 *   translate via the `errors` namespace; the English `message` is always
 *   included as a fallback.
 * - Unmigrated throw sites (plain string or default NestJS object) have no
 *   `code`, so the filter passes `message` through unchanged. The frontend
 *   translator falls back to `message` — preserving the specific English text
 *   with NO regression. This makes per-module migration incremental and safe.
 * - Non-HttpException errors (unexpected bugs, raw Prisma/DB errors that
 *   escape service layers) are sanitized to `{ code: 'error.internal',
 *   message: 'Internal server error' }` so stack traces and internal details
 *   never leak to clients. The real error is logged server-side.
 *
 * ValidationPipe errors (class-validator) arrive as
 * `{ message: string[], error: 'Bad Request', statusCode: 400 }`. The filter
 * passes the `message` array through without a code so the frontend renders the
 * (English) field messages unchanged — full validation i18n is a deferred risk
 * (see the i18n plan). No regression vs. the previous default behavior.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = 500;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        // `throw new BadRequestException('some message')`
        body = { statusCode, message: res };
      } else if (res && typeof res === 'object') {
        // Spread the response object so throw sites can attach arbitrary
        // extra fields (e.g. `validationErrors`, `params`) that the frontend
        // may need, then guarantee `statusCode`/`message` are present.
        const r = res as Record<string, unknown>;
        body = {
          ...r,
          statusCode,
          message: (r.message as unknown) ?? exception.message,
        };
      } else {
        body = { statusCode, message: exception.message };
      }
    } else {
      // Non-HttpException: never leak internals. Log server-side, return generic.
      body = { statusCode, code: 'error.internal', message: 'Internal server error' };
      const err = exception as Error;
      this.logger.error(
        `Unhandled non-HTTP exception: ${err?.message ?? String(exception)}`,
        err?.stack,
      );
    }

    response.status(statusCode).json(body);
  }
}