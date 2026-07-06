import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferValidationPipe } from './pipes/offer-validation.pipe';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [OffersController],
  providers: [OffersService, OfferValidationPipe],
  exports: [OffersService],
})
export class OffersModule {}
