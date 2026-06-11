import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { AnonymousProfilePipe } from './pipes/anonymous-profile.pipe';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService, AnonymousProfilePipe],
  exports: [WorkersService],
})
export class WorkersModule {}
