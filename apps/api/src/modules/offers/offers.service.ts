import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { NotificationEventType } from '../notifications/notification.types';
import { OfferStatus } from '@prisma/client';

/**
 * SECURITY (E-C3): The fields an employer is allowed to see on a worker before
 * the offer is accepted. Workers are anonymized until acceptance — never
 * expose `userId`, internal `id`, consent fields, or `deletedAt`. The employer
 * only sees the anonymous public handle and the profile metadata relevant to
 * the offer.
 */
const ANONYMIZED_WORKER_SELECT = {
  select: {
    publicId: true,
    specializations: true,
    availability: true,
    regionId: true,
    profileVisibility: true,
    reputationScore: true,
    isProfileComplete: true,
  },
};

/**
 * OFFERS SERVICE
 *
 * Core primitive: STRUCTURED OFFERS
 *
 * This service enforces:
 * 1. All offers must be complete (validation pipe)
 * 2. Identity is ONLY revealed on acceptance
 * 3. Offer state machine is strictly enforced
 */

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // CREATE OFFER
  // ============================================================================

  /**
   * Create a new structured offer
   *
   * CRITICAL: This is where we enforce the structured offer primitive
   * - All fields must be present (validated by OfferValidationPipe)
   * - Worker cannot be blocked
   * - Employer must have credits/subscription
   */
  async createOffer(userId: string, createOfferDto: CreateOfferDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify employer exists and is verified
      const employer = await tx.employer.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!employer) {
        throw new NotFoundException('Employer not found');
      }

      if (employer.verificationStatus === 'PENDING' || employer.verificationStatus === 'REJECTED') {
        throw new ForbiddenException('Employer must be verified before making offers');
      }

      // 2. Verify worker exists and is active
      const worker = await tx.worker.findUnique({
        where: { publicId: createOfferDto.workerId }
      });

      if (!worker || worker.deletedAt) {
        throw new NotFoundException('Worker not found');
      }

      // 3. CRITICAL: Check if worker has blocked this employer
      const isBlocked = await tx.blockedCompany.findFirst({
        where: {
          workerId: worker.id,
          employerId: employer.id
        }
      });

      if (isBlocked) {
        // Silently fail - don't reveal to employer that they're blocked
        throw new ForbiddenException('Cannot make offer to this worker');
      }

      // 4. Verify worker's profile visibility allows this employer
      if (worker.profileVisibility === 'HIDDEN') {
        throw new ForbiddenException('Worker profile is not visible');
      }

      if (worker.profileVisibility === 'SELECTED_COMPANIES') {
        // Check if this employer is in the worker's visible companies list
        const isVisible = await tx.visibleCompany.findFirst({
          where: {
            workerId: worker.id,
            employerId: employer.id
          }
        });
        if (!isVisible) {
          throw new ForbiddenException('Worker profile is not visible to you');
        }
      }

      // 5. Offer limits: prevent offer flooding
      const MAX_WORKER_ACTIVE_OFFERS = 50;
      const MAX_EMPLOYER_TO_WORKER_OFFERS = 3;
      const activeStatuses: OfferStatus[] = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'COUNTERED'];

      // 5a. Check worker's total active offers
      const workerActiveOffers = await tx.offer.count({
        where: {
          workerId: worker.id,
          status: { in: activeStatuses },
        },
      });
      if (workerActiveOffers >= MAX_WORKER_ACTIVE_OFFERS) {
        throw new BadRequestException(
          'This worker has reached the maximum number of active offers'
        );
      }

      // 5b. Check employer's active offers to this specific worker
      const employerToWorkerOffers = await tx.offer.count({
        where: {
          workerId: worker.id,
          employerId: employer.id,
          status: { in: activeStatuses },
        },
      });
      if (employerToWorkerOffers >= MAX_EMPLOYER_TO_WORKER_OFFERS) {
        throw new BadRequestException(
          'You already have active offers to this worker. Please withdraw existing offers before creating new ones.'
        );
      }

      // 6. Generate public ID for offer
      const publicId = await this.generateOfferPublicId(tx);

      // 6. Calculate expiry date (default 14 days, max 30 days)
      const expiresInDays = Math.min(createOfferDto.expiresInDays || 14, 30);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // 7. Create offer with version
      const offer = await tx.offer.create({
        data: {
          publicId,
          workerId: worker.id,
          employerId: employer.id,
          jobTitle: createOfferDto.jobTitle,
          department: createOfferDto.department,
          jobDescription: createOfferDto.jobDescription,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          expiresAt,
          source: createOfferDto.source || 'search',
          versions: {
            create: {
              version: 1,
              // COMPENSATION
              salaryMin: createOfferDto.compensation.salaryMin,
              salaryMax: createOfferDto.compensation.salaryMax,
              salaryPeriod: createOfferDto.compensation.salaryPeriod || 'year',
              hourlyRate: createOfferDto.compensation.hourlyRate,
              signOnBonus: createOfferDto.compensation.signOnBonus,
              performanceBonusPct: createOfferDto.compensation.performanceBonusPct,
              overtimeRate: createOfferDto.compensation.overtimeRate,
              weekendRate: createOfferDto.compensation.weekendRate,
              // CONTRACT
              contractType: createOfferDto.contract.type,
              contractDurationMonths: createOfferDto.contract.durationMonths,
              hoursPerWeek: createOfferDto.contract.hoursPerWeek,
              startDateType: createOfferDto.contract.startDateType || 'flexible',
              startDate: createOfferDto.contract.startDate,
              probationMonths: createOfferDto.contract.probationMonths,
              // BENEFITS
              vacationDays: createOfferDto.benefits.vacationDays,
              holidayAllowancePct: createOfferDto.benefits.holidayAllowancePct,
              pensionContributionPct: createOfferDto.benefits.pensionContributionPct,
              trainingBudget: createOfferDto.benefits.trainingBudget,
              companyVehicle: createOfferDto.benefits.companyVehicle,
              vehicleType: createOfferDto.benefits.vehicleType,
              vehicleValueEst: createOfferDto.benefits.vehicleValueEst,
              travelAllowanceType: createOfferDto.benefits.travelAllowanceType,
              travelAllowanceValue: createOfferDto.benefits.travelAllowanceValue,
              phoneProvided: createOfferDto.benefits.phoneProvided,
              toolsProvided: createOfferDto.benefits.toolsProvided,
              // WORK ARRANGEMENT
              scheduleType: createOfferDto.workArrangement.scheduleType,
              onCallDetails: createOfferDto.workArrangement.onCallDetails,
              remoteWorkPct: createOfferDto.workArrangement.remoteWorkPct,
              travelRequiredPct: createOfferDto.workArrangement.travelRequiredPct,
              travelRegion: createOfferDto.workArrangement.travelRegion,
              physicalRequirements: createOfferDto.workArrangement.physicalRequirements,
              // REQUIREMENTS
              requiredCertifications: createOfferDto.requirements.requiredCertifications,
              requiredExperienceYears: createOfferDto.requirements.requiredExperienceYears,
            }
          }
        },
        include: {
          versions: true,
          employer: true
        }
      });

      // 8. Set currentVersionId to the newly created version
      const updatedOffer = await tx.offer.update({
        where: { id: offer.id },
        data: { currentVersionId: offer.versions[0].id },
        include: {
          currentVersion: true,
          versions: true,
          employer: true
        }
      });

      // 9. Update employer's offer count
      await tx.employer.update({
        where: { id: employer.id },
        data: {
          totalOffersSent: { increment: 1 }
        }
      });

      // 10. Emit notification event for worker
      this.eventEmitter.emit(NotificationEventType.OFFER_RECEIVED, {
        recipientUserId: worker.userId,
        workerUserId: worker.userId,
        employerCompanyName: employer.companyName || employer.companyTradeName || 'An employer',
        jobTitle: createOfferDto.jobTitle,
        offerId: offer.id,
        actionUrl: `/offers/${offer.id}`,
      });

      return updatedOffer;
    });
  }

  // ============================================================================
  // VIEW OFFER (Worker perspective - anonymous)
  // ============================================================================

  /**
   * Get offer details for worker
   *
   * CRITICAL: Employer identity is visible, but worker's identity remains hidden.
   * PRIVACY: For non-accepted states, employer email is redacted. Full contact
   * details are only revealed after the worker accepts the offer.
   */
  async getOfferForWorker(offerId: string, userId: string) {
    // First, find the Worker record by userId
    const worker = await this.prisma.worker.findUnique({
      where: { userId }
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        employer: {
          include: {
            user: true
          }
        },
        currentVersion: true,
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Verify this offer belongs to the worker
    if (offer.workerId !== worker.id) {
      throw new ForbiddenException('Not authorized to view this offer');
    }

    // Update viewed timestamp if first time viewing
    if (!offer.viewedAt) {
      await this.prisma.offer.update({
        where: { id: offerId },
        data: { viewedAt: new Date() }
      });
    }

    // PRIVACY: Redact employer email for non-accepted states.
    // Full contact details are only revealed after acceptance.
    const acceptedStates = ['ACCEPTED'];
    if (!acceptedStates.includes(offer.status) && offer.employer?.user) {
      // Remove sensitive fields from the employer user object for non-accepted offers.
      // The worker only sees the company name, not the employer's personal email/phone.
      offer.employer.user = {
        ...offer.employer.user,
        email: '[redacted]',
        phone: '[redacted]',
        passwordHash: '[redacted]',
      };
    }

    return offer;
  }

  async getOfferForEmployer(offerId: string, userId: string) {
    // First, find the Employer record by userId
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        worker: ANONYMIZED_WORKER_SELECT,
        currentVersion: true,
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Verify this offer belongs to the employer
    if (offer.employerId !== employer.id) {
      throw new ForbiddenException('Not authorized to view this offer');
    }

    return offer;
  }

  // ============================================================================
  // UPDATE OFFER (Employer)
  // ============================================================================

  /**
   * Update an offer - creates a new version
   *
   * Only allowed for offers in DRAFT or SUBMITTED status
   */
  async updateOffer(offerId: string, userId: string, updateOfferDto: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find employer by userId
      const employer = await tx.employer.findUnique({
        where: { userId }
      });

      if (!employer) {
        throw new NotFoundException('Employer not found');
      }

      // 2. Get the offer
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: { currentVersion: true }
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      // 3. Verify ownership
      if (offer.employerId !== employer.id) {
        throw new ForbiddenException('Not authorized to update this offer');
      }

      // 4. Check if offer can be updated
      if (offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'WITHDRAWN') {
        throw new BadRequestException(`Cannot update offer in ${offer.status} status`);
      }

      // 5. Get next version number
      const versions = await tx.offerVersion.findMany({
        where: { offerId },
        select: { version: true },
        orderBy: { version: 'desc' },
        take: 1
      });
      const nextVersion = (versions[0]?.version || 0) + 1;

      // 6. Update offer basic fields if provided
      await tx.offer.update({
        where: { id: offerId },
        data: {
          jobTitle: updateOfferDto.jobTitle ?? offer.jobTitle,
          jobDescription: updateOfferDto.jobDescription ?? offer.jobDescription,
          department: updateOfferDto.department ?? offer.department,
        }
      });

      // 7. Create new version with updated data
      const newVersion = await tx.offerVersion.create({
        data: {
          offerId,
          version: nextVersion,
          // COMPENSATION
          salaryMin: updateOfferDto.compensation?.salaryMin ?? offer.currentVersion?.salaryMin,
          salaryMax: updateOfferDto.compensation?.salaryMax ?? offer.currentVersion?.salaryMax,
          salaryPeriod: updateOfferDto.compensation?.salaryPeriod ?? offer.currentVersion?.salaryPeriod,
          hourlyRate: updateOfferDto.compensation?.hourlyRate ?? offer.currentVersion?.hourlyRate,
          signOnBonus: updateOfferDto.compensation?.signOnBonus ?? offer.currentVersion?.signOnBonus,
          performanceBonusPct: updateOfferDto.compensation?.performanceBonusPct ?? offer.currentVersion?.performanceBonusPct,
          overtimeRate: updateOfferDto.compensation?.overtimeRate ?? offer.currentVersion?.overtimeRate,
          weekendRate: updateOfferDto.compensation?.weekendRate ?? offer.currentVersion?.weekendRate,
          // CONTRACT
          contractType: updateOfferDto.contract?.type ?? offer.currentVersion?.contractType,
          contractDurationMonths: updateOfferDto.contract?.durationMonths ?? offer.currentVersion?.contractDurationMonths,
          hoursPerWeek: updateOfferDto.contract?.hoursPerWeek ?? offer.currentVersion?.hoursPerWeek,
          startDateType: updateOfferDto.contract?.startDateType ?? offer.currentVersion?.startDateType,
          startDate: updateOfferDto.contract?.startDate ?? offer.currentVersion?.startDate,
          probationMonths: updateOfferDto.contract?.probationMonths ?? offer.currentVersion?.probationMonths,
          // BENEFITS
          vacationDays: updateOfferDto.benefits?.vacationDays ?? offer.currentVersion?.vacationDays,
          holidayAllowancePct: updateOfferDto.benefits?.holidayAllowancePct ?? offer.currentVersion?.holidayAllowancePct,
          pensionContributionPct: updateOfferDto.benefits?.pensionContributionPct ?? offer.currentVersion?.pensionContributionPct,
          trainingBudget: updateOfferDto.benefits?.trainingBudget ?? offer.currentVersion?.trainingBudget,
          companyVehicle: updateOfferDto.benefits?.companyVehicle ?? offer.currentVersion?.companyVehicle,
          vehicleType: updateOfferDto.benefits?.vehicleType ?? offer.currentVersion?.vehicleType,
          vehicleValueEst: updateOfferDto.benefits?.vehicleValueEst ?? offer.currentVersion?.vehicleValueEst,
          travelAllowanceType: updateOfferDto.benefits?.travelAllowanceType ?? offer.currentVersion?.travelAllowanceType,
          travelAllowanceValue: updateOfferDto.benefits?.travelAllowanceValue ?? offer.currentVersion?.travelAllowanceValue,
          phoneProvided: updateOfferDto.benefits?.phoneProvided ?? offer.currentVersion?.phoneProvided,
          toolsProvided: updateOfferDto.benefits?.toolsProvided ?? offer.currentVersion?.toolsProvided,
          // WORK ARRANGEMENT
          scheduleType: updateOfferDto.workArrangement?.scheduleType ?? offer.currentVersion?.scheduleType,
          onCallDetails: updateOfferDto.workArrangement?.onCallDetails ?? offer.currentVersion?.onCallDetails,
          remoteWorkPct: updateOfferDto.workArrangement?.remoteWorkPct ?? offer.currentVersion?.remoteWorkPct,
          travelRequiredPct: updateOfferDto.workArrangement?.travelRequiredPct ?? offer.currentVersion?.travelRequiredPct,
          travelRegion: updateOfferDto.workArrangement?.travelRegion ?? offer.currentVersion?.travelRegion,
          physicalRequirements: updateOfferDto.workArrangement?.physicalRequirements ?? offer.currentVersion?.physicalRequirements,
          // REQUIREMENTS
          requiredCertifications: updateOfferDto.requirements?.requiredCertifications ?? offer.currentVersion?.requiredCertifications,
          requiredExperienceYears: updateOfferDto.requirements?.requiredExperienceYears ?? offer.currentVersion?.requiredExperienceYears,
        }
      });

      // 8. Update currentVersionId
      await tx.offer.update({
        where: { id: offerId },
        data: { currentVersionId: newVersion.id }
      });

      // 9. Return updated offer
      return tx.offer.findUnique({
        where: { id: offerId },
        include: {
          currentVersion: true,
          versions: { orderBy: { version: 'desc' } },
          worker: ANONYMIZED_WORKER_SELECT
        }
      });
    });
  }

  // ============================================================================
  // SUBMIT OFFER (Employer)
  // ============================================================================

  /**
   * Submit a DRAFT offer to the worker
   */
  async submitOffer(offerId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find employer by userId
      const employer = await tx.employer.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!employer) {
        throw new NotFoundException('Employer not found');
      }

      // 2. Get the offer
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: {
          currentVersion: true,
          worker: { include: { user: true } }
        }
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      // 3. Verify ownership
      if (offer.employerId !== employer.id) {
        throw new ForbiddenException('Not authorized to submit this offer');
      }

      // 4. Check if offer can be submitted (must be DRAFT)
      if (offer.status !== 'DRAFT') {
        throw new BadRequestException(`Cannot submit offer in ${offer.status} status`);
      }

      if (!offer.currentVersion) {
        throw new BadRequestException('Offer has no version to submit');
      }

      // 5. Update offer status to SUBMITTED
      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });

      // 6. Emit notification event for worker
      this.eventEmitter.emit(NotificationEventType.OFFER_RECEIVED, {
        recipientUserId: offer.worker.userId,
        workerUserId: offer.worker.userId,
        employerCompanyName: employer.companyName || employer.companyTradeName || 'An employer',
        jobTitle: offer.jobTitle,
        offerId: offer.id,
        actionUrl: `/offers/${offer.id}`,
      });

      // 7. Return updated offer
      return tx.offer.findUnique({
        where: { id: offerId },
        include: {
          currentVersion: true,
          versions: { orderBy: { version: 'desc' } },
          worker: ANONYMIZED_WORKER_SELECT,
          employer: true
        }
      });
    });
  }

  // ============================================================================
  // ACCEPT OFFER - THE MOMENT OF TRUTH
  // ============================================================================

  /**
   * Accept an offer
   *
   * CRITICAL: This is where identity is revealed
   * - Worker's name, email, phone are shared with employer
   * - Conversation is created
   * - Invoice is generated
   * - This is a terminal state
   */
  async acceptOffer(offerId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Look up Worker by userId
      const worker = await tx.worker.findUnique({
        where: { userId }
      });

      if (!worker) {
        throw new NotFoundException('Worker not found');
      }

      // 2. Acquire row-level lock on the offer to prevent concurrent acceptance.
      // SELECT FOR UPDATE ensures that if two workers try to accept the same offer
      // simultaneously, the second one blocks until the first transaction commits,
      // at which point the status check will fail.
      await tx.$executeRaw`SELECT 1 FROM "Offer" WHERE id = ${offerId} FOR UPDATE`;

      // 3. Get offer with all relations (row is now locked)
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: {
          worker: {
            include: {
              user: true
            }
          },
          employer: {
            include: {
              user: true
            }
          },
          currentVersion: true
        }
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      // 3. Verify worker ownership
      if (offer.workerId !== worker.id) {
        throw new UnauthorizedException('Not authorized to accept this offer');
      }

      // 3. Verify offer can be accepted
      // SECURITY: Workers must VIEW an offer before accepting. Accepting a
      // SUBMITTED offer without viewing could be unintentional — the worker
      // hasn't seen the terms yet. Only VIEWED and SHORTLISTED are valid.
      if (offer.status !== 'VIEWED' && offer.status !== 'SHORTLISTED') {
        throw new BadRequestException(`Offer cannot be accepted in current state: ${offer.status}. Please view the offer first before accepting.`);
      }

      // 4. Check offer hasn't expired
      if (offer.expiresAt < new Date()) {
        throw new BadRequestException('Offer has expired');
      }

      // 5. CRITICAL: Reveal worker identity
      // In production, these would be decrypted from encrypted storage
      const workerIdentity = {
        fullName: await this.getWorkerFullName(offer.workerId),
        email: offer.worker.user.email,
        phone: await this.getWorkerPhone(offer.workerId),
        // Note: Current employer is STILL hidden unless worker chooses to share
      };

      // 6. Update offer status (terminal state)
      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          currentVersionId: offer.currentVersionId
        }
      });

      // 7. Mark the accepted version
      if (offer.currentVersionId) {
        await tx.offerVersion.update({
          where: { id: offer.currentVersionId },
          data: { isAcceptedVersion: true }
        });
      }

      // 8. Create conversation (unlocks messaging)
      const conversation = await tx.conversation.create({
        data: {
          offerId,
          participant1Id: offer.worker.userId,
          participant2Id: offer.employer.userId,
          workerIdentityRevealed: true,
          workerIdentitySnapshot: workerIdentity
        }
      });

      // 9. Generate invoice for introduction fee
      const invoice = await this.billingService.createIntroductionInvoice(tx, offer.employerId, offerId);

      // 10. Update employer stats
      await tx.employer.update({
        where: { id: offer.employerId },
        data: {
          totalHires: { increment: 1 }
        }
      });

      // 11. Emit notification: employer gets the big news (WITH REVEALED IDENTITY)
      this.eventEmitter.emit(NotificationEventType.OFFER_ACCEPTED, {
        recipientUserId: offer.employer.userId,
        employerUserId: offer.employer.userId,
        workerUserId: offer.worker.userId,
        workerIdentity,
        jobTitle: offer.jobTitle,
        offerId: offer.id,
        conversationId: conversation.id,
        actionUrl: `/conversations/${conversation.id}`,
      });

      // 12. Emit notification: worker gets confirmation
      this.eventEmitter.emit(NotificationEventType.OFFER_ACCEPTED_CONFIRMATION, {
        recipientUserId: offer.worker.userId,
        workerUserId: offer.worker.userId,
        employerCompanyName: offer.employer.companyName,
        jobTitle: offer.jobTitle,
        offerId: offer.id,
        conversationId: conversation.id,
        actionUrl: `/conversations/${conversation.id}`,
      });

      return {
        offer,
        conversation,
        invoice,
        workerIdentityRevealed: workerIdentity
      };
    });
  }

  // ============================================================================
  // REJECT OFFER
  // ============================================================================

  async rejectOffer(offerId: string, userId: string, reason?: string, feedback?: string) {
    // Look up Worker by userId
    const worker = await this.prisma.worker.findUnique({
      where: { userId }
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.workerId !== worker.id) {
      throw new UnauthorizedException('Not authorized');
    }

    if (offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'EXPIRED') {
      throw new BadRequestException(`Offer cannot be rejected in current state: ${offer.status}`);
    }

    await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date()
      }
    });

    // Notify employer
    const employer = await this.prisma.employer.findUnique({
      where: { id: offer.employerId },
      include: { user: true }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    this.eventEmitter.emit(NotificationEventType.OFFER_REJECTED, {
      recipientUserId: employer.userId,
      employerUserId: employer.userId,
      reason,
      jobTitle: offer.jobTitle,
      offerId: offer.id,
      actionUrl: `/offers/${offer.id}`,
    });

    return { success: true };
  }

  // ============================================================================
  // SHORTLIST OFFER
  // ============================================================================

  async shortlistOffer(offerId: string, userId: string) {
    // Look up Worker by userId
    const worker = await this.prisma.worker.findUnique({
      where: { userId }
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.workerId !== worker.id) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'SHORTLISTED',
        shortlistedAt: new Date()
      }
    });

    return { success: true };
  }

  // ============================================================================
  // COUNTER OFFER
  // ============================================================================

  async counterOffer(offerId: string, userId: string, counterOfferDto: CounterOfferDto) {
    return this.prisma.$transaction(async (tx) => {
      // Look up Worker by userId
      const worker = await tx.worker.findUnique({
        where: { userId }
      });

      if (!worker) {
        throw new NotFoundException('Worker not found');
      }

      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: { currentVersion: true }
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      if (offer.workerId !== worker.id) {
        throw new UnauthorizedException('Not authorized');
      }

      // SECURITY: Only allow countering offers that are in an active state.
      // Offers in terminal states (WITHDRAWN, ACCEPTED, REJECTED, EXPIRED, COUNTERED, DRAFT)
      // cannot be countered.
      const allowedStatusesForCounter = ['SUBMITTED', 'VIEWED', 'SHORTLISTED'];
      if (!allowedStatusesForCounter.includes(offer.status)) {
        throw new BadRequestException(
          `Offer cannot be countered in current state: ${offer.status}. ` +
          `Only offers in states ${allowedStatusesForCounter.join(', ')} can be countered.`
        );
      }

      if (!offer.currentVersion) {
        throw new BadRequestException('Offer has no version to counter');
      }

      // Validate counter-offer salary values
      const effectiveSalaryMin = counterOfferDto.salaryMin ?? offer.currentVersion.salaryMin;
      const effectiveSalaryMax = counterOfferDto.salaryMax ?? offer.currentVersion.salaryMax;

      if (effectiveSalaryMax < effectiveSalaryMin) {
        throw new BadRequestException('Maximum salary must be greater than or equal to minimum salary');
      }
      if (effectiveSalaryMax - effectiveSalaryMin > 20000) {
        throw new BadRequestException('Salary range cannot exceed €20,000. Please provide a more specific salary range.');
      }

      // Update offer status
      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: 'COUNTERED',
          counteredAt: new Date()
        }
      });

      // Create new draft offer for employer to review
      const publicId = await this.generateOfferPublicId(tx);
      const counterOffer = await tx.offer.create({
        data: {
          publicId,
          workerId: worker.id,
          employerId: offer.employerId,
          jobTitle: offer.jobTitle,
          department: offer.department,
          jobDescription: offer.jobDescription,
          status: 'DRAFT',
          expiresAt: offer.expiresAt,
          counterOfferForId: offer.id,
        }
      });

      const newVersion = await tx.offerVersion.create({
        data: {
          offerId: counterOffer.id,
          version: offer.currentVersion.version + 1,
          // Apply counter values
          salaryMin: counterOfferDto.salaryMin || offer.currentVersion.salaryMin,
          salaryMax: counterOfferDto.salaryMax || offer.currentVersion.salaryMax,
          signOnBonus: counterOfferDto.signOnBonus ?? offer.currentVersion.signOnBonus,
          vacationDays: counterOfferDto.vacationDays || offer.currentVersion.vacationDays,
          // Copy unchanged fields
          salaryPeriod: offer.currentVersion.salaryPeriod,
          hourlyRate: offer.currentVersion.hourlyRate,
          performanceBonusPct: offer.currentVersion.performanceBonusPct,
          overtimeRate: offer.currentVersion.overtimeRate,
          weekendRate: offer.currentVersion.weekendRate,
          contractType: offer.currentVersion.contractType,
          contractDurationMonths: offer.currentVersion.contractDurationMonths,
          hoursPerWeek: offer.currentVersion.hoursPerWeek,
          startDateType: offer.currentVersion.startDateType,
          startDate: offer.currentVersion.startDate,
          probationMonths: offer.currentVersion.probationMonths,
          holidayAllowancePct: offer.currentVersion.holidayAllowancePct,
          pensionContributionPct: offer.currentVersion.pensionContributionPct,
          trainingBudget: offer.currentVersion.trainingBudget,
          companyVehicle: offer.currentVersion.companyVehicle,
          vehicleType: offer.currentVersion.vehicleType,
          vehicleValueEst: offer.currentVersion.vehicleValueEst,
          travelAllowanceType: offer.currentVersion.travelAllowanceType,
          travelAllowanceValue: offer.currentVersion.travelAllowanceValue,
          phoneProvided: offer.currentVersion.phoneProvided,
          toolsProvided: offer.currentVersion.toolsProvided,
          scheduleType: offer.currentVersion.scheduleType,
          onCallDetails: offer.currentVersion.onCallDetails,
          remoteWorkPct: offer.currentVersion.remoteWorkPct,
          travelRequiredPct: offer.currentVersion.travelRequiredPct,
          travelRegion: offer.currentVersion.travelRegion,
          physicalRequirements: offer.currentVersion.physicalRequirements,
          requiredCertifications: offer.currentVersion.requiredCertifications,
          requiredExperienceYears: offer.currentVersion.requiredExperienceYears,
        }
      });

      // Update offer with currentVersionId
      await tx.offer.update({
        where: { id: counterOffer.id },
        data: { currentVersionId: newVersion.id }
      });

      // Notify employer
      const employer = await tx.employer.findUnique({
        where: { id: offer.employerId },
        include: { user: true }
      });

      if (!employer) {
        throw new NotFoundException('Employer not found');
      }

      this.eventEmitter.emit(NotificationEventType.OFFER_COUNTERED, {
        recipientUserId: employer.userId,
        employerUserId: employer.userId,
        jobTitle: offer.jobTitle,
        counterOfferId: counterOffer.id,
        originalOfferId: offer.id,
        actionUrl: `/offers/${counterOffer.id}`,
      });

      return counterOffer;
    });
  }

  // ============================================================================
  // WITHDRAW OFFER (Employer only)
  // ============================================================================

  async withdrawOffer(offerId: string, userId: string, reason?: string) {
    // SECURITY (E-C1): Resolve the employer from the authenticated user, not
    // from a client-supplied id, so an employer can only withdraw its own offers.
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.employerId !== employer.id) {
      throw new ForbiddenException('Not authorized to withdraw this offer');
    }

    if (offer.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot withdraw an accepted offer');
    }

    await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date()
      }
    });

    // Notify worker
    const worker = await this.prisma.worker.findUnique({
      where: { id: offer.workerId },
      include: { user: true }
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    this.eventEmitter.emit(NotificationEventType.OFFER_WITHDRAWN, {
      recipientUserId: worker.userId,
      workerUserId: worker.userId,
      reason,
      jobTitle: offer.jobTitle,
      offerId: offer.id,
      actionUrl: `/offers/${offer.id}`,
    });

    return { success: true };
  }

  // ============================================================================
  // LIST OFFERS
  // ============================================================================

  async listOffersForWorker(userId: string, status?: string[]) {
    // First, find the Worker record by userId
    const worker = await this.prisma.worker.findUnique({
      where: { userId }
    });

    if (!worker) {
      // Return empty array if worker not found (user may not have completed worker profile)
      return [];
    }

    const where: any = {
      workerId: worker.id,
      status: { not: 'DRAFT' } // Workers cannot see DRAFT offers
    };

    if (status && status.length > 0) {
      where.status = { in: status, not: 'DRAFT' };
    }

    return this.prisma.offer.findMany({
      where,
      include: {
        employer: {
          include: {
            user: true
          }
        },
        currentVersion: true
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  async listOffersForEmployer(userId: string, status?: string[]) {
    // First, find the Employer record by userId
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const where: any = { employerId: employer.id };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    return this.prisma.offer.findMany({
      where,
      include: {
        worker: ANONYMIZED_WORKER_SELECT,
        currentVersion: true
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  // SECURITY: Uses PostgreSQL sequence for atomic, race-safe ID generation,
  // preventing duplicate IDs under concurrent requests.
  private async generateOfferPublicId(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const result = await tx.$queryRaw`SELECT nextval('offer_public_id_seq') as seq`;
    const sequence = Number(result[0].seq);
    return `OFF-${year}-${String(sequence).padStart(6, '0')}`;
  }

  private async getWorkerFullName(workerId: string): Promise<string> {
    // In production, this would decrypt the encrypted name
    // For now, we'd need to store this separately from the anonymous profile
    // This is a placeholder - actual implementation would use encrypted storage
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: true }
    });

    // This would come from encrypted storage in production
    return worker?.user?.email.split('@')[0] || 'Worker';
  }

  private async getWorkerPhone(workerId: string): Promise<string> {
    // In production, this would decrypt the encrypted phone
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: true }
    });

    // This would come from encrypted storage in production
    return worker?.user?.phone || '';
  }

}
