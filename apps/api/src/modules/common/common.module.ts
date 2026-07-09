import { Module } from '@nestjs/common';
import { EnumsController } from './enums.controller';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

@Module({
  controllers: [EnumsController, RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class CommonModule {}