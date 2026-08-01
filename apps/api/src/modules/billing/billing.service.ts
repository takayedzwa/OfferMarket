import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Invoice } from '@prisma/client';
import { ListInvoicesQueryDto, AdminListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';

// Default billing settings (fallbacks when AdminSettings are not configured)
const DEFAULTS = {
  introduction_fee_cents: 49900,
  vat_rate_pct: 21,
  invoice_payment_terms_days: 14,
  invoice_bank_account_iban: '',
  invoice_bank_account_name: 'OfferMarket B.V.',
  invoice_prefix: 'INV',
};

// Allow-list of billing setting keys (mass-assignment guard). Only these keys
// may be written through the admin billing-settings endpoint; any other key is
// rejected so an admin can't pollute AdminSettings with arbitrary billing
// entries that the invoice flow would never read.
const BILLING_SETTING_KEYS = new Set(Object.keys(DEFAULTS));

// Per-key value validation. Each billing setting has an expected type/range;
// validating here prevents storing a nonsensical value (e.g. a negative fee or
// a 200% VAT rate) that would silently break invoice generation.
function validateBillingSettingValue(key: string, value: any): void {
  switch (key) {
    case 'introduction_fee_cents':
      if (!Number.isInteger(value) || value < 0) {
        throw new BadRequestException('introduction_fee_cents must be a non-negative integer (cents)');
      }
      break;
    case 'vat_rate_pct':
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
        throw new BadRequestException('vat_rate_pct must be a number between 0 and 100');
      }
      break;
    case 'invoice_payment_terms_days':
      if (!Number.isInteger(value) || value < 0 || value > 365) {
        throw new BadRequestException('invoice_payment_terms_days must be an integer between 0 and 365');
      }
      break;
    case 'invoice_bank_account_iban':
    case 'invoice_bank_account_name':
    case 'invoice_prefix':
      if (typeof value !== 'string' || value.trim() === '') {
        throw new BadRequestException(`${key} must be a non-empty string`);
      }
      break;
  }
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Invoice Creation (called within offer acceptance transaction)
  // ---------------------------------------------------------------------------

  async generateInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const prefix = await this.getSetting(tx, 'invoice_prefix', DEFAULTS.invoice_prefix) as string;
    const now = new Date();
    const year = now.getFullYear();

    // Find the highest invoice number for this year
    const lastInvoice = await tx.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `${prefix}-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
  }

  async createIntroductionInvoice(
    tx: Prisma.TransactionClient,
    employerId: string,
    offerId: string,
  ): Promise<Invoice> {
    // Read billing settings (use defaults as fallback)
    const feeCents = await this.getSetting(tx, 'introduction_fee_cents', DEFAULTS.introduction_fee_cents) as number;
    const vatRatePct = await this.getSetting(tx, 'vat_rate_pct', DEFAULTS.vat_rate_pct) as number;
    const paymentTermsDays = await this.getSetting(tx, 'invoice_payment_terms_days', DEFAULTS.invoice_payment_terms_days) as number;

    // Get offer details for the line item description
    const offer = await tx.offer.findUnique({
      where: { id: offerId },
      select: { jobTitle: true },
    });

    const vatAmountCents = Math.round(feeCents * (vatRatePct / 100));
    const totalCents = feeCents + vatAmountCents;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    const invoiceNumber = await this.generateInvoiceNumber(tx);

    const description = offer
      ? `Introduction fee: ${offer.jobTitle}`
      : 'Introduction fee';

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        employerId,
        offerId,
        status: 'ISSUED',
        currency: 'EUR',
        subtotalCents: feeCents,
        vatRatePct,
        vatAmountCents,
        totalCents,
        dueDate,
        issuedAt: new Date(),
        lineItems: {
          create: {
            description,
            quantity: 1,
            unitPriceCents: feeCents,
            totalCents: feeCents,
          },
        },
      },
      include: { lineItems: true, employer: true, offer: true },
    });

    return invoice;
  }

  // ---------------------------------------------------------------------------
  // Employer-facing methods
  // ---------------------------------------------------------------------------

  async getEmployerInvoices(employerId: string, query: ListInvoicesQueryDto) {
    const { unpaidOnly, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { employerId };

    if (unpaidOnly) {
      where.status = { in: ['ISSUED', 'OVERDUE'] };
    } else if (status) {
      where.status = status as Prisma.EnumInvoiceStatusFilter;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          lineItems: true,
          offer: { select: { id: true, jobTitle: true, publicId: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceDetail(invoiceId: string, employerId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        employer: {
          select: {
            id: true,
            companyName: true,
            billingEmail: true,
            user: { select: { email: true } },
          },
        },
        offer: { select: { id: true, jobTitle: true, publicId: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Verify ownership if employerId is provided
    if (employerId && invoice.employerId !== employerId) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getEmployerInvoiceSummary(employerId: string) {
    const [unpaidInvoices, totalOutstanding] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          employerId,
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
        select: { dueDate: true, totalCents: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.invoice.aggregate({
        where: {
          employerId,
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
        _sum: { totalCents: true },
      }),
    ]);

    return {
      unpaidCount: unpaidInvoices.length,
      outstandingCents: totalOutstanding._sum.totalCents || 0,
      nextDueDate: unpaidInvoices.length > 0 ? unpaidInvoices[0].dueDate : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Admin methods
  // ---------------------------------------------------------------------------

  async adminGetInvoices(query: AdminListInvoicesQueryDto) {
    const { employerId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};
    if (employerId) where.employerId = employerId;
    if (status) where.status = status as Prisma.EnumInvoiceStatusFilter;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          lineItems: true,
          employer: {
            select: {
              id: true,
              companyName: true,
              billingEmail: true,
              user: { select: { email: true } },
            },
          },
          offer: { select: { id: true, jobTitle: true, publicId: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markInvoicePaid(invoiceId: string, dto: MarkInvoicePaidDto, adminUserId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot mark a cancelled invoice as paid');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: dto.paymentMethod || 'bank_transfer',
        paymentReference: dto.paymentReference,
        notes: dto.notes,
      },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        actorId: adminUserId,
        action: 'INVOICE_MARKED_PAID',
        entityType: 'invoice',
        entityId: invoiceId,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          totalCents: invoice.totalCents,
          paymentReference: dto.paymentReference,
        },
      },
    });

    return updated;
  }

  async cancelInvoice(invoiceId: string, adminUserId: string, reason?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { offer: { select: { id: true, status: true } } },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    // Reverse the associated offer state alongside the cancellation. The
    // introduction-fee invoice is created at offer acceptance, so an ACCEPTED
    // offer whose (never-paid) invoice is cancelled should not remain in the
    // terminal ACCEPTED state as if it were a finalized, billed placement.
    // Revert it to SHORTLISTED so it re-enters the active pool.
    //
    // CAVEAT: worker identity was revealed and a Conversation was created at
    // acceptance; cancelling the invoice does not un-reveal that data. That is
    // a separate cleanup concern — here we only correct the offer lifecycle
    // state so it is no longer marked as a completed billed placement.
    const offer = invoice.offer;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'CANCELLED',
          notes: reason || invoice.notes,
        },
      });

      let offerReverted = false;
      if (offer && offer.status === 'ACCEPTED') {
        await tx.offer.update({
          where: { id: offer.id },
          data: {
            status: 'SHORTLISTED',
            acceptedAt: null,
          },
        });
        offerReverted = true;
      }

      // Log admin action
      await tx.adminAction.create({
        data: {
          actorId: adminUserId,
          action: 'INVOICE_CANCELLED',
          entityType: 'invoice',
          entityId: invoiceId,
          details: {
            invoiceNumber: invoice.invoiceNumber,
            reason,
            offerId: offer?.id,
            offerReverted,
            previousOfferStatus: offer?.status,
          },
        },
      });

      return updated;
    });
  }

  async checkOverdueInvoices(): Promise<number> {
    // Wrap the overdue flip in a transaction. A single updateMany is already
    // atomic at the SQL level, but scoping it in $transaction guarantees that
    // if per-invoice side effects (notifications, employer billing-state
    // updates) are added later, they stay consistent with the status change.
    const result = await this.prisma.$transaction(
      tx =>
        tx.invoice.updateMany({
          where: {
            status: 'ISSUED',
            dueDate: { lt: new Date() },
          },
          data: {
            status: 'OVERDUE',
          },
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return result.count;
  }

  async getBillingStats() {
    const [
      totalInvoices,
      totalPaidInvoices,
      totalUnpaidInvoices,
      totalOverdueInvoices,
      revenueAggregate,
      paidAggregate,
      outstandingAggregate,
    ] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
      this.prisma.invoice.count({ where: { status: { in: ['ISSUED', 'OVERDUE'] } } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.invoice.aggregate({ _sum: { totalCents: true } }),
      this.prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalCents: true } }),
      this.prisma.invoice.aggregate({ where: { status: { in: ['ISSUED', 'OVERDUE'] } }, _sum: { totalCents: true } }),
    ]);

    // Calculate average days to payment
    const paidInvoices = await this.prisma.invoice.findMany({
      where: { status: 'PAID', paidAt: { not: null } },
      select: { issuedAt: true, paidAt: true },
    });

    let averageDaysToPayment = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum, inv) => {
        const days = (inv.paidAt!.getTime() - inv.issuedAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageDaysToPayment = Math.round(totalDays / paidInvoices.length);
    }

    return {
      totalInvoices,
      totalPaidInvoices,
      totalUnpaidInvoices,
      totalOverdueInvoices,
      totalRevenueCents: revenueAggregate._sum.totalCents || 0,
      totalPaidCents: paidAggregate._sum.totalCents || 0,
      totalOutstandingCents: outstandingAggregate._sum.totalCents || 0,
      averageDaysToPayment,
    };
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async getBillingSettings() {
    const settings = await this.prisma.adminSettings.findMany({
      where: { category: 'billing' },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    // Fill in defaults for missing settings
    for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
      if (!(key in result)) {
        result[key] = defaultValue;
      }
    }

    return result;
  }

  async updateBillingSetting(key: string, value: any, adminUserId: string) {
    // Mass-assignment guard: only known billing keys are writable, and the
    // value must match the expected type/range for that key.
    if (!BILLING_SETTING_KEYS.has(key)) {
      throw new BadRequestException(
        `Unknown billing setting key: ${key}. Allowed keys: ${[...BILLING_SETTING_KEYS].join(', ')}`,
      );
    }
    validateBillingSettingValue(key, value);

    const setting = await this.prisma.adminSettings.upsert({
      where: { key },
      update: { value, category: 'billing', updatedBy: adminUserId },
      create: { key, value, category: 'billing', updatedBy: adminUserId },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        actorId: adminUserId,
        action: 'BILLING_SETTING_UPDATED',
        entityType: 'setting',
        entityId: key,
        details: { key, value },
      },
    });

    return setting;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  async getEmployerByUserId(userId: string) {
    return this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  private async getSetting(
    tx: Prisma.TransactionClient,
    key: string,
    defaultValue: any,
  ): Promise<any> {
    const setting = await tx.adminSettings.findUnique({ where: { key } });
    return setting ? setting.value : defaultValue;
  }
}