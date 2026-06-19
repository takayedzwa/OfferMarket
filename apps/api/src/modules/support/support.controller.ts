import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Post('tickets')
  async createTicket(@Body() data: CreateTicketDto) {
    return this.supportService.createTicket(data);
  }

  @Post('tickets/:id/reply')
  async replyToTicket(
    @Param('id') id: string,
    @Query('senderId') senderId: string,
    @Body('content') content: string,
    @Body('isInternal') isInternal?: boolean,
  ) {
    return this.supportService.replyToTicket(id, senderId, content, isInternal);
  }

  @Post('tickets/:id/close')
  async closeTicket(
    @Param('id') id: string,
    @Query('resolverId') resolverId: string,
  ) {
    return this.supportService.closeTicket(id, resolverId);
  }

  @Post('tickets/:id/resolve')
  async resolveTicket(
    @Param('id') id: string,
    @Query('resolverId') resolverId: string,
  ) {
    return this.supportService.resolveTicket(id, resolverId);
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

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string) {
    return this.supportService.getConversationById(id);
  }

  @Post('users/:workerId/unblock/:employerId')
  async unblockCompany(
    @Param('workerId') workerId: string,
    @Param('employerId') employerId: string,
    @Query('supportUserId') supportUserId: string,
  ) {
    return this.supportService.unblockCompany(workerId, employerId, supportUserId);
  }

  @Post('offers/:id/extend')
  async extendOfferExpiry(
    @Param('id') offerId: string,
    @Query('supportUserId') supportUserId: string,
    @Body('days') days: number,
  ) {
    return this.supportService.extendOfferExpiry(offerId, days, supportUserId);
  }

  // ============================================================================
  // USER TICKETS (for user-facing API)
  // ============================================================================

  @Get('my-tickets')
  async getUserTickets(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getUserTickets(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
