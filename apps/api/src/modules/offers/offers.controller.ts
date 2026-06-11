import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, BadRequestException, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OfferValidationPipe } from './pipes/offer-validation.pipe';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';

/**
 * Simple auth guard - in production, integrate with Clerk/Auth0
 */
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    if (!userId || !userRole) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // ===========================================================================
  // CREATE OFFER (Employer only)
  // ===========================================================================

  /**
   * POST /offers
   *
   * Create a new structured offer
   *
   * CRITICAL: This endpoint enforces the structured offer primitive
   * - All fields required
   * - Validation pipe rejects incomplete offers
   * - No "competitive salary" allowed
   */
  @Post()
  @UseGuards(SimpleAuthGuard)
  @UsePipes(new OfferValidationPipe())
  async createOffer(
    @Body() createOfferDto: CreateOfferDto,
    @Query('employerId') employerId: string
  ) {
    if (!employerId) {
      throw new BadRequestException('employerId is required');
    }

    return this.offersService.createOffer(employerId, createOfferDto);
  }

  // ===========================================================================
  // VIEW OFFER (Worker)
  // ===========================================================================

  /**
   * GET /offers/:id
   *
   * View offer details (worker perspective)
   */
  @Get(':id')
  @UseGuards(SimpleAuthGuard)
  async getOffer(
    @Param('id') id: string,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.offersService.getOfferForWorker(id, workerId);
  }

  // ===========================================================================
  // ACCEPT OFFER (Worker) - THE MOMENT OF TRUTH
  // ===========================================================================

  /**
   * POST /offers/:id/accept
   *
   * CRITICAL: This is where identity is revealed
   * - Worker's name, email, phone shared with employer
   * - Conversation created
   * - Invoice generated
   */
  @Post(':id/accept')
  @UseGuards(SimpleAuthGuard)
  async acceptOffer(
    @Param('id') id: string,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.offersService.acceptOffer(id, workerId);
  }

  // ===========================================================================
  // REJECT OFFER (Worker)
  // ===========================================================================

  /**
   * POST /offers/:id/reject
   */
  @Post(':id/reject')
  @UseGuards(SimpleAuthGuard)
  async rejectOffer(
    @Param('id') id: string,
    @Query('workerId') workerId: string,
    @Body('reason') reason?: string,
    @Body('feedback') feedback?: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.offersService.rejectOffer(id, workerId, reason, feedback);
  }

  // ===========================================================================
  // SHORTLIST OFFER (Worker)
  // ===========================================================================

  /**
   * POST /offers/:id/shortlist
   */
  @Post(':id/shortlist')
  @UseGuards(SimpleAuthGuard)
  async shortlistOffer(
    @Param('id') id: string,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.offersService.shortlistOffer(id, workerId);
  }

  // ===========================================================================
  // COUNTER OFFER (Worker)
  // ===========================================================================

  /**
   * POST /offers/:id/counter
   */
  @Post(':id/counter')
  @UseGuards(SimpleAuthGuard)
  async counterOffer(
    @Param('id') id: string,
    @Query('workerId') workerId: string,
    @Body() counterOfferDto: CounterOfferDto
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.offersService.counterOffer(id, workerId, counterOfferDto);
  }

  // ===========================================================================
  // WITHDRAW OFFER (Employer)
  // ===========================================================================

  /**
   * POST /offers/:id/withdraw
   */
  @Post(':id/withdraw')
  @UseGuards(SimpleAuthGuard)
  async withdrawOffer(
    @Param('id') id: string,
    @Query('employerId') employerId: string,
    @Body('reason') reason?: string
  ) {
    if (!employerId) {
      throw new BadRequestException('employerId is required');
    }

    return this.offersService.withdrawOffer(id, employerId, reason);
  }

  // ===========================================================================
  // LIST OFFERS
  // ===========================================================================

  /**
   * GET /offers
   *
   * List offers based on user role
   */
  @Get()
  @UseGuards(SimpleAuthGuard)
  async listOffers(
    @Query('workerId') workerId: string,
    @Query('employerId') employerId: string,
    @Query('status') status?: string
  ) {
    const statusArray = status ? status.split(',') : undefined;

    if (workerId) {
      return this.offersService.listOffersForWorker(workerId, statusArray);
    }

    if (employerId) {
      return this.offersService.listOffersForEmployer(employerId, statusArray);
    }

    throw new BadRequestException('workerId or employerId is required');
  }
}
