import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { DataMinimizationInterceptor } from './interceptors/data-minimization.interceptor';
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

  // Global validation pipe - minimal to avoid interfering with nested DTOs
  // OfferValidationPipe handles full validation for offers endpoint
  // transform: true is needed for class-transformer decorators (@Transform) to work
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  // GDPR: Data minimization interceptor — strips sensitive fields
  // from API responses based on user role (Article 5(1)(c))
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new DataMinimizationInterceptor());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 OfferMarket API running on http://localhost:${port}/api/v1`);
}

bootstrap();