import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DsaService } from './dsa.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import {
  CreateContentReportDto,
  AssessContentReportDto,
  TakeActionDto,
  ResolveContentReportDto,
  EscalateToAuthoritiesDto,
  CreateStatementOfReasonsDto,
  CreateDSAComplaintDto,
  ComplaintMessageDto,
  FlagMisuseDto,
  GenerateTransparencyReportDto,
} from './dto/dsa.dto';
import {
  ContentReportStatus,
  ContentReportCategory,
  ContentReportPriority,
  ContentReportTarget,
  DSAComplaintType,
  DSAComplaintStatus,
} from '@prisma/client';
import { parsePage, parseLimit } from '../../common/utils/pagination';

/**
 * DSA (Digital Services Act) Controller
 *
 * Endpoints grouped by DSA article:
 * - Art. 16: Notice-and-action (public + authenticated)
 * - Art. 17: Statement of reasons (admin)
 * - Art. 20: Internal complaint-handling (authenticated + admin)
 * - Art. 23: Misuse tracking (admin)
 * - Art. 15/24: Transparency reporting (public + admin)
 */
@Controller('dsa')
export class DsaController {
  constructor(private readonly dsaService: DsaService) {}

  // ============================================================================
  // CONTENT REPORTS — DSA Art. 16: Notice-and-Action
  // ============================================================================

  /**
   * Submit an illegal content notice.
   * DSA Art. 16: Must be easy to access, user-friendly, and allow electronic submission.
   * Anonymous submissions are permitted but require an email for acknowledgment.
   */
  @Post('reports')
  async submitContentReport(
    @Body() dto: CreateContentReportDto,
    @Request() req: any,
  ) {
    const reporterId = req.user?.id || null;
    const reporterIp = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0];
    const reporterUserAgent = req?.headers?.['user-agent'];

