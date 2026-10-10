import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorkersModule } from '../workers/workers.module';
import { AuthModule } from '../auth/auth.module';
import { InternalWorkersController } from './internal-workers.controller';
import { InternalWorkersService } from './internal-workers.service';

/**
 * InternalModule — the acquisition boundary module.
 *
 * Registers no new domain logic: account creation is delegated to
 * AuthService, profile creation/updates to WorkersService. It only adds the
 * service-to-service authentication (InternalApiKeyGuard), the idempotent
 * orchestration and the audit writes.
 */
@Module({
  imports: [PrismaModule, WorkersModule, AuthModule],
  controllers: [InternalWorkersController],
  providers: [InternalWorkersService],
  exports: [InternalWorkersService],
})
export class InternalModule {}