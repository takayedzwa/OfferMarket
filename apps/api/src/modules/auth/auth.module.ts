import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';
import { TrustModule } from '../trust/trust.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })() : 'dev-secret-key-not-for-production'),
      signOptions: { expiresIn: '1h', algorithm: 'HS256' as const },
    }),
    PrismaModule,
    TrustModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
