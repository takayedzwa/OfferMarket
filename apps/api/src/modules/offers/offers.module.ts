import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferValidationPipe } from './pipes/offer-validation.pipe';

@Module({
  controllers: [OffersController],
  providers: [OffersService, OfferValidationPipe],
  exports: [OffersService],
})
export class OffersModule {}
