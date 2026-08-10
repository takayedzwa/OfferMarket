import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { DataMinimizationInterceptor } from './interceptors/data-minimization.interceptor';
import { SanitizeInputPipe } from './pipes/sanitize-input.pipe';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (and Socket.IO WebSocket)
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // GDPR: Security headers middleware — adds security headers
  // to all responses to protect personal data from injection attacks
  app.use(new SecurityHeadersMiddleware().use);

  // XSS: Global sanitization pipe — strips all HTML tags from string values
  // in request bodies before validation. Prevents stored XSS attacks.
  // Must run before ValidationPipe so sanitized values are validated.
  app.useGlobalPipes(
    new SanitizeInputPipe(),
  );

  // Global validation pipe — whitelist strips unknown properties to prevent
  // mass assignment attacks (GDPR Art. 5(1)(f) data integrity).
  // transform: true is needed for class-transformer decorators (@Transform) to work.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // GDPR: Data minimization interceptor — strips sensitive fields
  // from API responses based on user role (Article 5(1)(c))
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new DataMinimizationInterceptor());

  // i18n: Global exception filter — normalizes all error responses to
  // { statusCode, message, code?, params? } so the frontend can translate
  // migrated error codes via the `errors` namespace, with the English message
  // as a fallback. Sanitizes non-HttpException errors (no stack leak).
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Bind to 0.0.0.0 so the process is reachable from outside the container
  // (Fly's proxy needs to reach it). `Number()` avoids passing a string port.
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 OfferMarket API running on port ${port}`);
}

bootstrap();