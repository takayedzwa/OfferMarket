import { Controller, Get, Post, Patch, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { ListInvoicesQueryDto, AdminListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { AdminGuard } from '../../guards/admin.guard';

// Simple auth guard (consistent with existing controllers)
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];
    if (!userId || !userRole) {
      return false;
    }
    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ---------------------------------------------------------------------------
  // Employer-facing endpoints
  // ---------------------------------------------------------------------------

  @Get('invoices')
  @UseGuards(SimpleAuthGuard)
  async getMyInvoices(
    @Request() req: any,
    @Query() query: ListInvoicesQueryDto,
  ) {
    // Find the employer for the current user
    const employer = await this.billingService.getEmployerByUserId(req.user.id);
    if (!employer) {
      return { invoices: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    return this.billingService.getEmployerInvoices(employer.id, query);
  }

  @Get('invoices/summary')
  @UseGuards(SimpleAuthGuard)
  async getMyInvoiceSummary(@Request() req: any) {
    const employer = await this.billingService.getEmployerByUserId(req.user.id);
    if (!employer) {
      return { unpaidCount: 0, outstandingCents: 0, nextDueDate: null };
    }

    return this.billingService.getEmployerInvoiceSummary(employer.id);
  }

  @Get('invoices/:id')
  @UseGuards(SimpleAuthGuard)
  async getInvoiceDetail(@Param('id') id: string, @Request() req: any) {
    const employer = await this.billingService.getEmployerByUserId(req.user.id);
    const employerId = employer?.id;
    return this.billingService.getInvoiceDetail(id, employerId);
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  @Get('admin/invoices')
  @UseGuards(AdminGuard)
  async adminGetInvoices(@Query() query: AdminListInvoicesQueryDto) {
    return this.billingService.adminGetInvoices(query);
  }

  @Get('admin/invoices/:id')
  @UseGuards(AdminGuard)
  async adminGetInvoiceDetail(@Param('id') id: string) {
    return this.billingService.getInvoiceDetail(id);
  }

  @Post('admin/invoices/:id/mark-paid')
  @UseGuards(AdminGuard)
  async markInvoicePaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
    @Request() req: any,
  ) {
    return this.billingService.markInvoicePaid(id, dto, req.user.id);
  }

  @Post('admin/invoices/:id/cancel')
  @UseGuards(AdminGuard)
  async cancelInvoice(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.billingService.cancelInvoice(id, req.user.id, body?.reason);
  }

  @Post('admin/check-overdue')
  @UseGuards(AdminGuard)
  async checkOverdue() {
    const count = await this.billingService.checkOverdueInvoices();
    return { overdueCount: count };
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getBillingStats() {
    return this.billingService.getBillingStats();
  }

  @Get('admin/settings')
  @UseGuards(AdminGuard)
  async getBillingSettings() {
    return this.billingService.getBillingSettings();
  }

  @Patch('admin/settings')
  @UseGuards(AdminGuard)
  async updateBillingSetting(
    @Body() body: { key: string; value: any },
    @Request() req: any,
  ) {
    return this.billingService.updateBillingSetting(body.key, body.value, req.user.id);
  }
}