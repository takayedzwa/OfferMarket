import { Controller, Get, Post, Patch, Delete, Body, Param, Query, BadRequestException, UseGuards, Request } from '@nestjs/common';
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
  async createOffer(
    @Body(new OfferValidationPipe()) createOfferDto: any,
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
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.offersService.getOfferForWorker(id, userId);
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
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.offersService.acceptOffer(id, userId);
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
    @Request() req: any,
    @Body('reason') reason?: string,
    @Body('feedback') feedback?: string
  ) {
    const userId = req.user.id;
    return this.offersService.rejectOffer(id, userId, reason, feedback);
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
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.offersService.shortlistOffer(id, userId);
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
    @Request() req: any,
    @Body() counterOfferDto: CounterOfferDto
  ) {
    const userId = req.user.id;
    return this.offersService.counterOffer(id, userId, counterOfferDto);
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

  /**
   * GET /offers/worker/me
   *
   * List offers for the authenticated worker
   */
  @Get('worker/me')
  @UseGuards(SimpleAuthGuard)
  async listOffersForWorkerMe(
    @Request() req: any,
    @Query('status') status?: string
  ) {
    const workerId = req.user.id;
    const statusArray = status ? status.split(',') : undefined;
    return this.offersService.listOffersForWorker(workerId, statusArray);
  }

  /**
   * GET /offers/:id/detail
   *
   * View offer details (employer perspective)
   */
  @Get(':id/detail')
  @UseGuards(SimpleAuthGuard)
  async getOfferDetail(
    @Param('id') id: string,
    @Query('employerId') employerId: string
  ) {
    if (!employerId) {
      throw new BadRequestException('employerId is required');
    }

    return this.offersService.getOfferForEmployer(id, employerId);
  }

  /**
   * PATCH /offers/:id
   *
   * Update an offer (employer only - creates new version)
   */
  @Patch(':id')
  @UseGuards(SimpleAuthGuard)
  async updateOffer(
    @Param('id') id: string,
    @Query('employerId') employerId: string,
    @Body() updateOfferDto: any
  ) {
    if (!employerId) {
      throw new BadRequestException('employerId is required');
    }

    return this.offersService.updateOffer(id, employerId, updateOfferDto);
  }

  /**
   * POST /offers/:id/submit
   *
   * Submit a DRAFT offer to the worker (employer only)
   */
  @Post(':id/submit')
  @UseGuards(SimpleAuthGuard)
  async submitOffer(
    @Param('id') id: string,
    @Query('employerId') employerId: string
  ) {
    if (!employerId) {
      throw new BadRequestException('employerId is required');
    }

    return this.offersService.submitOffer(id, employerId);
  }
}
