import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { SupportGuard } from '../../guards/support.guard';
import { SupportService } from './support.service';
import { CreateTicketDto, CreateTicketOnBehalfDto, TicketReplyDto, AssignTicketDto, ExtendOfferExpiryDto } from './dto/create-ticket.dto';
import { parsePage, parseLimit } from '../../common/utils/pagination';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ============================================================================
  // USER-FACING ENDPOINTS (any authenticated user)
  // SECURITY: Workers can create tickets and view their own tickets.
  // Admin/Support-only endpoints are protected by SupportGuard below.
  // ============================================================================

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(@Request() req: any, @Body() data: CreateTicketDto) {
    // SECURITY: userId comes from the JWT token, not the request body,
    // preventing IDOR attacks where users could create tickets for other users.
    const userId = req.user.id;
    return this.supportService.createTicket({ ...data, userId });
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  async getMyTickets(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getUserTickets(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ============================================================================
  // ADMIN/SUPPORT-ONLY ENDPOINTS
  // SECURITY: These endpoints are restricted to ADMIN and SUPPORT roles.
  // Workers should not have access to the full ticket management dashboard,
  // user lookup, or ticket assignment functionality.
  // ============================================================================

  @Get('dashboard')
  @UseGuards(SupportGuard)
  async getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  // ============================================================================
  // CREATE TICKET ON BEHALF OF A USER (Admin/Support only)
  // SECURITY: Unlike POST /support/tickets (user-facing, userId from JWT), this
  // endpoint lets staff create a ticket attributed to a specific user. The
  // target userId is supplied in the body and the caller is authenticated +
  // role-checked by SupportGuard, so IDOR is not a concern.
  // ============================================================================

  @Post('tickets/on-behalf')
  @UseGuards(SupportGuard)
  async createTicketOnBehalf(@Body() data: CreateTicketOnBehalfDto) {
    return this.supportService.createTicketOnBehalf(data);
  }

  @Get('tickets')
  @UseGuards(SupportGuard)
  async getTickets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTickets(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('tickets/:id')
  @UseGuards(SupportGuard)
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Get('tickets/:id/messages')
  @UseGuards(SupportGuard)
  async getTicketMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTicketMessages(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('tickets/:id/reply')
  @UseGuards(SupportGuard)
  async replyToTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: TicketReplyDto,
  ) {
    return this.supportService.replyToTicket(id, req.user.id, dto.content, dto.isInternal);
  }

  @Post('tickets/:id/status')
  @UseGuards(SupportGuard)
  async updateTicketStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status, req.user.id);
  }

  @Post('tickets/:id/close')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async closeTicket(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.supportService.closeTicket(id, req.user.id);
  }

  @Post('tickets/:id/resolve')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async resolveTicket(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.supportService.resolveTicket(id, req.user.id);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(SupportGuard)
  async assignTicket(
    @Param('id') id: string,
    @Body() data: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, data.assignedToId);
  }

  // ============================================================================
  // USER LOOKUP & ASSISTANCE (Admin/Support only)
  // ============================================================================

  /**
   * Search/list users (Admin/Support only). Used by the support user-lookup
   * page and the "new ticket" user picker so staff don't need to know UUIDs.
   */
  @Get('users')
  @UseGuards(SupportGuard)
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.supportService.getUsers(
      parsePage(page),
      parseLimit(limit),
      { search, role, status },
    );
  }

  @Get('users/:id')
  @UseGuards(SupportGuard)
  async getUserById(@Param('id') id: string) {
    return this.supportService.getUserById(id);
  }

  @Get('users/:id/offers')
  @UseGuards(SupportGuard)
  async getUserOffers(@Param('id') id: string) {
    return this.supportService.getUserOffers(id);
  }

  @Get('users/:id/tickets')
  @UseGuards(SupportGuard)
  async getUserTickets(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getUserTickets(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('conversations/:id')
  @UseGuards(SupportGuard)
  async getConversationById(@Param('id') id: string) {
    return this.supportService.getConversationById(id);
  }

  @Post('users/:workerId/unblock/:employerId')
  @UseGuards(SupportGuard)
  async unblockCompany(
    @Param('workerId') workerId: string,
    @Param('employerId') employerId: string,
    @Request() req: any,
  ) {
    return this.supportService.unblockCompany(workerId, employerId, req.user.id);
  }

  @Post('offers/:id/extend')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async extendOfferExpiry(
    @Param('id') offerId: string,
    @Request() req: any,
    @Body() dto: ExtendOfferExpiryDto,
  ) {
    // A-M3: days is validated as a positive integer via the DTO.
    return this.supportService.extendOfferExpiry(offerId, dto.days, req.user.id);
  }
}