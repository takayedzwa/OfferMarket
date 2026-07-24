import { Controller, Get, Post, Patch, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { ListInvoicesQueryDto, AdminListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminGuard } from '../../guards/admin.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ---------------------------------------------------------------------------
  // Employer-facing endpoints
  // ---------------------------------------------------------------------------

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async getMyInvoiceSummary(@Request() req: any) {
    const employer = await this.billingService.getEmployerByUserId(req.user.id);
    if (!employer) {
      return { unpaidCount: 0, outstandingCents: 0, nextDueDate: null };
    }

    return this.billingService.getEmployerInvoiceSummary(employer.id);
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async getInvoiceDetail(@Param('id') id: string, @Request() req: any) {
    const employer = await this.billingService.getEmployerByUserId(req.user.id);
    const employerId = employer?.id;
    return this.billingService.getInvoiceDetail(id, employerId);
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminGetInvoices(@Query() query: AdminListInvoicesQueryDto) {
    return this.billingService.adminGetInvoices(query);
  }

  @Get('admin/invoices/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminGetInvoiceDetail(@Param('id') id: string) {
    return this.billingService.getInvoiceDetail(id);
  }

  @Post('admin/invoices/:id/mark-paid')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async markInvoicePaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
    @Request() req: any,
  ) {
    return this.billingService.markInvoicePaid(id, dto, req.user.id);
  }

  @Post('admin/invoices/:id/cancel')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async cancelInvoice(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.billingService.cancelInvoice(id, req.user.id, body?.reason);
  }

  @Post('admin/check-overdue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async checkOverdue() {
    const count = await this.billingService.checkOverdueInvoices();
    return { overdueCount: count };
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getBillingStats() {
    return this.billingService.getBillingStats();
  }

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getBillingSettings() {
    return this.billingService.getBillingSettings();
  }

  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateBillingSetting(
    @Body() body: { key: string; value: any },
    @Request() req: any,
  ) {
    return this.billingService.updateBillingSetting(body.key, body.value, req.user.id);
  }
}