    return this.dsaService.submitContentReport(
      dto,
      reporterId,
      reporterIp,
      reporterUserAgent,
    );
  }

  /**
   * Check the status of a report by its public ID.
   * DSA Art. 16(4): Reporters must be able to track their submissions.
   */
  @Get('reports/:publicId/status')
  async getReportStatus(@Param('publicId') publicId: string) {
    return this.dsaService.getReportByPublicId(publicId);
  }

  /**
   * Get the authenticated user's own reports.
   */
  @Get('reports/my-reports')
  @UseGuards(JwtAuthGuard)
  async getMyReports(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.getUserReports(
      userId,
      parsePage(page),
      parseLimit(limit),
    );
  }

  // ============================================================================
  // ADMIN: CONTENT MODERATION
  // ============================================================================

  /**
   * List all content reports (admin).
   * Supports filtering by status, category, priority, and target type.
   */
  @Get('admin/reports')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getAllReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ContentReportStatus,
    @Query('category') category?: ContentReportCategory,
    @Query('priority') priority?: ContentReportPriority,
    @Query('targetType') targetType?: ContentReportTarget,
  ) {
    return this.dsaService.getAllReports(
      parsePage(page),
      parseLimit(limit),
      { status, category, priority, targetType },
    );
  }

  /**
   * Get a single report with full details (admin).
   */
  @Get('admin/reports/:id')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getReportById(@Param('id') id: string) {
    return this.dsaService.getReportById(id);
  }

  /**
   * Assign a report to a staff member (admin).
   */
  @Patch('admin/reports/:id/assign')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async assignReport(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.assignReport(id, adminId);
  }

  /**
   * Assess a content report (admin).
   * Determine whether content violates terms or is illegal.
   */
  @Patch('admin/reports/:id/assess')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async assessReport(
    @Param('id') id: string,
    @Body() dto: AssessContentReportDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.assessReport(id, adminId, dto);
  }

  /**
   * Take action on a content report (admin).
   * When content is restricted, a statement of reasons is required (DSA Art. 17).
   */
  @Patch('admin/reports/:id/action')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async takeAction(
    @Param('id') id: string,
    @Body() dto: TakeActionDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.takeAction(id, adminId, dto);
  }

  /**
   * Resolve a content report (admin).
   */
  @Patch('admin/reports/:id/resolve')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveContentReportDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.resolveReport(id, adminId, dto);
  }

  /**
   * Escalate a report to authorities (admin).
   * DSA Art. 18: Required when suspecting criminal offences.
   */
  @Post('admin/reports/:id/escalate')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async escalateToAuthorities(
    @Param('id') id: string,
    @Body() dto: EscalateToAuthoritiesDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.escalateToAuthorities(id, adminId, dto);
  }

  // ============================================================================
  // STATEMENT OF REASONS — DSA Art. 17
  // ============================================================================

  /**
   * Create a statement of reasons when content is restricted.
   * DSA Art. 17: Affected users must receive a clear statement of reasons.
   */
  @Post('admin/reports/:id/statement-of-reasons')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async createStatementOfReasons(
    @Param('id') reportId: string,
    @Body() dto: CreateStatementOfReasonsDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.createStatementOfReasons(reportId, adminId, dto);
  }

  // ============================================================================
  // DSA COMPLAINTS — Art. 20: Internal Complaint-Handling
  // ============================================================================

  /**
   * Submit a complaint about a content moderation decision.
   * DSA Art. 20: Must be electronic, free of charge, and handled in a reasonable timeframe.
   */
  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  async submitComplaint(
    @Body() dto: CreateDSAComplaintDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    // A-H6: previously this fell back to dto.contentReportId (a report ID, not
    // an email) when the JWT had no email claim, storing a report ID as the
    // complainant email. The service now resolves the email from the user
    // record when it is not present here.
    const email = req.user?.email;
    return this.dsaService.submitComplaint(userId, email, dto);
  }

  /**
   * Get the authenticated user's own complaints.
   */
  @Get('complaints/my-complaints')
  @UseGuards(JwtAuthGuard)
  async getMyComplaints(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.getUserComplaints(
      userId,
      parsePage(page),
      parseLimit(limit),
    );
  }

  /**
   * Get a specific complaint (only the complainant can view).
   */
  @Get('complaints/:id')
  @UseGuards(JwtAuthGuard)
  async getComplaintById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.getComplaintById(id, userId);
  }

  /**
   * Add a message to a complaint.
   */
  @Post('complaints/:id/messages')
  @UseGuards(JwtAuthGuard)
  async addComplaintMessage(
    @Param('id') complaintId: string,
    @Body() dto: ComplaintMessageDto,
    @Request() req: any,
  ) {
    const senderId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.addComplaintMessage(complaintId, senderId, dto);
  }

  /**
   * Admin: list all complaints.
   */
  @Get('admin/complaints')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getAllComplaints(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: DSAComplaintStatus,
    @Query('complaintType') complaintType?: DSAComplaintType,
  ) {
    return this.dsaService.getAllComplaints(
      parsePage(page),
      parseLimit(limit),
      { status, complaintType },
    );
  }

  // ============================================================================
  // MISUSE TRACKING — DSA Art. 23
  // ============================================================================

  /**
   * Flag a user for misuse of the notice-and-action mechanism.
   * DSA Art. 23: Platforms may suspend users who frequently submit unfounded notices.
   */
  @Post('admin/misuse/:userId')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async flagMisuse(
    @Param('userId') userId: string,
    @Body() dto: FlagMisuseDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.flagMisuse(userId, adminId, dto);
  }

  /**
   * Get a user's misuse status.
   */
  @Get('admin/misuse/:userId')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getUserMisuseStatus(@Param('userId') userId: string) {
    return this.dsaService.getUserMisuseStatus(userId);
  }

  /**
   * Lift a misuse flag (e.g., temporary suspension expired).
   */
  @Patch('admin/misuse/:recordId/lift')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async liftMisuseFlag(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.dsaService.liftMisuseFlag(recordId, adminId);
  }

  // ============================================================================
  // TRANSPARENCY — DSA Arts. 15, 24
  // ============================================================================

  /**
   * Get public transparency statistics.
   * DSA Art. 24: Platforms must publish transparency reports.
   */
  @Get('transparency')
  async getTransparencyStatistics() {
    return this.dsaService.getTransparencyStatistics();
  }

  /**
   * Admin: generate a transparency report for a given period.
   */
  @Post('admin/transparency/generate')
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async generateTransparencyReport(
    @Body() dto: GenerateTransparencyReportDto,
  ) {
    // A-M7: @IsDateString on the DTO rejects malformed dates at the boundary.
    // Also enforce a sensible range — periodEnd must not precede periodStart.
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    if (end < start) {
      throw new BadRequestException('periodEnd must not be earlier than periodStart');
    }
    return this.dsaService.generateTransparencyReport(start, end);
  }
}