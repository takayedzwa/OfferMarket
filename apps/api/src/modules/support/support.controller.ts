import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { SupportGuard } from '../../guards/support.guard';
import { CreateTicketDto, TicketReplyDto, AssignTicketDto } from './dto/create-ticket.dto';

@Controller('support')
@UseGuards(SupportGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  @Get('dashboard')
  async getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  // ============================================================================
  // TICKET MANAGEMENT
  // ============================================================================

  @Get('tickets')
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
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Get('tickets/:id/messages')
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

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(@Request() req: any, @Body() data: CreateTicketDto) {
    // SECURITY: userId comes from the JWT token, not the request body,
    // preventing IDOR attacks where users could create tickets for other users.
    const userId = req.user.id;
    return this.supportService.createTicket({ ...data, userId });
  }

  @Post('tickets/:id/reply')
  async replyToTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: TicketReplyDto,
  ) {
    return this.supportService.replyToTicket(id, req.user.id, dto.content, dto.isInternal);
  }

  @Post('tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status, req.user.id);
  }

  @Post('tickets/:id/close')
  async closeTicket(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.supportService.closeTicket(id, req.user.id);
  }

  @Post('tickets/:id/resolve')
  async resolveTicket(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.supportService.resolveTicket(id, req.user.id);
  }

  @Patch('tickets/:id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body() data: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, data.assignedToId);
  }

  // ============================================================================
  // USER LOOKUP & ASSISTANCE
  // ============================================================================

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.supportService.getUserById(id);
  }

  @Get('users/:id/offers')
  async getUserOffers(@Param('id') id: string) {
    return this.supportService.getUserOffers(id);
  }

  @Get('users/:id/tickets')
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
  async getConversationById(@Param('id') id: string) {
    return this.supportService.getConversationById(id);
  }

  @Post('users/:workerId/unblock/:employerId')
  async unblockCompany(
    @Param('workerId') workerId: string,
    @Param('employerId') employerId: string,
    @Request() req: any,
  ) {
    return this.supportService.unblockCompany(workerId, employerId, req.user.id);
  }

  @Post('offers/:id/extend')
  async extendOfferExpiry(
    @Param('id') offerId: string,
    @Request() req: any,
    @Body('days') days: number,
  ) {
    return this.supportService.extendOfferExpiry(offerId, days, req.user.id);
  }

  // ============================================================================
  // USER TICKETS (for user-facing API)
  // ============================================================================

  @Get('my-tickets')
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
}