import { Module } from '@nestjs/common';
import { EnumsController } from './enums.controller';
import { RegionsController } from './regions.controller';

@Module({
  controllers: [EnumsController, RegionsController],
})
export class CommonModule {}