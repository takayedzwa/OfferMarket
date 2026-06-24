import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
  Request
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

/**
 * SimpleAuthGuard - extracts userId from header
 * In production, this would be replaced with proper JWT authentication
 */
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId };
    return true;
  }
}

/**
 * AdminAuthGuard - validates admin user
 */
class AdminAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
      throw new BadRequestException('Admin or Support role required');
    }

    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // ============================================================================
  // CREATE RATING
  // ============================================================================

  /**
   * POST /ratings
   * Create a new employer rating
   *
   * Workers can rate employers after receiving an offer on:
   * - Interview experience (1-5)
   * - Transparency (1-5)
   * - Communication (1-5)
   * - Offer accuracy (1-5)
   * - Work-life balance (1-5)
   * - Would work there again (boolean)
   */
  @Post()
  @UseGuards(SimpleAuthGuard)
  async createRating(
    @Body() createRatingDto: CreateRatingDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.ratingsService.createRating(userId, createRatingDto);
  }

  // ============================================================================
  // UPDATE RATING
  // ============================================================================

  /**
   * PATCH /ratings/:id
   * Update an existing rating (only by original rater)
   */
  @Patch(':id')
  @UseGuards(SimpleAuthGuard)
  async updateRating(
    @Param('id') ratingId: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.ratingsService.updateRating(ratingId, userId, updateRatingDto);
  }

  // ============================================================================
  // GET EMPLOYER RATINGS
  // ============================================================================

  /**
   * GET /ratings/employer/:employerId
   * Get all published ratings for an employer
   */
  @Get('employer/:employerId')
  async getEmployerRatings(
    @Param('employerId') employerId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    return this.ratingsService.getEmployerRatings(employerId, limit, offset);
  }

  /**
   * GET /ratings/employer/:employerId/stats
   * Get rating statistics and trust score for an employer
   */
  @Get('employer/:employerId/stats')
  async getEmployerRatingStats(@Param('employerId') employerId: string) {
    return this.ratingsService.getEmployerRatingStats(employerId);
  }

  /**
   * GET /ratings/employer/:employerId/trust-score
   * Get detailed trust score breakdown for an employer
   */
  @Get('employer/:employerId/trust-score')
  async getEmployerTrustScore(@Param('employerId') employerId: string) {
    return this.ratingsService.calculateTrustScore(employerId);
  }

  // ============================================================================
  // GET USER RATINGS
  // ============================================================================

  /**
   * GET /ratings/my
   * Get all ratings submitted by the current user
   */
  @Get('my')
  @UseGuards(SimpleAuthGuard)
  async getMyRatings(@Request() req: any) {
    const userId = req.user.id;
    return this.ratingsService.getMyRatings(userId);
  }

  /**
   * GET /ratings/:id
   * Get a specific rating by ID
   */
  @Get(':id')
  async getRatingById(
    @Param('id') ratingId: string,
    @Query('userId') userId?: string
  ) {
    return this.ratingsService.getRatingById(ratingId, userId);
  }

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  /**
   * POST /ratings/:id/flag
   * Flag a rating for review (admin only)
   */
  @Post(':id/flag')
  @UseGuards(AdminAuthGuard)
  async flagRating(
    @Param('id') ratingId: string,
    @Query('userId') adminUserId: string
  ) {
    if (!adminUserId) {
      throw new BadRequestException('Admin userId is required');
    }
    return this.ratingsService.flagRating(ratingId, adminUserId);
  }

  /**
   * POST /ratings/:id/unflag
   * Remove flag from a rating (admin only)
   */
  @Post(':id/unflag')
  @UseGuards(AdminAuthGuard)
  async unflagRating(@Param('id') ratingId: string) {
    return this.ratingsService.unflagRating(ratingId);
  }

  /**
   * PATCH /ratings/:id/publish
   * Toggle rating publication status (admin only)
   */
  @Patch(':id/publish')
  @UseGuards(AdminAuthGuard)
  async toggleRatingPublication(
    @Param('id') ratingId: string,
    @Body() body: { isPublished: boolean }
  ) {
    return this.ratingsService.toggleRatingPublication(ratingId, body.isPublished);
  }
}
