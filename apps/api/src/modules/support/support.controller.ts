import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
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
  @Throttle({ short: { ttl: 60000, limit: 30 } })
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
      parsePage(page),
      parseLimit(limit),
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
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async createTicketOnBehalf(@Body() data: CreateTicketOnBehalfDto) {
    return this.supportService.createTicketOnBehalf(data);
  }

  @Get('tickets')
  @UseGuards(SupportGuard)
  async getTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTickets(
      parsePage(page),
      parseLimit(limit),
      { status, priority, category, search },
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
      parsePage(page),
      parseLimit(limit, 50),
    );
  }

  @Post('tickets/:id/reply')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 60 } })
  async replyToTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: TicketReplyDto,
  ) {
    return this.supportService.replyToTicket(id, req.user.id, dto.content, dto.isInternal);
  }

  // A-M: partial update of an existing ticket resource -> PATCH (consistent
  // with /assign). Previously POST, which was an inconsistent HTTP method for
  // a partial mutation.
  @Patch('tickets/:id/status')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 60 } })
  async updateTicketStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
    @Body('expectedUpdatedAt') expectedUpdatedAt?: string,
  ) {
    return this.supportService.updateTicketStatus(id, status, req.user.id, expectedUpdatedAt);
  }

  @Post('tickets/:id/close')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async closeTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Query('expectedUpdatedAt') expectedUpdatedAt?: string,
  ) {
    return this.supportService.closeTicket(id, req.user.id, expectedUpdatedAt);
  }

  @Post('tickets/:id/resolve')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async resolveTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Query('expectedUpdatedAt') expectedUpdatedAt?: string,
  ) {
    return this.supportService.resolveTicket(id, req.user.id, expectedUpdatedAt);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async assignTicket(
    @Param('id') id: string,
    @Body() data: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, data.assignedToId);
  }

  // A-L4: dedicated unassign endpoint — clears assignedToId (sets to null)
  // rather than letting the frontend send an empty string through /assign.
  @Delete('tickets/:id/assign')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async unassignTicket(@Param('id') id: string) {
    return this.supportService.unassignTicket(id);
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
  async getUserById(@Param('id') id: string, @Request() req: any) {
    return this.supportService.getUserById(id, req.user.id);
  }

  @Get('users/:id/offers')
  @UseGuards(SupportGuard)
  async getUserOffers(@Param('id') id: string, @Request() req: any) {
    return this.supportService.getUserOffers(id, req.user.id);
  }

  @Get('users/:id/tickets')
  @UseGuards(SupportGuard)
  async getUserTickets(
    @Param('id') id: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getUserTickets(
      id,
      parsePage(page),
      parseLimit(limit),
      req.user.id,
    );
  }

  @Get('conversations/:id')
  @UseGuards(SupportGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  async getConversationById(@Param('id') id: string, @Request() req: any) {
    return this.supportService.getConversationById(id, req.user.id);
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