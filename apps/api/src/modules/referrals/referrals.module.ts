import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReferralsController } from './referrals.controller';
import { ReferralAdminController } from './referral-admin.controller';
import { ReferralsService } from './referrals.service';
import { RewardProviderRegistry } from './rewards/reward-provider-registry';
import { ManualRewardProvider } from './rewards/manual-reward-provider';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralsController, ReferralAdminController],
  providers: [ReferralsService, ManualRewardProvider, RewardProviderRegistry],
  // AuthModule consumes attributeReferral + recordQualification at registration
  // and email-verification time.
  exports: [ReferralsService],
})
export class ReferralsModule {}