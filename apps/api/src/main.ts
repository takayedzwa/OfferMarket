import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // Global validation pipe - minimal to avoid interfering with nested DTOs
  // OfferValidationPipe handles full validation for offers endpoint
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 OfferMarket API running on http://localhost:${port}/api/v1`);
}

bootstrap();
