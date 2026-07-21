import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { AnonymousProfilePipe } from './pipes/anonymous-profile.pipe';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkersController],
  providers: [WorkersService, AnonymousProfilePipe],
  exports: [WorkersService],
})
export class WorkersModule {}
